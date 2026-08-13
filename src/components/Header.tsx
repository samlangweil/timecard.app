import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Download,
  Bell,
  User,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Eraser,
  Sun,
  Moon,
  Palette
} from 'lucide-react';
import { UserProfile, ReminderSettings } from '../types';
import { formatWeekRange } from '../utils/dateUtils';

interface HeaderProps {
  mondayDate: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  user: UserProfile;
  totalWeeklyHours: number;
  reminders: ReminderSettings;
  onOpenReport: () => void;
  onOpenReminders: () => void;
  onOpenProfile: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onResetData: () => void;
  onClearWeek: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mondayDate,
  onPrevWeek,
  onNextWeek,
  onToday,
  user,
  totalWeeklyHours,
  reminders,
  onOpenReport,
  onOpenReminders,
  onOpenProfile,
  onExportCSV,
  onExportPDF,
  onResetData,
  onClearWeek
}) => {
  const weekRangeText = formatWeekRange(mondayDate);
  const targetHours = user.targetWeeklyHours || 40;
  const isGoalMet = totalWeeklyHours >= targetHours;
  const remainingHours = targetHours - totalWeeklyHours;

  // Theme State & Effect
  const [theme, setTheme] = useState<'light' | 'dark' | 'warm'>(() => {
    return (localStorage.getItem('timecard_theme') as any) || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('timecard_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : prev === 'dark' ? 'warm' : 'light');
  };

  return (
    <header className="bg-white text-slate-800 border-b border-slate-200 sticky top-0 z-30 shadow-2xs font-sans transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          {/* App Branding & User Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  Workplace Timecard & Hours Tracker
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  {user.employeeName} • {user.department}
                </p>
              </div>
            </div>

            {/* Mobile Actions trigger profile */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                onClick={onOpenProfile}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
                title="Profile & Settings"
              >
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Week Selector Controls */}
          <div className="flex items-center justify-center bg-slate-100/80 rounded-2xl p-1 border border-slate-200 shadow-2xs">
            <button
              onClick={onPrevWeek}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-all"
              title="Previous Week"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={onToday}
              className="px-3 py-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:bg-white rounded-xl transition-all flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              Today
            </button>
            <span className="px-3 py-1 text-sm font-extrabold text-slate-800 min-w-[180px] text-center">
              {weekRangeText}
            </span>
            <button
              onClick={onNextWeek}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-all"
              title="Next Week"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics & Action Buttons */}
          <div className="flex items-center justify-end space-x-2 sm:space-x-3">

            {/* 40-Hour Goal Indicator Badge */}
            <div
              className={`hidden lg:flex items-center px-3 py-1.5 rounded-xl border text-xs font-bold gap-1.5 ${isGoalMet
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              title={isGoalMet ? `Target met! (+${(totalWeeklyHours - targetHours).toFixed(1)} hrs)` : `${remainingHours.toFixed(1)} hrs needed for 40h target`}
            >
              {isGoalMet ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{totalWeeklyHours.toFixed(1)} / {targetHours} hrs (Goal Met)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>{totalWeeklyHours.toFixed(1)} / {targetHours} hrs ({remainingHours.toFixed(1)}h left)</span>
                </>
              )}
            </div>

            {/* Reminders Button */}
            <button
              onClick={onOpenReminders}
              className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${reminders.enabled
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              title="7:30 AM & 6:00 PM Weekday Reminders"
            >
              <Bell className={`w-4 h-4 ${reminders.enabled ? 'text-indigo-600 animate-pulse' : ''}`} />
              <span className="hidden sm:inline">Reminders</span>
            </button>

            {/* Manager Report Button */}
            <button
              onClick={onOpenReport}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>Manager Timecard</span>
            </button>

            {/* Export Dropdown / Quick PDF */}
            <div className="flex items-center space-x-1 bg-slate-100 rounded-xl p-0.5 border border-slate-200">
              <button
                onClick={onExportPDF}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white rounded-lg transition-colors flex items-center gap-1"
                title="Export PDF Report"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                onClick={onExportCSV}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white rounded-lg transition-colors flex items-center gap-1"
                title="Export CSV Log"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">CSV</span>
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="hidden md:flex p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl transition-colors"
              title={`Switch Theme (Current: ${theme})`}
            >
              {theme === 'light' ? <Sun className="w-4 h-4" /> : theme === 'dark' ? <Moon className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
            </button>

            {/* Profile Settings */}
            <button
              onClick={onOpenProfile}
              className="hidden md:flex p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl transition-colors"
              title="Edit Profile & Target Hours"
            >
              <User className="w-4 h-4" />
            </button>

            {/* Clear Week Data */}
            <button
              onClick={onClearWeek}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-colors"
              title="Clear Current Week Data"
            >
              <Eraser className="w-4 h-4" />
            </button>

            {/* Reset Sample Data */}
            <button
              onClick={onResetData}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-transparent hover:border-slate-200 transition-colors"
              title="Reset Sample Data"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};