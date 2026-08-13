import React, { useState, useEffect } from 'react';
import { DayLog, WorkStatus, NonWorkingReason, TaskCategory, TaskItem, BreakItem } from '../types';
import { Coffee } from 'lucide-react';
import { formatFullDate, calculateActiveHours, getTaskTimeRange } from '../utils/dateUtils';
import { generateDailySummary } from '../utils/aiSummary';
import {
  X,
  Clock,
  Calendar,
  Plus,
  Trash2,
  Sparkles,
  Check,
  AlertTriangle,
  Briefcase,
  FileText,
  Tag,
  HelpCircle
} from 'lucide-react';

interface DayLogEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayLog: DayLog;
  onSave: (updatedDayLog: DayLog) => void;
}

const REASONS: NonWorkingReason[] = [
  'PTO / Vacation',
  'Sick Leave',
  'Sick',
  'Weekend',
  'Off',
  'Company Holiday',
  'Doctor Appointment',
  'Personal Leave',
  'Remote Travel',
  'Training / Conference',
  'Other'
];

const CATEGORIES: TaskCategory[] = [
  'Projects',
  'Phone/Video Calls',
  'Urgent Matters',
  'Administrative',
  'Meetings',
  'Development',
  'Client Support',
  'Other'
];

export const DayLogEditorModal: React.FC<DayLogEditorModalProps> = ({
  isOpen,
  onClose,
  dayLog,
  onSave
}) => {
  const [status, setStatus] = useState<WorkStatus>(dayLog.status);
  const [nonWorkingReason, setNonWorkingReason] = useState<string>(dayLog.nonWorkingReason || 'PTO / Vacation');
  const [customReason, setCustomReason] = useState<string>('');
  const [startTime, setStartTime] = useState<string>(dayLog.startTime || '');
  const [endTime, setEndTime] = useState<string>(dayLog.endTime || '');
  const [totalActiveHours, setTotalActiveHours] = useState<number>(dayLog.totalActiveHours || 0);
  const [isManualOverride, setIsManualOverride] = useState<boolean>(dayLog.isManualHoursOverride || false);
  const [notes, setNotes] = useState<string>(dayLog.notes || '');
  const [tasks, setTasks] = useState<TaskItem[]>(dayLog.tasks || []);
  const [breaks, setBreaks] = useState<BreakItem[]>(dayLog.breaks || []);
  const [newBreakStart, setNewBreakStart] = useState('');
  const [newBreakEnd, setNewBreakEnd] = useState('');
  const [newBreakReason, setNewBreakReason] = useState('Lunch');

  // Form state for adding a new task
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('Projects');
  const [newTaskProject, setNewTaskProject] = useState('');
  const [newTaskHours, setNewTaskHours] = useState<number>(1.0);
  const [newTaskDesc, setNewTaskDesc] = useState('');

  // Sync state when modal opens with a new dayLog
  useEffect(() => {
    setStatus(dayLog.status);
    setNonWorkingReason(dayLog.nonWorkingReason || 'PTO / Vacation');
    setStartTime(dayLog.startTime || '');
    setEndTime(dayLog.endTime || '');
    setTotalActiveHours(dayLog.totalActiveHours || 0);
    setIsManualOverride(dayLog.isManualHoursOverride || false);
    setNotes(dayLog.notes || '');
    setTasks(dayLog.tasks || []);
    setBreaks(dayLog.breaks || []);
  }, [dayLog]);

  // Recalculate active hours when start/end time changes if not manually overridden
  useEffect(() => {
    if (status === 'working' && !isManualOverride) {
      const computed = calculateActiveHours(startTime, endTime, breaks);
      setTotalActiveHours(computed);
    }
  }, [startTime, endTime, breaks, status, isManualOverride]);

  // Break Handlers
  const handleAddBreak = () => {
    if (!newBreakStart || !newBreakEnd) return;
    const item: BreakItem = {
      id: `break-${Date.now()}`,
      startTime: newBreakStart,
      endTime: newBreakEnd,
      reason: newBreakReason.trim() || 'Break'
    };
    setBreaks([...breaks, item]);
    setNewBreakStart('');
    setNewBreakEnd('');
    setNewBreakReason('Lunch');
  };

  const handleDeleteBreak = (id: string) => {
    setBreaks(breaks.filter(b => b.id !== id));
  };

  if (!isOpen) return null;

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const item: TaskItem = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      projectName: newTaskProject.trim() || undefined,
      hours: Number(newTaskHours) || 0.5,
      description: newTaskDesc.trim() || undefined
    };

    setTasks([...tasks, item]);
    setNewTaskTitle('');
    setNewTaskProject('');
    setNewTaskDesc('');
    setNewTaskHours(1.0);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const handleAutoGenerateSummary = () => {
    const tempLog: DayLog = {
      date: dayLog.date,
      status,
      nonWorkingReason: nonWorkingReason === 'Other' ? customReason : nonWorkingReason,
      startTime,
      endTime,
      totalActiveHours,
      notes,
      tasks
    };

    const generated = generateDailySummary(tempLog);
    setNotes(generated);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalReason = status === 'non_working'
      ? (nonWorkingReason === 'Other' && customReason ? customReason : nonWorkingReason)
      : undefined;

    const updated: DayLog = {
      ...dayLog,
      status,
      nonWorkingReason: finalReason,
      startTime: status === 'working' ? startTime : '',
      endTime: status === 'working' ? endTime : '',
      // If working, use the calculated time. If not working, sum up the off-hour tasks!
      totalActiveHours: status === 'working' ? totalActiveHours : tasks.reduce((sum, t) => sum + t.hours, 0),
      isManualHoursOverride: isManualOverride,
      notes,
      tasks: tasks, // Keep tasks unconditionally
      breaks: status === 'working' ? breaks : []
    };

    onSave(updated);
    onClose();
  };

  const totalTaskHoursSum = tasks.reduce((sum, t) => sum + t.hours, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto font-sans text-slate-800">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Log Workplace Hours & Tasks
              </h3>
              <p className="text-xs text-slate-500">
                {formatFullDate(dayLog.date)}
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

        {/* Modal Form */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

          {/* Status Switcher (Working vs Non-Working) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Workplace Status for Date</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('working')}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${status === 'working'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Working Day</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('non_working')}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${status === 'non_working'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <Clock className="w-4 h-4" />
                <span>Not Working</span>
              </button>
            </div>
          </div>

          {/* NON-WORKING REASON SECTION */}
          {status === 'non_working' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Reason for Not Working
              </h4>
              <p className="text-xs text-amber-800">
                This notice will be recorded on your manager timecard report for days without active work hours.
              </p>

              <div>
                <select
                  value={nonWorkingReason}
                  onChange={(e) => setNonWorkingReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {nonWorkingReason === 'Other' && (
                <div>
                  <input
                    type="text"
                    placeholder="Specify custom reason (e.g. Jury Duty, Emergency Leave)"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* WORKING HOURS SECTION */}
          {status === 'working' && (
            <div className="space-y-4">

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    Active Work Hours (Start / End Time)
                  </h4>
                  <span className="text-xs font-bold text-indigo-800 bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200">
                    Calculated: {totalActiveHours.toFixed(1)} hrs
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Start Time (Clock In)</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">End Time (Clock Out)</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span className="text-[11px] italic flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Excludes lunch breaks & pauses.
                  </span>

                  <label className="flex items-center space-x-2 text-[11px] cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isManualOverride}
                      onChange={(e) => setIsManualOverride(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                    />
                    <span>Manual hours override</span>
                  </label>
                </div>

                {isManualOverride && (
                  <div className="pt-2 border-t border-slate-200">
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Override Total Active Hours</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max="24"
                      value={totalActiveHours}
                      onChange={(e) => setTotalActiveHours(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* BREAKS SECTION */}
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-orange-900 flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-orange-600" />
                  Breaks & Away Time
                </h4>
                <p className="text-[11px] text-orange-700">Time entered here will be subtracted from your daily active hours.</p>

                {breaks.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {breaks.map(b => (
                      <div key={b.id} className="bg-white border border-orange-200 rounded-lg p-2 text-xs flex justify-between items-center shadow-2xs">
                        <div>
                          <span className="font-bold text-slate-800">{b.reason}</span>
                          <span className="text-slate-500 ml-2 font-mono">{b.startTime} - {b.endTime}</span>
                        </div>
                        <button type="button" onClick={() => handleDeleteBreak(b.id)} className="text-slate-400 hover:text-rose-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input type="time" value={newBreakStart} onChange={e => setNewBreakStart(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono" />
                  <input type="time" value={newBreakEnd} onChange={e => setNewBreakEnd(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono" />
                  <input type="text" placeholder="Reason (e.g. Lunch)" value={newBreakReason} onChange={e => setNewBreakReason(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs" />
                  <button type="button" onClick={handleAddBreak} className="bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold px-2 py-1.5 flex justify-center items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TASK BREAKDOWN SECTION (NOW OUTSIDE OF WORKING STATUS BLOCK) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-600" />
                  Task & Project Division
                </h4>
                <p className="text-[11px] text-slate-500">
                  {status === 'working'
                    ? 'Track how active hours were spent on specific tasks'
                    : 'Log off-hours work (hours will sum automatically)'}
                </p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${status === 'non_working' || totalTaskHoursSum === totalActiveHours
                ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                : 'bg-white border-slate-200 text-slate-700'
                }`}>
                {status === 'working'
                  ? `Sum: ${totalTaskHoursSum.toFixed(1)} / ${totalActiveHours.toFixed(1)}h`
                  : `Total Off-Hours: ${totalTaskHoursSum.toFixed(1)}h`}
              </span>
            </div>

            {/* Existing Tasks List */}
            {tasks.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {tasks.map((task, index) => (
                  <div
                    key={task.id}
                    className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs shadow-2xs"
                  >
                    <div className="space-y-0.5 truncate">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{task.title}</span>

                        {/* NEW: Displays the chronological timestamps next to the title */}
                        {status === 'working' && startTime && (
                          <span className="text-slate-500 text-[10px] font-mono">
                            {getTaskTimeRange(startTime, index, tasks, breaks)}
                          </span>
                        )}

                        {task.projectName && (
                          <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                            {task.projectName}
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px]">
                          {task.category}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-[11px] text-slate-500 truncate">{task.description}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="font-mono font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {task.hours}h
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-1">No tasks logged for this day yet.</p>
            )}

            {/* Add New Task Form */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">Add Task Entry</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Task Title (e.g. Q3 Roadmap Review)"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value as TaskCategory)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Project Name (Optional)"
                  value={newTaskProject}
                  onChange={(e) => setNewTaskProject(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={newTaskHours}
                  onChange={(e) => setNewTaskHours(parseFloat(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  {Array.from({ length: 80 }, (_, i) => {
                    const val = (i + 1) * 0.25;
                    return (
                      <option key={val} value={val}>
                        {val.toFixed(2)} hrs
                      </option>
                    );
                  })}
                </select>
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold px-3 py-1.5 transition-colors flex items-center justify-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Task
                </button>
              </div>
            </div>

          </div>

          {/* PERSONAL NOTES & EXTENUATING CIRCUMSTANCES */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                Personal Notes & Daily Summaries
              </label>

              <button
                type="button"
                onClick={handleAutoGenerateSummary}
                className="text-xs text-indigo-700 hover:text-indigo-900 font-bold bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 hover:bg-indigo-100"
                title="Synthesize tasks & hours into a clean daily summary"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Auto-Generate Summary
              </button>
            </div>

            <textarea
              rows={4}
              placeholder="Record extenuating circumstances (e.g., worked late due to server issue, doctor appointment in morning, traffic delay), daily work details, or autogenerated summaries..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Day Record
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};