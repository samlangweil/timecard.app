/**
 * Workplace Weekly Timecard & Hour Tracker
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { DayLog, UserProfile, ReminderSettings, WorkStatus } from './types';
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

export default function App() {
  // Database Loading State
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  // Current week selection
  const [mondayDate, setMondayDate] = useState<Date>(() => getWeekMonday(new Date()));

  // State Variables 
  const [user, setUser] = useState<UserProfile>(initialUserProfile);
  const [reminders, setReminders] = useState<ReminderSettings>(initialReminderSettings);
  const [weekLogsMap, setWeekLogsMap] = useState<Record<string, DayLog[]>>({});

  // Modals & UI State
  const [editingDay, setEditingDay] = useState<DayLog | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [toast, setToast] = useState<{ id: string; type: 'clockIn' | 'clockOut'; title: string; message: string; time: string; } | null>(null);
  const [clearConfirm, setClearConfirm] = useState<{ type: 'day' | 'week'; dateStr?: string; } | null>(null);

  // ==========================================
  // 1. CLOUD SYNC: Read from Firebase (Real-time)
  // ==========================================
  useEffect(() => {
    const docRef = doc(db, 'appData', 'my-timecard');

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.user) setUser(data.user);
        if (data.reminders) setReminders(data.reminders);

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
        setDoc(docRef, { user: initialUserProfile, reminders: initialReminderSettings, weekLogsMap: initialMap });
      }
      setIsDbLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  // ==========================================
  // 2. CLOUD SYNC: Write to Firebase (Sanitized)
  // ==========================================
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

  // Show loading screen while connecting to cloud
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

  const totalWeeklyHours = currentDays.reduce((sum, d) => sum + (d.totalActiveHours || 0), 0);

  const handlePrevWeek = () => setMondayDate(prev => shiftWeek(prev, -1));
  const handleNextWeek = () => setMondayDate(prev => shiftWeek(prev, 1));
  const handleToday = () => setMondayDate(getWeekMonday(new Date()));

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
        return { ...d, status: 'working' as WorkStatus, startTime: '', endTime: '', totalActiveHours: 0, notes: '', tasks: [], breaks: [], nonWorkingReason: '', isManualHoursOverride: false };
      }
      return d;
    });
    setWeekLogsMap(prev => ({ ...prev, [currentMondayKey]: updatedWeek }));
  };

  const handleClearWeek = () => {
    const clearedWeek = currentDays.map(d => ({
      ...d, status: 'working' as WorkStatus, startTime: '', endTime: '', totalActiveHours: 0, notes: '', tasks: [], breaks: [], nonWorkingReason: '', isManualHoursOverride: false
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
        onExportPDF={() => exportToPDF(currentDays, user, mondayDate, true)} onResetData={handleResetData} onClearWeek={() => setClearConfirm({ type: 'week' })}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <WeeklyDashboard days={currentDays} targetHours={user.targetWeeklyHours || 40} />
        <DesktopCalendarView days={currentDays} mondayDate={mondayDate} onEditDay={(day) => setEditingDay(day)} onQuickToggleStatus={handleQuickToggleStatus} onSelectDate={(date) => setMondayDate(getWeekMonday(date))} onClearDay={(dateStr) => setClearConfirm({ type: 'day', dateStr })} />
      </main>

      {editingDay && <DayLogEditorModal isOpen={!!editingDay} onClose={() => setEditingDay(null)} dayLog={editingDay} onSave={handleSaveDayLog} />}
      <ManagerReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} days={currentDays} user={user} mondayDate={mondayDate} />
      <ReminderModal isOpen={isRemindersOpen} onClose={() => setIsRemindersOpen(false)} reminders={reminders} onSaveReminders={(updated) => setReminders(updated)} onTriggerTestReminder={handleTriggerTestReminder} />
      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user} onSaveProfile={(updated) => setUser(updated)} />
      <ConfirmClearModal isOpen={!!clearConfirm} type={clearConfirm?.type || 'day'} dateStr={clearConfirm?.dateStr} onConfirm={() => { if (clearConfirm?.type === 'day' && clearConfirm.dateStr) { handleClearDay(clearConfirm.dateStr); } else if (clearConfirm?.type === 'week') { handleClearWeek(); } setClearConfirm(null); }} onCancel={() => setClearConfirm(null)} />
      <InAppReminderToast toast={toast} onDismiss={() => setToast(null)} onActionLogTime={handleActionLogTodayTime} soundEnabled={reminders.soundEnabled} />
    </div>
  );
}