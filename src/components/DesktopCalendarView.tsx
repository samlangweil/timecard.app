import React, { useState } from 'react';
import { DayLog, WorkStatus } from '../types';
import {
  formatShortDate,
  format12HourTime,
  formatDateKey,
  getDaysOfWeek,
  generateDailyTimeline
} from '../utils/dateUtils';
import {
  Clock,
  Edit3,
  Calendar as CalendarIcon,
  CalendarOff,
  CheckCircle2,
  Grid,
  Eraser,
  AlignJustify,
  Coffee
} from 'lucide-react';
import { isToday, format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';

interface DesktopCalendarViewProps {
  days: DayLog[];
  mondayDate: Date;
  onEditDay: (dayLog: DayLog) => void;
  onQuickToggleStatus: (dateStr: string, newStatus: WorkStatus) => void;
  onSelectDate: (date: Date) => void;
  onClearDay: (dateStr: string) => void;
}

export const DesktopCalendarView: React.FC<DesktopCalendarViewProps> = ({
  days,
  mondayDate,
  onEditDay,
  onQuickToggleStatus,
  onSelectDate,
  onClearDay,
}) => {
  const [viewMode, setViewMode] = useState<'week' | 'list' | 'month'>('week');

  const weekDays = getDaysOfWeek(mondayDate);
  const monthStart = startOfMonth(mondayDate);
  const monthEnd = endOfMonth(mondayDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayPadding = (getDay(monthStart) + 6) % 7;

  return (
    <div className="space-y-4 font-sans text-slate-800">

      {/* View Header & Mode Switcher */}
      <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
        <button
          onClick={() => setViewMode('week')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${viewMode === 'week' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          <Grid className="w-3.5 h-3.5" /> Kanban
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          <AlignJustify className="w-3.5 h-3.5" /> List
        </button>
        <button
          onClick={() => setViewMode('month')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${viewMode === 'month' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" /> Month
        </button>
      </div>

      {/* WEEK GRID VIEW */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3.5">
          {weekDays.map((dateObj) => {
            const dateKey = formatDateKey(dateObj);
            const dayLog = days.find(d => d.date === dateKey) || {
              date: dateKey, status: 'working' as WorkStatus, startTime: '', endTime: '', totalActiveHours: 0, notes: '', tasks: [], breaks: []
            };

            const dayIsToday = isToday(dateObj);
            const isWorking = dayLog.status === 'working';
            const dayOfWeekName = format(dateObj, 'EEE');
            const dayNum = format(dateObj, 'MMM d');
            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

            const timeline = generateDailyTimeline(dayLog);

            return (
              <div
                key={dateKey}
                className={`flex flex-col justify-between rounded-2xl border transition-all duration-200 bg-white shadow-2xs overflow-hidden ${dayIsToday ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-indigo-500/10' : isWorking ? 'border-slate-200/90 hover:border-slate-300' : 'border-slate-200 bg-slate-50/60'
                  }`}
              >
                <div className={`p-3 border-b flex items-center justify-between ${dayIsToday ? 'bg-indigo-50/80 border-indigo-200' : isWeekend ? 'bg-slate-100/70 border-slate-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{dayOfWeekName}</span>
                    <h3 className="text-sm font-extrabold text-slate-900">{dayNum}</h3>
                  </div>
                  {dayIsToday ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white shadow-2xs">TODAY</span>
                  ) : isWeekend && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-600">WEEKEND</span>
                  )}
                </div>

                <div className="p-3 space-y-3 flex-1">
                  {isWorking ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Working
                        </span>
                        <span className="font-black text-slate-900 text-sm">
                          {dayLog.totalActiveHours.toFixed(1)} <span className="text-[11px] font-normal text-slate-500">hrs</span>
                        </span>
                      </div>
                      <div className="flex items-center text-[11px] text-slate-600 font-mono pt-1 border-t border-slate-200 gap-1">
                        <Clock className="w-3 h-3 text-indigo-600 shrink-0" />
                        <span>{format12HourTime(dayLog.startTime)} – {format12HourTime(dayLog.endTime)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-800 flex items-center gap-1">
                          <CalendarOff className="w-3.5 h-3.5 text-amber-600" /> Not Working
                        </span>
                        <span className={`font-bold text-xs ${dayLog.totalActiveHours > 0 ? 'text-indigo-600' : 'text-slate-500'}`}>
                          {dayLog.totalActiveHours > 0 ? `${dayLog.totalActiveHours.toFixed(1)} hrs` : '0.0 hrs'}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-amber-900 truncate pt-0.5">
                        {dayLog.nonWorkingReason || 'Reason not specified'}
                      </p>
                    </div>
                  )}

                  {timeline.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                        <span>Timeline Log</span>
                      </div>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
                        {timeline.map((event) => (
                          event.type === 'task' ? (
                            <div key={event.id} className="bg-slate-50 hover:bg-slate-100 rounded-lg p-1.5 border border-slate-200 text-xs flex items-center justify-between gap-1 transition-colors">
                              <div className="flex flex-col truncate">
                                <span className="truncate text-slate-800 font-medium text-[11px]" title={event.title}>{event.title}</span>
                                <span className="text-[9px] text-slate-500 font-mono mt-0.5">{event.timeDisplay}</span>
                              </div>
                              <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold shrink-0">{event.hours}h</span>
                            </div>
                          ) : (
                            <div key={event.id} className="bg-orange-50/80 rounded-lg p-1.5 border border-orange-200/80 text-xs flex items-center justify-between gap-1">
                              <div className="flex flex-col truncate">
                                <span className="truncate text-orange-900 font-medium text-[11px] flex items-center gap-1" title={event.title}>
                                  <Coffee className="w-3 h-3 shrink-0" /> {event.title}
                                </span>
                                <span className="text-[9px] text-orange-700 font-mono mt-0.5">{event.timeDisplay}</span>
                              </div>
                              <span className="px-1.5 py-0.2 rounded bg-orange-200 text-orange-900 text-[10px] font-bold shrink-0">{event.hours}h</span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {dayLog.notes && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] text-slate-600 line-clamp-2">
                      <strong className="text-slate-800 font-bold">Notes:</strong> {dayLog.notes}
                    </div>
                  )}
                </div>

                <div className="p-2 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between gap-1">
                  <button
                    onClick={() => onEditDay(dayLog)}
                    className="flex-1 py-1.5 px-2 bg-white hover:bg-indigo-600 border border-slate-200 hover:border-indigo-600 text-slate-700 hover:text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Log / Edit</span>
                  </button>
                  <button
                    onClick={() => onClearDay(dateKey)}
                    className="py-1.5 px-2 bg-white hover:bg-rose-600 border border-slate-200 hover:border-rose-600 text-slate-400 hover:text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1"
                    title="Clear this day's data"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="flex flex-col gap-3">
          {weekDays.map((dateObj) => {
            const dateKey = formatDateKey(dateObj);
            const dayLog = days.find(d => d.date === dateKey) || {
              date: dateKey, status: 'working' as WorkStatus, startTime: '', endTime: '', totalActiveHours: 0, notes: '', tasks: [], breaks: []
            };
            const dayIsToday = isToday(dateObj);
            const isWorking = dayLog.status === 'working';
            const timeline = generateDailyTimeline(dayLog);

            return (
              <div key={dateKey} className={`flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl border transition-all ${dayIsToday ? 'border-indigo-500 bg-indigo-50/30' : 'bg-white border-slate-200 shadow-2xs'
                }`}>

                <div className="flex items-center gap-4 w-full sm:w-1/4">
                  <div className="text-center w-14">
                    <div className="text-xs font-bold uppercase text-slate-500">{format(dateObj, 'EEE')}</div>
                    <div className="text-lg font-extrabold text-slate-900">{format(dateObj, 'd')}</div>
                  </div>
                  {isWorking ? (
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-bold">
                      {dayLog.totalActiveHours.toFixed(1)} hrs
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">
                      {dayLog.totalActiveHours > 0 ? `Off (+${dayLog.totalActiveHours.toFixed(1)}h)` : 'Off'}
                    </span>
                  )}
                </div>

                <div className="flex-1 px-4 text-xs text-slate-600 w-full mt-3 sm:mt-0">
                  {timeline.length > 0 ? (
                    <div>
                      <span className="font-bold text-slate-700 mb-1.5 inline-block">Timeline:</span>
                      <ul className="space-y-1.5 ml-1">
                        {timeline.map(event => (
                          <li key={event.id} className="flex items-start gap-2">
                            {event.type === 'task' ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></span>
                            ) : (
                              <Coffee className="w-3 h-3 text-orange-500 mt-0.5 shrink-0" />
                            )}
                            <span className="leading-tight flex flex-col">
                              <span className={event.type === 'break' ? 'text-orange-900 font-medium' : ''}>
                                {event.title} <span className={`font-bold ${event.type === 'break' ? 'text-orange-700' : 'text-indigo-700'}`}>({event.hours} hrs)</span>
                              </span>
                              <span className={`${event.type === 'break' ? 'text-orange-600' : 'text-slate-500'} text-[10px] font-mono mt-0.5`}>
                                {event.timeDisplay}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : !isWorking ? (
                    <div className="italic">{dayLog.nonWorkingReason || 'No reason specified'}</div>
                  ) : (
                    <div className="italic text-slate-400">No events logged</div>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                  <button onClick={() => onEditDay(dayLog)} className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 rounded-lg text-xs font-bold transition-colors">
                    Edit
                  </button>
                  <button onClick={() => onClearDay(dateKey)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                    <Eraser className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MONTH OVERVIEW VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Month of {format(mondayDate, 'MMMM yyyy')}</h3>
            <p className="text-xs text-slate-500">Click any date to switch week and log active hours</p>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 mb-2">
            <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: startDayPadding }).map((_, i) => (
              <div key={`pad-${i}`} className="h-16 rounded-xl bg-slate-50 opacity-40 border border-dashed border-slate-200" />
            ))}
            {monthDays.map(date => {
              const dateKey = formatDateKey(date);
              const dayLog = days.find(d => d.date === dateKey);
              const dayIsToday = isToday(date);
              return (
                <button
                  key={dateKey}
                  onClick={() => {
                    onSelectDate(date);
                    if (dayLog) onEditDay(dayLog);
                  }}
                  className={`h-20 p-2 rounded-xl border text-left flex flex-col justify-between transition-all hover:border-indigo-500 hover:bg-slate-50 ${dayIsToday ? 'border-indigo-500 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-500 font-bold' : dayLog?.status === 'working' ? 'border-slate-200 bg-white text-slate-800' : 'border-slate-200 bg-slate-50/50 text-slate-500'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${dayIsToday ? 'text-indigo-600' : 'text-slate-800'}`}>{format(date, 'd')}</span>
                    {dayLog?.status === 'working' && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">{dayLog.totalActiveHours}h</span>
                    )}
                    {dayLog?.status === 'non_working' && (
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1 py-0.2 rounded">Off</span>
                    )}
                  </div>
                  <div className="text-[10px] truncate text-slate-500">
                    {dayLog?.status === 'working' ? `${format12HourTime(dayLog.startTime)}` : dayLog?.nonWorkingReason || ''}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};