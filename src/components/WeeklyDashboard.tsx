import React, { useState } from 'react';
import { DayLog } from '../types';
import { formatShortDate } from '../utils/dateUtils';
import { CategoryDetailModal } from './CategoryDetailModal';
import {
  Clock, Target, AlertCircle, CheckCircle2, Briefcase, PieChart as PieChartIcon, CalendarOff, BarChart3, ChevronRight, Info
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';

interface WeeklyDashboardProps {
  days: DayLog[];
  targetHours: number;
  annualPTOAllowance: number; // NEW
  usedPTOThisYear: number;    // NEW
}

const CATEGORY_COLORS: Record<string, string> = {
  'Projects': '#4f46e5', 'Phone/Video Calls': '#0891b2', 'Urgent Matters': '#e11d48',
  'Administrative': '#64748b', 'Meetings': '#8b5cf6', 'Development': '#059669',
  'Client Support': '#d97706', 'Other': '#94a3b8'
};

export const WeeklyDashboard: React.FC<WeeklyDashboardProps> = ({ days, targetHours, annualPTOAllowance, usedPTOThisYear }) => {
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<string | null>(null);

  const activeHours = days.reduce((acc, day) => acc + (day.totalActiveHours || 0), 0);
  const timeOffHours = days.reduce((acc, day) => acc + (day.timeOffHours || 0), 0);
  const totalHours = activeHours + timeOffHours;

  const remainingHours = Math.max(0, targetHours - totalHours);
  const isGoalMet = totalHours >= targetHours;
  const progressPercent = Math.min(100, Math.round((totalHours / targetHours) * 100));

  // PTO Math
  const remainingPTO = Math.max(0, annualPTOAllowance - usedPTOThisYear);
  const ptoPercent = Math.min(100, Math.round((usedPTOThisYear / annualPTOAllowance) * 100)) || 0;

  const workingDays = days.filter(d => d.status === 'working');
  const nonWorkingDays = days.filter(d => d.status === 'non_working');

  const dailyBarData = days.map(day => {
    const dayLabel = formatShortDate(day.date).split(',')[0];
    return {
      name: dayLabel,
      active: day.status === 'working' ? (day.totalActiveHours || 0) : 0,
      credited: day.timeOffHours || 0,
      status: day.status,
      reason: day.nonWorkingReason || ''
    };
  });

  const categoryTotals: Record<string, number> = {};
  days.forEach(day => {
    if (day.tasks) {
      day.tasks.forEach(task => {
        categoryTotals[task.category] = (categoryTotals[task.category] || 0) + task.hours;
      });
    }
  });

  const categoryPieData = Object.entries(categoryTotals).map(([name, value]) => ({
    name, value: Math.round(value * 100) / 100, color: CATEGORY_COLORS[name] || '#64748b'
  }));
  const totalCategorizedHours = categoryPieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="mb-6 space-y-4 font-sans text-slate-800">

      {/* TOP BANNERS GRID: Weekly Goal + PTO Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Weekly Goal Banner */}
        <div className="lg:col-span-2">
          {!isGoalMet ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 shadow-2xs h-full">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl"><AlertCircle className="w-5 h-5 shrink-0" /></div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2 text-amber-950">
                    Weekly Hours Goal Status <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">{remainingHours.toFixed(1)} hours remaining</span>
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    You have logged <strong className="font-semibold text-amber-950">{activeHours.toFixed(1)} active hours</strong>
                    {timeOffHours > 0 && <span> and <strong className="font-semibold text-amber-950">{timeOffHours.toFixed(1)} PTO/Credited hours</strong></span>}
                    this week. You need <strong className="underline font-semibold">{remainingHours.toFixed(1)} more hours</strong> to reach your {targetHours}-hour target.
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-48 bg-amber-200/60 rounded-full h-3.5 p-0.5 border border-amber-300 overflow-hidden shrink-0 mt-2 sm:mt-0">
                <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-900 shadow-2xs h-full">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl"><CheckCircle2 className="w-5 h-5 shrink-0" /></div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-950">
                    Weekly Target Fulfilled <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">{(totalHours - targetHours) > 0 ? `+${(totalHours - targetHours).toFixed(1)}h overtime` : '100% Complete'}</span>
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Great job! You have reached <strong className="font-semibold text-emerald-950">{totalHours.toFixed(1)} global hours</strong>, meeting your {targetHours}-hour weekly target.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* NEW: PTO Vault Banner */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-center shadow-2xs relative overflow-hidden h-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarOff className="w-4 h-4 text-indigo-600" />
              Annual PTO Vault
            </h3>
            <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
              {usedPTOThisYear.toFixed(1)}h Used
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-slate-900">{remainingPTO.toFixed(1)} <span className="text-xs font-normal text-slate-500">hrs left</span></span>
            <span className="text-xs font-medium text-slate-500">Allowance: {annualPTOAllowance}h</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60">
            <div className={`h-full rounded-full transition-all duration-300 ${ptoPercent > 90 ? 'bg-rose-500' : ptoPercent > 75 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${ptoPercent}%` }} />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Credited Hours</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100"><Clock className="w-4 h-4" /></div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{totalHours.toFixed(1)} <span className="text-xs font-normal text-slate-500">hrs</span></span>
            <span className="text-xs font-medium text-slate-500">Target: {targetHours}h</span>
          </div>
          {timeOffHours > 0 && (
            <p className="mt-1 text-[10px] text-slate-500 font-medium">{activeHours.toFixed(1)} Active + {timeOffHours.toFixed(1)} PTO</p>
          )}
          <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60">
            <div className={`h-full rounded-full transition-all duration-300 ${isGoalMet ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Work Days / Non-Working</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl border border-slate-200"><Briefcase className="w-4 h-4" /></div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{workingDays.length} <span className="text-xs font-normal text-slate-500">worked</span></span>
            <span className="text-xs font-bold text-amber-700 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              <CalendarOff className="w-3.5 h-3.5" />{nonWorkingDays.length} off
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Daily Average (Worked)</span>
            <div className="p-2 bg-cyan-50 text-cyan-700 rounded-xl border border-cyan-100"><BarChart3 className="w-4 h-4" /></div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{workingDays.length > 0 ? (activeHours / workingDays.length).toFixed(1) : '0.0'} <span className="text-xs font-normal text-slate-500">hrs/day</span></span>
            <span className="text-xs text-slate-500">Standard: 8.0h</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tasks & Projects Logged</span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-xl border border-purple-100"><PieChartIcon className="w-4 h-4" /></div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{totalCategorizedHours.toFixed(1)} <span className="text-xs font-normal text-slate-500">hrs</span></span>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">{categoryPieData.length} categories</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-indigo-600" /> Daily Breakdown</h4>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Working</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Credited PTO</span>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} unit="h" />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs text-slate-800">
                        <p className="font-bold text-slate-900">{data.name}</p>
                        {data.active > 0 && <p className="text-indigo-600 font-semibold mt-1">{data.active} active hrs</p>}
                        {data.credited > 0 && <p className="text-amber-600 font-semibold mt-1">{data.credited} credited hrs ({data.reason})</p>}
                        {data.active === 0 && data.credited === 0 && <p className="text-slate-500 font-semibold mt-1">Off</p>}
                      </div>
                    );
                  }
                  return null;
                }} />
                {/* Stacks active and credited on top of each other! */}
                <Bar dataKey="active" stackId="a" fill="#4f46e5" radius={[0, 0, 0, 0]} />
                <Bar dataKey="credited" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-purple-600" /> Division of Time</h4>
            </div>
            {categoryPieData.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 items-center gap-4 mt-2">
                <div className="h-44 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" onClick={(entry) => setSelectedCategoryDetail(entry.name)} className="cursor-pointer hover:opacity-90">
                        {categoryPieData.map((entry, index) => <Cell key={`pie-cell-${index}`} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                <PieChartIcon className="w-8 h-8 mb-2 opacity-30 text-slate-400" />
                <p className="font-semibold text-slate-700">No task categories logged yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <CategoryDetailModal isOpen={!!selectedCategoryDetail} onClose={() => setSelectedCategoryDetail(null)} selectedCategory={selectedCategoryDetail} allCategories={categoryPieData} onSelectCategory={(catName) => setSelectedCategoryDetail(catName)} days={days} />
    </section>
  );
};