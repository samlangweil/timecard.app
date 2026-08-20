/**
 * Workplace Weekly Timecard & Hour Tracker
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { DayLog, UserProfile, ReminderSettings, WorkStatus, TaskCategory } from './types';
import { initialUserProfile, initialReminderSettings, createSampleWeekLogs } from './data/mockData';
import {
  getWeekMonday,
  formatDateKey,
  shiftWeek,
  getDaysOfWeek
} from './utils/dateUtils';
import { exportToCSV, exportToPDF } from './utils/exportUtils';
import { Header } from './components/Header';
import { WeeklyDashboard } from './components/WeeklyDashboard';
import { DesktopCalendarView } from './components/DesktopCalendarView';
import { DayLogEditorModal } from './components/DayLogEditorModal';
import { ManagerReportModal } from './components/ManagerReportModal';
import { ReminderModal } from './components/ReminderModal';
import { UserProfileModal } from './components/UserProfileModal';
import { InAppReminderToast } from './components/InAppReminderToast';
import { ConfirmClearModal } from './components/ConfirmClearModal';
import { LiveTimerButton } from './components/LiveTimerButton';

export default function App() {
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [mondayDate, setMondayDate] = useState<Date>(() => getWeekMonday(new Date()));

  // State Variables 
  const [user, setUser] = useState<UserProfile>(initialUserProfile);
  const [reminders, setReminders] = useState<ReminderSettings>(initialReminderSettings);
  const [weekLogsMap, setWeekLogsMap] = useState<Record<string, DayLog[]>>({});
  const [activeSession, setActiveSession] = useState<{ clockInISO: string | null }>({ clockInISO: null });

  // Modals & UI State
  const [editingDay, setEditingDay] = useState<DayLog | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [calendarViewMode, setCalendarViewMode] = useState<'week' | 'list' | 'month'>('week');
  const [toast, setToast] = useState<{ id: string; type: 'clockIn' | 'clockOut'; title: string; message: string; time: string; } | null>(null);
  const [clearConfirm, setClearConfirm] = useState<{ type: 'day' | 'week'; dateStr?: string; } | null>(null);

  // CLOUD SYNC: Read
  useEffect(() => {
    const docRef = doc(db, 'appData', 'my-timecard');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.user) setUser(data.user);
        if (data.reminders) setReminders(data.reminders);
        if (data.activeSession) setActiveSession(data.activeSession);

        if (data.weekLogsMap) {
          setWeekLogsMap(data.weekLogsMap);
        } else {
          const initialKey = formatDateKey(getWeekMonday(new Date()));
          setWeekLogsMap({ [initialKey]: createSampleWeekLogs(getWeekMonday(new Date())) });
        }
      } else {
        const initialKey = formatDateKey(getWeekMonday(new Date()));
        const initialMap = { [initialKey]: createSampleWeekLogs(getWeekMonday(new Date())) };
        setWeekLogsMap(initialMap);
        setDoc(docRef, { user: initialUserProfile, reminders: initialReminderSettings, weekLogsMap: initialMap, activeSession: { clockInISO: null } });
      }
      setIsDbLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  // CLOUD SYNC: Write
  useEffect(() => {
    if (!isDbLoaded) return;
    const cleanUser = JSON.parse(JSON.stringify(user));
    setDoc(doc(db, 'appData', 'my-timecard'), { user: cleanUser }, { merge: true });
  }, [user, isDbLoaded]);

  useEffect(() => {
    if (!isDbLoaded) return;
    const cleanReminders = JSON.parse(JSON.stringify(reminders));
    setDoc(doc(db, 'appData', 'my-timecard'), { reminders: cleanReminders }, { merge: true });
  }, [reminders, isDbLoaded]);

  useEffect(() => {
    if (!isDbLoaded) return;
    const cleanWeekLogsMap = JSON.parse(JSON.stringify(weekLogsMap));
    setDoc(doc(db, 'appData', 'my-timecard'), { weekLogsMap: cleanWeekLogsMap }, { merge: true });
  }, [weekLogsMap, isDbLoaded]);

  useEffect(() => {
    if (!isDbLoaded) return;
    setDoc(doc(db, 'appData', 'my-timecard'), { activeSession }, { merge: true });
  }, [activeSession, isDbLoaded]);

  // Task Memory Engine
  const recentTasks = useMemo(() => {
    const tasksList: { title: string; category: TaskCategory; projectName?: string }[] = [];
    const seen = new Set<string>();

    const allDays: DayLog[] = [];
    Object.values(weekLogsMap).forEach((week) => {
      if (Array.isArray(week)) {
        allDays.push(...week);
      }
    });

    allDays.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    allDays.forEach(day => {
      const dayTasks = day.tasks || [];
      if (dayTasks.length === 0) return;

      [...dayTasks].reverse().forEach(t => {
        const titleSafe = t.title || '';
        const key = `${titleSafe.toLowerCase().trim()}-${t.category}`;

        if (!seen.has(key)) {
          seen.add(key);
          tasksList.push({ title: titleSafe, category: t.category, projectName: t.projectName });
        }
      });
    });

    return tasksList.slice(0, 8);
  }, [weekLogsMap]);

  // NEW: Annual PTO Calculator
  const usedPTOThisYear = useMemo(() => {
    let total = 0;
    const currentYear = new Date().getFullYear().toString();

    Object.values(weekLogsMap).forEach((week) => {
      if (Array.isArray(week)) {
        week.forEach(day => {
          if (day.date && day.date.startsWith(currentYear)) {
            total += (day.timeOffHours || 0);
          }
        });
      }
    });
    return total;
  }, [weekLogsMap]);

  if (!isDbLoaded) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold tracking-wider text-sm animate-pulse">SYNCING WITH CLOUD...</p>
      </div>
    );
  }

  const currentMondayKey = formatDateKey(mondayDate);
  const currentDays: DayLog[] = weekLogsMap[currentMondayKey] || (() => {
    return getDaysOfWeek(mondayDate).map(d => ({
      date: formatDateKey(d), status: 'working' as WorkStatus, startTime: '', endTime: '', totalActiveHours: 0, notes: '', tasks: [], breaks: []
    }));
  })();

  const totalWeeklyHours = currentDays.reduce((sum, d) => sum + (d.totalActiveHours || 0) + (d.timeOffHours || 0), 0);

  const handlePrevWeek = () => setMondayDate(prev => shiftWeek(prev, -1));
  const handleNextWeek = () => setMondayDate(prev => shiftWeek(prev, 1));
  const handleToday = () => setMondayDate(getWeekMonday(new Date()));

  const handleClockIn = () => {
    setActiveSession({ clockInISO: new Date().toISOString() });
  };

  const handleClockOut = () => {
    if (!activeSession.clockInISO) return;

    const exactClockInDate = new Date(activeSession.clockInISO);
    const exactClockOutDate = new Date();

    const roundDownTo15 = (date: Date) => {
      const rounded = new Date(date);
      rounded.setMinutes(Math.floor(rounded.getMinutes() / 15) * 15);
      rounded.setSeconds(0);
      rounded.setMilliseconds(0);
      return rounded;
    };

    const clockInDate = roundDownTo15(exactClockInDate);
    const clockOutDate = roundDownTo15(exactClockOutDate);

    const todayOut = new Date();
    const todayKey = formatDateKey(todayOut);
    const todayMonday = getWeekMonday(todayOut);
    const mondayKey = formatDateKey(todayMonday);

    const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    let updatedTargetDay: DayLog | null = null;

    setWeekLogsMap(prev => {
      const week = prev[mondayKey] || createSampleWeekLogs(todayMonday);
      const updatedWeek = week.map(d => {
        if (d.date === todayKey) {
          const newStart = d.startTime || formatTime(clockInDate);
          const newEnd = formatTime(clockOutDate);
          updatedTargetDay = { ...d, status: 'working', startTime: newStart, endTime: newEnd };
          return updatedTargetDay;
        }
        return d;
      });
      return { ...prev, [mondayKey]: updatedWeek };
    });

    setActiveSession({ clockInISO: null });

    if (updatedTargetDay) {
      setMondayDate(todayMonday);
      setEditingDay(updatedTargetDay);
    }
  };

  const getPreviousDayLog = (currentDateStr: string): DayLog | null => {
    const [y, m, d] = currentDateStr.split('-').map(Number);
    const prevDate = new Date(y, m - 1, d - 1);
    const prevKey = formatDateKey(prevDate);
    const prevMondayKey = formatDateKey(getWeekMonday(prevDate));

    if (prevMondayKey === currentMondayKey) return currentDays.find(day => day.date === prevKey) || null;
    const prevWeek = weekLogsMap[prevMondayKey];
    if (prevWeek) return prevWeek.find(day => day.date === prevKey) || null;
    return null;
  };

  const previousDayLog = editingDay ? getPreviousDayLog(editingDay.date) : null;

  const handleSaveDayLog = (updatedLog: DayLog) => {
    const updatedWeek = currentDays.map(d => d.date === updatedLog.date ? updatedLog : d);
    setWeekLogsMap(prev => ({ ...prev, [currentMondayKey]: updatedWeek }));
  };

  const handleQuickToggleStatus = (dateStr: string, newStatus: WorkStatus) => {
    const updatedWeek = currentDays.map(d => {
      if (d.date === dateStr) {
        return { ...d, status: newStatus, totalActiveHours: 0, startTime: '', endTime: '', nonWorkingReason: newStatus === 'non_working' ? 'PTO / Vacation' : '' };
      }
      return d;
    });
    setWeekLogsMap(prev => ({ ...prev, [currentMondayKey]: updatedWeek }));
  };

  const handleClearDay = (dateStr: string) => {
    const updatedWeek = currentDays.map(d => {
      if (d.date === dateStr) {
        return { ...d, status: 'working' as WorkStatus, startTime: '', endTime: '', totalActiveHours: 0, timeOffHours: 0, notes: '', tasks: [], breaks: [], nonWorkingReason: '', isManualHoursOverride: false };
      }
      return d;
    });
    setWeekLogsMap(prev => ({ ...prev, [currentMondayKey]: updatedWeek }));
  };

  const handleClearWeek = () => {
    const clearedWeek = currentDays.map(d => ({
      ...d, status: 'working' as WorkStatus, startTime: '', endTime: '', totalActiveHours: 0, timeOffHours: 0, notes: '', tasks: [], breaks: [], nonWorkingReason: '', isManualHoursOverride: false
    }));
    setWeekLogsMap(prev => ({ ...prev, [currentMondayKey]: clearedWeek }));
  };

  const handleResetData = () => {
    const thisWeekMonday = getWeekMonday(new Date());
    const initialKey = formatDateKey(thisWeekMonday);
    setMondayDate(thisWeekMonday);
    setWeekLogsMap({ [initialKey]: createSampleWeekLogs(thisWeekMonday) });
  };

  const handleTriggerTestReminder = (type: 'clockIn' | 'clockOut') => {
    if (type === 'clockIn') {
      setToast({ id: `toast-${Date.now()}`, type: 'clockIn', title: 'Morning Clock-In Reminder', message: 'It is 7:30 AM! Time to log your active work start time.', time: reminders.clockInTime || '07:30' });
    } else {
      setToast({ id: `toast-${Date.now()}`, type: 'clockOut', title: 'Evening Clock-Out Reminder', message: 'It is 6:00 PM! Remember to log your active work end time.', time: reminders.clockOutTime || '18:00' });
    }
  };

  const handleActionLogTodayTime = () => {
    const todayStr = formatDateKey(new Date());
    const todayLog = currentDays.find(d => d.date === todayStr);
    if (todayLog) {
      setEditingDay(todayLog);
    } else {
      const todayMonday = getWeekMonday(new Date());
      setMondayDate(todayMonday);
      const todayKey = formatDateKey(todayMonday);
      const newWeekDays = weekLogsMap[todayKey] || createSampleWeekLogs(todayMonday);
      const targetDay = newWeekDays.find(d => d.date === todayStr) || { date: todayStr, status: 'working', startTime: '', endTime: '', totalActiveHours: 0, notes: '', tasks: [], breaks: [] };
      setEditingDay(targetDay);
    }
  };

  return (
    <div className="min-h-screen text-slate-800 flex flex-col font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-300">
      <Header
        mondayDate={mondayDate} onPrevWeek={handlePrevWeek} onNextWeek={handleNextWeek} onToday={handleToday}
        user={user} totalWeeklyHours={totalWeeklyHours} reminders={reminders}
        onOpenReport={() => setIsReportOpen(true)} onOpenReminders={() => setIsRemindersOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)} onExportCSV={() => exportToCSV(currentDays, user, mondayDate)}
        onExportPDF={() => exportToPDF(currentDays, user, mondayDate, calendarViewMode === 'barebones' ? 'barebones' : 'detailed')}
        onResetData={handleResetData} onClearWeek={() => setClearConfirm({ type: 'week' })}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <LiveTimerButton clockInISO={activeSession.clockInISO} onClockIn={handleClockIn} onClockOut={handleClockOut} />

        {/* WeeklyDashboard updated to pass the new PTO metrics */}
        <WeeklyDashboard
          days={currentDays}
          targetHours={user.targetWeeklyHours || 40}
          annualPTOAllowance={user.annualPTOAllowance || 120}
          usedPTOThisYear={usedPTOThisYear}
        />

        <DesktopCalendarView
          days={currentDays} mondayDate={mondayDate}
          onEditDay={(day) => setEditingDay(day)} onQuickToggleStatus={handleQuickToggleStatus}
          onSelectDate={(date) => setMondayDate(getWeekMonday(date))} onClearDay={(dateStr) => setClearConfirm({ type: 'day', dateStr })}
          viewMode={calendarViewMode} onViewModeChange={setCalendarViewMode}
        />
      </main>

      {editingDay && <DayLogEditorModal isOpen={!!editingDay} onClose={() => setEditingDay(null)} dayLog={editingDay} onSave={handleSaveDayLog} previousDayLog={previousDayLog} recentTasks={recentTasks} />}
      <ManagerReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} days={currentDays} user={user} mondayDate={mondayDate} />
      <ReminderModal isOpen={isRemindersOpen} onClose={() => setIsRemindersOpen(false)} reminders={reminders} onSaveReminders={(updated) => setReminders(updated)} onTriggerTestReminder={handleTriggerTestReminder} />
      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user} onSaveProfile={(updated) => setUser(updated)} />
      <ConfirmClearModal isOpen={!!clearConfirm} type={clearConfirm?.type || 'day'} dateStr={clearConfirm?.dateStr} onConfirm={() => { if (clearConfirm?.type === 'day' && clearConfirm.dateStr) { handleClearDay(clearConfirm.dateStr); } else if (clearConfirm?.type === 'week') { handleClearWeek(); } setClearConfirm(null); }} onCancel={() => setClearConfirm(null)} />
      <InAppReminderToast toast={toast} onDismiss={() => setToast(null)} onActionLogTime={handleActionLogTodayTime} soundEnabled={reminders.soundEnabled} />
    </div>
  );
}