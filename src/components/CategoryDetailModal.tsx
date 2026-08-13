import React from 'react';
import { DayLog, TaskCategory } from '../types';
import { formatShortDate, formatFullDate } from '../utils/dateUtils';
import { 
  X, 
  PieChart as PieChartIcon, 
  Clock, 
  Tag, 
  Briefcase, 
  Calendar, 
  ChevronRight, 
  Layers,
  BarChart2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts';

interface CategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: string | null;
  allCategories: { name: string; value: number; color: string }[];
  onSelectCategory: (categoryName: string) => void;
  days: DayLog[];
}

export const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({
  isOpen,
  onClose,
  selectedCategory,
  allCategories,
  onSelectCategory,
  days
}) => {
  if (!isOpen || !selectedCategory) return null;

  const currentCatInfo = allCategories.find(c => c.name === selectedCategory) || {
    name: selectedCategory,
    value: 0,
    color: '#4f46e5'
  };

  const totalAllTaskHours = allCategories.reduce((sum, c) => sum + c.value, 0);
  const percentage = totalAllTaskHours > 0 ? ((currentCatInfo.value / totalAllTaskHours) * 100).toFixed(1) : '0';

  // Find all days that have tasks in this category
  const dailyBreakdown = days.map(day => {
    const dayLabel = formatShortDate(day.date).split(',')[0];
    const categoryTasks = (day.tasks || []).filter(t => t.category === selectedCategory);
    const dayCategoryHours = categoryTasks.reduce((sum, t) => sum + t.hours, 0);

    return {
      date: day.date,
      dayLabel,
      fullDateStr: formatShortDate(day.date),
      hours: Math.round(dayCategoryHours * 100) / 100,
      tasks: categoryTasks
    };
  });

  const activeDaysWithCategory = dailyBreakdown.filter(d => d.hours > 0);
  const totalTasksCount = activeDaysWithCategory.reduce((sum, d) => sum + d.tasks.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[90vh] text-slate-800">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div 
              className="p-2.5 rounded-xl text-white shadow-sm flex items-center justify-center"
              style={{ backgroundColor: currentCatInfo.color }}
            >
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-900">
                  {selectedCategory}
                </h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {percentage}% of task time
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily task breakdown and hours logged
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Switcher Tabs */}
        <div className="px-6 py-2.5 border-b border-slate-100 bg-slate-50/40 overflow-x-auto flex items-center space-x-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Categories:
          </span>
          {allCategories.map(cat => {
            const isSelected = cat.name === selectedCategory;
            return (
              <button
                key={cat.name}
                onClick={() => onSelectCategory(cat.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                <span>{cat.name}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  {cat.value}h
                </span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-500 block">Category Total</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">{currentCatInfo.value.toFixed(1)}</span>
                <span className="text-xs font-semibold text-slate-500">hours</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {percentage}% of total {totalAllTaskHours.toFixed(1)} task hours
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-500 block">Active Days</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">{activeDaysWithCategory.length}</span>
                <span className="text-xs font-semibold text-slate-500">days this week</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {activeDaysWithCategory.length > 0
                  ? `Avg ${(currentCatInfo.value / activeDaysWithCategory.length).toFixed(1)}h per active day`
                  : 'No active days logged'}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-500 block">Total Tasks Logged</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">{totalTasksCount}</span>
                <span className="text-xs font-semibold text-slate-500">items</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Individual task items
              </span>
            </div>

          </div>

          {/* Mini Daily Hours Chart */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              Daily Distribution for "{selectedCategory}"
            </h4>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="dayLabel" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#e2e8f0' }}
                    unit="h"
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-lg text-xs">
                            <p className="font-bold text-slate-900">{data.fullDateStr}</p>
                            <p className="font-semibold text-indigo-600 mt-0.5">
                              {data.hours} hrs spent on {selectedCategory}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                    {dailyBreakdown.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.hours > 0 ? currentCatInfo.color : '#e2e8f0'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Task Breakdown Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Daily Tasks & Projects Logged</span>
              <span className="text-slate-400 font-normal">
                {activeDaysWithCategory.length} day(s) with entries
              </span>
            </h4>

            {activeDaysWithCategory.length > 0 ? (
              <div className="space-y-3">
                {activeDaysWithCategory.map(dayItem => (
                  <div 
                    key={dayItem.date} 
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-sm text-slate-900">{dayItem.fullDateStr}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs font-mono">
                        {dayItem.hours.toFixed(1)} hrs logged
                      </span>
                    </div>

                    <div className="space-y-2">
                      {dayItem.tasks.map((task, idx) => (
                        <div 
                          key={task.id || idx}
                          className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <span className="font-bold text-slate-900 text-sm">{task.title}</span>
                              {task.projectName && (
                                <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-semibold text-[11px]">
                                  {task.projectName}
                                </span>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-slate-600 text-xs leading-relaxed">{task.description}</p>
                            )}
                          </div>

                          <div className="shrink-0 flex items-center space-x-2 self-start sm:self-center">
                            <span className="font-mono font-extrabold text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs text-xs">
                              {task.hours} hrs
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 text-center text-slate-500 space-y-2">
                <Tag className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                <p className="text-sm font-semibold text-slate-700">No hours logged for {selectedCategory} this week.</p>
                <p className="text-xs text-slate-500">Add tasks under this category in your day log editor to see details here.</p>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Done Viewing Category
          </button>
        </div>

      </div>
    </div>
  );
};
