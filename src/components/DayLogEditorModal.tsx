import React, { useState, useEffect } from 'react';
import { DayLog, WorkStatus, NonWorkingReason, TaskCategory, TaskItem, BreakItem } from '../types';
import { formatFullDate, calculateActiveHours, getTaskTimeRange } from '../utils/dateUtils';
import { generateDailySummary } from '../utils/aiSummary';
import {
  X, Clock, Calendar, Plus, Trash2, Sparkles, Check, AlertTriangle, Briefcase, FileText, Tag, HelpCircle, Coffee, Copy
} from 'lucide-react';

interface DayLogEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayLog: DayLog;
  previousDayLog?: DayLog | null;
  recentTasks?: { title: string; category: TaskCategory; projectName?: string }[]; // NEW PROP
  onSave: (updatedDayLog: DayLog) => void;
}

const REASONS: NonWorkingReason[] = [
  'PTO / Vacation', 'Sick Leave', 'Sick', 'Weekend', 'Off', 'Company Holiday',
  'Doctor Appointment', 'Personal Leave', 'Remote Travel', 'Training / Conference', 'Other'
];

const CATEGORIES: TaskCategory[] = [
  'Projects', 'Phone/Video Calls', 'Urgent Matters', 'Administrative',
  'Meetings', 'Development', 'Client Support', 'Other'
];

export const DayLogEditorModal: React.FC<DayLogEditorModalProps> = ({ isOpen, onClose, dayLog, previousDayLog, recentTasks = [], onSave }) => {
  const [status, setStatus] = useState<WorkStatus>(dayLog.status);
  const [nonWorkingReason, setNonWorkingReason] = useState<string>(dayLog.nonWorkingReason || 'PTO / Vacation');
  const [customReason, setCustomReason] = useState<string>('');
  const [startTime, setStartTime] = useState<string>(dayLog.startTime || '');
  const [endTime, setEndTime] = useState<string>(dayLog.endTime || '');
  const [totalActiveHours, setTotalActiveHours] = useState<number>(dayLog.totalActiveHours || 0);
  const [timeOffHours, setTimeOffHours] = useState<number>(dayLog.timeOffHours || 0);
  const [isManualOverride, setIsManualOverride] = useState<boolean>(dayLog.isManualHoursOverride || false);
  const [notes, setNotes] = useState<string>(dayLog.notes || '');
  const [tasks, setTasks] = useState<TaskItem[]>(dayLog.tasks || []);
  const [breaks, setBreaks] = useState<BreakItem[]>(dayLog.breaks || []);
  const [newBreakStart, setNewBreakStart] = useState('');
  const [newBreakEnd, setNewBreakEnd] = useState('');
  const [newBreakReason, setNewBreakReason] = useState('Lunch');

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('Projects');
  const [newTaskProject, setNewTaskProject] = useState('');
  const [newTaskHours, setNewTaskHours] = useState<number>(1.0);
  const [newTaskDesc, setNewTaskDesc] = useState('');

  useEffect(() => {
    setStatus(dayLog.status);
    setNonWorkingReason(dayLog.nonWorkingReason || 'PTO / Vacation');
    setStartTime(dayLog.startTime || '');
    setEndTime(dayLog.endTime || '');
    setTotalActiveHours(dayLog.totalActiveHours || 0);
    setTimeOffHours(dayLog.timeOffHours || 0);
    setIsManualOverride(dayLog.isManualHoursOverride || false);
    setNotes(dayLog.notes || '');
    setTasks(dayLog.tasks || []);
    setBreaks(dayLog.breaks || []);
  }, [dayLog]);

  useEffect(() => {
    if (status === 'working' && !isManualOverride) {
      setTotalActiveHours(calculateActiveHours(startTime, endTime, breaks));
    }
  }, [startTime, endTime, breaks, status, isManualOverride]);

  const handleAddBreak = () => {
    if (!newBreakStart || !newBreakEnd) return;
    setBreaks([...breaks, { id: `break-${Date.now()}`, startTime: newBreakStart, endTime: newBreakEnd, reason: newBreakReason.trim() || 'Break' }]);
    setNewBreakStart(''); setNewBreakEnd(''); setNewBreakReason('Lunch');
  };

  const handleDeleteBreak = (id: string) => setBreaks(breaks.filter(b => b.id !== id));

  const handleDuplicateYesterday = () => {
    if (!previousDayLog) return;
    setStatus(previousDayLog.status);
    if (previousDayLog.status === 'working') {
      setStartTime(previousDayLog.startTime);
      setEndTime(previousDayLog.endTime);
      setBreaks(previousDayLog.breaks || []);
    }
  };

  // NEW: Pre-fill the form when a Quick Add chip is clicked
  const handleQuickAddClick = (rt: { title: string; category: TaskCategory; projectName?: string }) => {
    setNewTaskTitle(rt.title);
    setNewTaskCategory(rt.category);
    setNewTaskProject(rt.projectName || '');
  };

  if (!isOpen) return null;

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setTasks([...tasks, { id: `task-${Date.now()}`, title: newTaskTitle.trim(), category: newTaskCategory, projectName: newTaskProject.trim() || undefined, hours: Number(newTaskHours) || 0.5, description: newTaskDesc.trim() || undefined }]);
    setNewTaskTitle(''); setNewTaskProject(''); setNewTaskDesc(''); setNewTaskHours(1.0);
  };

  const handleDeleteTask = (taskId: string) => setTasks(tasks.filter(t => t.id !== taskId));

  const handleAutoGenerateSummary = () => {
    setNotes(generateDailySummary({ ...dayLog, status, nonWorkingReason: nonWorkingReason === 'Other' ? customReason : nonWorkingReason, startTime, endTime, totalActiveHours, notes, tasks }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = (timeOffHours > 0 || status === 'non_working') ? (nonWorkingReason === 'Other' && customReason ? customReason : nonWorkingReason) : undefined;
    onSave({
      ...dayLog,
      status,
      nonWorkingReason: finalReason,
      startTime: status === 'working' ? startTime : '',
      endTime: status === 'working' ? endTime : '',
      totalActiveHours: status === 'working' ? totalActiveHours : tasks.reduce((sum, t) => sum + t.hours, 0),
      timeOffHours: timeOffHours,
      isManualHoursOverride: isManualOverride,
      notes, tasks, breaks: status === 'working' ? breaks : []
    });
    onClose();
  };

  const totalTaskHoursSum = tasks.reduce((sum, t) => sum + t.hours, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto font-sans text-slate-800">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">

        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl"><Calendar className="w-5 h-5" /></div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Log Workplace Hours & Tasks</h3>
              <p className="text-xs text-slate-500">{formatFullDate(dayLog.date)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

          {previousDayLog && previousDayLog.status === 'working' && (
            <button
              type="button"
              onClick={handleDuplicateYesterday}
              className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" /> Duplicate Yesterday's Schedule (Hours & Breaks)
            </button>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Workplace Status for Date</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setStatus('working')} className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${status === 'working' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                <Briefcase className="w-4 h-4" /><span>Working Day</span>
              </button>
              <button type="button" onClick={() => setStatus('non_working')} className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${status === 'non_working' ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                <Clock className="w-4 h-4" /><span>Not Working</span>
              </button>
            </div>
          </div>

          {status === 'working' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-600" /> Active Work Hours</h4>
                  <span className="text-xs font-bold text-indigo-800 bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200">Calculated: {totalActiveHours.toFixed(1)} hrs</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="text-[11px] font-bold text-slate-600 block mb-1">Start Time (Clock In)</label><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="text-[11px] font-bold text-slate-600 block mb-1">End Time (Clock Out)</label><input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span className="text-[11px] italic flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Excludes lunch breaks.</span>
                  <label className="flex items-center space-x-2 text-[11px] cursor-pointer font-semibold text-slate-700">
                    <input type="checkbox" checked={isManualOverride} onChange={(e) => setIsManualOverride(e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-0" />
                    <span>Manual hours override</span>
                  </label>
                </div>
                {isManualOverride && (
                  <div className="pt-2 border-t border-slate-200">
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Override Total Active Hours</label>
                    <input type="number" step="0.25" min="0" max="24" value={totalActiveHours} onChange={(e) => setTotalActiveHours(parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                )}
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-orange-900 flex items-center gap-2"><Coffee className="w-4 h-4 text-orange-600" /> Breaks & Away Time</h4>
                {breaks.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {breaks.map(b => (
                      <div key={b.id} className="bg-white border border-orange-200 rounded-lg p-2 text-xs flex justify-between items-center shadow-2xs">
                        <div><span className="font-bold text-slate-800">{b.reason}</span><span className="text-slate-500 ml-2 font-mono">{b.startTime} - {b.endTime}</span></div>
                        <button type="button" onClick={() => handleDeleteBreak(b.id)} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input type="time" value={newBreakStart} onChange={e => setNewBreakStart(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono" />
                  <input type="time" value={newBreakEnd} onChange={e => setNewBreakEnd(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono" />
                  <input type="text" placeholder="Reason" value={newBreakReason} onChange={e => setNewBreakReason(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs" />
                  <button type="button" onClick={handleAddBreak} className="bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold px-2 py-1.5 flex justify-center items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-amber-900 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-600" /> Credited Time Off & Exceptions</h4>
            <p className="text-[10px] text-amber-700">Log PTO, Sick Time, or Holidays. These count toward your global 40h target but not as active labor.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-amber-900 block mb-1">Credited Hours</label>
                <input type="number" step="0.5" min="0" max="24" value={timeOffHours} onChange={(e) => setTimeOffHours(parseFloat(e.target.value) || 0)} className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-amber-900 block mb-1">Reason</label>
                <select value={nonWorkingReason} onChange={(e) => setNonWorkingReason(e.target.value)} className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500">
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            {nonWorkingReason === 'Other' && (
              <input type="text" placeholder="Specify custom reason" value={customReason} onChange={(e) => setCustomReason(e.target.value)} className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500" />
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2"><Tag className="w-4 h-4 text-purple-600" /> Task & Project Division</h4>
                <p className="text-[11px] text-slate-500">{status === 'working' ? 'Track how active hours were spent' : 'Log off-hours work'}</p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${status === 'non_working' || totalTaskHoursSum === totalActiveHours ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-700'}`}>
                {status === 'working' ? `Sum: ${totalTaskHoursSum.toFixed(1)} / ${totalActiveHours.toFixed(1)}h` : `Total Off-Hours: ${totalTaskHoursSum.toFixed(1)}h`}
              </span>
            </div>

            {tasks.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {tasks.map((task, index) => (
                  <div key={task.id} className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs shadow-2xs">
                    <div className="space-y-0.5 truncate">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{task.title}</span>
                        {status === 'working' && startTime && <span className="text-slate-500 text-[10px] font-mono">{getTaskTimeRange(startTime, index, tasks, breaks)}</span>}
                        {task.projectName && <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">{task.projectName}</span>}
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px]">{task.category}</span>
                      </div>
                      {task.description && <p className="text-[11px] text-slate-500 truncate">{task.description}</p>}
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="font-mono font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{task.hours}h</span>
                      <button type="button" onClick={() => handleDeleteTask(task.id)} className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (<p className="text-xs text-slate-400 italic py-1">No tasks logged.</p>)}

            <div className="bg-white border border-slate-200/90 rounded-xl p-3 space-y-3">

              {/* NEW: RECENT TASKS QUICK ADD CHIPS */}
              {recentTasks.length > 0 && (
                <div className="mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Quick Add Recent Tasks</span>
                  <div className="flex flex-wrap gap-1.5">
                    {recentTasks.map((rt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleQuickAddClick(rt)}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 rounded-lg text-[10px] font-semibold transition-colors truncate max-w-[150px]"
                        title={`${rt.title} (${rt.category})`}
                      >
                        + {rt.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <span className="text-[11px] font-bold text-slate-700 block border-t border-slate-100 pt-2">Add New Task Entry</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input type="text" placeholder="Task Title" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500" />
                <select value={newTaskCategory} onChange={(e) => setNewTaskCategory(e.target.value as TaskCategory)} className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input type="text" placeholder="Project Name (Optional)" value={newTaskProject} onChange={(e) => setNewTaskProject(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500" />
                <select value={newTaskHours} onChange={(e) => setNewTaskHours(parseFloat(e.target.value))} className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500">
                  {Array.from({ length: 80 }, (_, i) => { const val = (i + 1) * 0.25; return <option key={val} value={val}>{val.toFixed(2)} hrs</option>; })}
                </select>
                <button type="button" onClick={handleAddTask} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold px-3 py-1.5 transition-colors flex items-center justify-center gap-1 shadow-2xs"><Plus className="w-3.5 h-3.5" /> Add Task</button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><FileText className="w-4 h-4 text-emerald-600" /> Personal Notes</label>
              <button type="button" onClick={handleAutoGenerateSummary} className="text-xs text-indigo-700 hover:text-indigo-900 font-bold bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 hover:bg-indigo-100"><Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Auto-Generate</button>
            </div>
            <textarea rows={4} placeholder="Record daily work details..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans" />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"><Check className="w-4 h-4" /> Save Day Record</button>
          </div>
        </form>
      </div>
    </div>
  );
};