import React, { useState } from 'react';
import { DayLog } from '../types';
import { formatShortDate } from '../utils/dateUtils';
import { CategoryDetailModal } from './CategoryDetailModal';
import {
  Clock,
  Target,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  PieChart as PieChartIcon,
  CalendarOff,
  BarChart3,
  ChevronRight,
  ExternalLink,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface WeeklyDashboardProps {
  days: DayLog[];
  targetHours: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Projects': '#4f46e5',        // Indigo
  'Phone/Video Calls': '#0891b2',// Cyan
  'Urgent Matters': '#e11d48',   // Rose
  'Administrative': '#64748b',   // Slate
  'Meetings': '#8b5cf6',         // Purple
  'Development': '#059669',      // Emerald
  'Client Support': '#d97706',   // Amber
  'Other': '#94a3b8'            // Cool gray
};

export const WeeklyDashboard: React.FC<WeeklyDashboardProps> = ({ days, targetHours }) => {
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<string | null>(null);

  // 1. Calculate Total Active Hours (Including Off-Hours)
  const totalHours = days.reduce((acc, day) => acc + (day.totalActiveHours || 0), 0);
  const remainingHours = targetHours - totalHours;
  const isGoalMet = totalHours >= targetHours;
  const progressPercent = Math.min(100, Math.round((totalHours / targetHours) * 100));

  // 2. Count Working vs Non-Working Days
  const workingDays = days.filter(d => d.status === 'working');
  const nonWorkingDays = days.filter(d => d.status === 'non_working');

  // 3. Prepare Bar Chart Data (Daily Hours)
  const dailyBarData = days.map(day => {
    const dayLabel = formatShortDate(day.date).split(',')[0]; // Mon, Tue, etc.
    return {
      name: dayLabel,
      hours: day.totalActiveHours || 0, // Always grab the hours, even if off
      status: day.status,
      reason: day.nonWorkingReason || ''
    };
  });

  // 4. Prepare Task Category Division Data
  const categoryTotals: Record<string, number> = {};
  days.forEach(day => {
    if (day.tasks) { // Removed the 'working' status check so off-hour tasks count here too
      day.tasks.forEach(task => {
        categoryTotals[task.category] = (categoryTotals[task.category] || 0) + task.hours;
      });
    }
  });

  const categoryPieData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100,
    color: CATEGORY_COLORS[name] || '#64748b'
  }));

  const totalCategorizedHours = categoryPieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="mb-6 space-y-4 font-sans text-slate-800">

      {/* 40-HOUR GOAL NOTICE BANNER */}
      {!isGoalMet ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
              <AlertCircle className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2 text-amber-950">
                Weekly Hours Goal Status
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                  {remainingHours.toFixed(1)} hours remaining
                </span>
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                You have logged <strong className="font-semibold text-amber-950">{totalHours.toFixed(1)} active work hours</strong> this week. You need{' '}
                <strong className="underline font-semibold">{remainingHours.toFixed(1)} more hours</strong> to reach your {targetHours}-hour target.
              </p>
            </div>
          </div>

          <div className="w-full sm:w-48 bg-amber-200/60 rounded-full h-3.5 p-0.5 border border-amber-300 overflow-hidden shrink-0">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-900 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-950">
                Weekly Target Fulfilled
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  {(totalHours - targetHours) > 0 ? `+${(totalHours - targetHours).toFixed(1)}h overtime` : '100% Complete'}
                </span>
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Great job! You have logged <strong className="font-semibold text-emerald-950">{totalHours.toFixed(1)} hours</strong>, meeting your {targetHours}-hour weekly target.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* METRIC CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Weekly Hours */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Active Hours</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{totalHours.toFixed(1)} <span className="text-xs font-normal text-slate-500">hrs</span></span>
            <span className="text-xs font-medium text-slate-500">Target: {targetHours}h</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60">
            <div
              className={`h-full rounded-full transition-all duration-300 ${isGoalMet ? 'bg-emerald-500' : 'bg-indigo-600'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Working vs Non-Working Days */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Work Days / Non-Working</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl border border-slate-200">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{workingDays.length} <span className="text-xs font-normal text-slate-500">worked</span></span>
            <span className="text-xs font-bold text-amber-700 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              <CalendarOff className="w-3.5 h-3.5" />
              {nonWorkingDays.length} non-working
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 truncate">
            {nonWorkingDays.length > 0
              ? `Reasons: ${nonWorkingDays.map(d => d.nonWorkingReason || 'Off').join(', ')}`
              : 'Full 7-day working schedule'}
          </p>
        </div>

        {/* Average Hours Per Work Day */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Daily Average (Worked)</span>
            <div className="p-2 bg-cyan-50 text-cyan-700 rounded-xl border border-cyan-100">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {workingDays.length > 0 ? (totalHours / workingDays.length).toFixed(1) : '0.0'}{' '}
              <span className="text-xs font-normal text-slate-500">hrs/day</span>
            </span>
            <span className="text-xs text-slate-500">Standard: 8.0h</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Active work focused (excludes lunch)
          </p>
        </div>

        {/* Task Category Split */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tasks & Projects Logged</span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-xl border border-purple-100">
              <PieChartIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{totalCategorizedHours.toFixed(1)} <span className="text-xs font-normal text-slate-500">hrs</span></span>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
              {categoryPieData.length} categories
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Click pie chart sections to inspect daily hours
          </p>
        </div>

      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Daily Active Hours Bar Chart */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Daily Active Work Hours
              </h4>
              <p className="text-xs text-slate-500">Work hours logged for each day of the current week</p>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span> Working</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span> Non-Working</span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  unit="h"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs text-slate-800">
                          <p className="font-bold text-slate-900">{data.name}</p>
                          {data.status === 'working' ? (
                            <p className="text-indigo-600 font-semibold mt-1">{data.hours} active work hours</p>
                          ) : (
                            <p className="text-amber-700 font-semibold mt-1">Non-Working ({data.reason || 'Off'})</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                  {dailyBarData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.status === 'working' ? (entry.hours >= 8 ? '#4f46e5' : '#6366f1') : '#cbd5e1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Category Division Donut Chart & Legend */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-purple-600" />
                  Division of Time on Tasks
                </h4>
                <p className="text-xs text-slate-500">Click any section to inspect daily hours breakdown</p>
              </div>

              {categoryPieData.length > 0 && (
                <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <Info className="w-3 h-3" /> Click pie section
                </span>
              )}
            </div>

            {categoryPieData.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 items-center gap-4 mt-2">
                <div className="h-44 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        onClick={(entry) => setSelectedCategoryDetail(entry.name)}
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        {categoryPieData.map((entry, index) => (
                          <Cell key={`pie-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const pct = totalCategorizedHours > 0 ? ((data.value / totalCategorizedHours) * 100).toFixed(1) : 0;
                            return (
                              <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-lg text-xs">
                                <span className="font-bold" style={{ color: data.color }}>{data.name}</span>
                                <p className="text-slate-900 font-extrabold mt-0.5">{data.value} hrs ({pct}%)</p>
                                <p className="text-[10px] text-indigo-600 font-semibold mt-1 flex items-center gap-1">
                                  Click to view daily details <ChevronRight className="w-3 h-3" />
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Breakdown List */}
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {categoryPieData.map(item => {
                    const pct = totalCategorizedHours > 0 ? ((item.value / totalCategorizedHours) * 100).toFixed(0) : 0;
                    return (
                      <div
                        key={item.name}
                        onClick={() => setSelectedCategoryDetail(item.name)}
                        className="flex items-center justify-between text-xs py-1.5 px-2 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer group"
                        title={`Click to view daily breakdown for ${item.name}`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-800 font-semibold truncate group-hover:text-indigo-600 transition-colors">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-slate-900 font-extrabold">{item.value}h</span>
                          <span className="text-slate-500 font-mono text-[10px]">({pct}%)</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                <PieChartIcon className="w-8 h-8 mb-2 opacity-30 text-slate-400" />
                <p className="font-semibold text-slate-700">No task categories logged yet for this week.</p>
                <p className="text-[11px] text-slate-500 mt-1">Add tasks to day logs to see distribution here.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CATEGORY DETAIL MODAL */}
      <CategoryDetailModal
        isOpen={!!selectedCategoryDetail}
        onClose={() => setSelectedCategoryDetail(null)}
        selectedCategory={selectedCategoryDetail}
        allCategories={categoryPieData}
        onSelectCategory={(catName) => setSelectedCategoryDetail(catName)}
        days={days}
      />

    </section>
  );
};
