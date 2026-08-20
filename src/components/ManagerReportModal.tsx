import React, { useState, useEffect } from 'react';
import { DayLog, UserProfile } from '../types';
import { formatWeekRange, formatShortDate, format12HourTime, filterDaysForManagerReport, generateDailyTimeline } from '../utils/dateUtils';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { generateWeeklyManagerOverview } from '../utils/aiSummary';
import {
  X, FileText, Download, CheckCircle2, AlertTriangle, Copy, Check, CalendarCheck, Mail, Send, Paperclip, CheckSquare, Coffee, FolderKanban, Sparkles
} from 'lucide-react';

interface ManagerReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  days: DayLog[];
  user: UserProfile;
  mondayDate: Date;
}

export const ManagerReportModal: React.FC<ManagerReportModalProps> = ({
  isOpen, onClose, days, user, mondayDate
}) => {
  const [reportMode, setReportMode] = useState<'barebones' | 'detailed' | 'project'>('barebones');
  const [activeTab, setActiveTab] = useState<'preview' | 'email'>('preview');
  const [copied, setCopied] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  const [customEmailIntro, setCustomEmailIntro] = useState(() => {
    return localStorage.getItem('timecard_custom_intro') || 'Please find my official weekly timecard report below.';
  });

  useEffect(() => {
    localStorage.setItem('timecard_custom_intro', customEmailIntro);
  }, [customEmailIntro]);

  const reportDays = filterDaysForManagerReport(days);
  const weekLabel = formatWeekRange(mondayDate);

  const totalActiveHours = reportDays.reduce((sum, d) => sum + (d.status === 'working' ? d.totalActiveHours : 0), 0);
  const totalTimeOffHours = reportDays.reduce((sum, d) => sum + (d.timeOffHours || 0), 0);
  const totalCreditedHours = totalActiveHours + totalTimeOffHours;
  const targetHours = user.targetWeeklyHours || 40;
  const hoursDiff = totalCreditedHours - targetHours;
  const isGoalMet = totalCreditedHours >= targetHours;

  const cleanManagerName = user.managerName.replace(/\s*\(.*?\)\s*/g, '').trim();
  const recipientEmail = user.managerEmail || 'manager@company.com';
  const emailSubject = `Weekly Timecard: ${weekLabel}`;

  // PROJECT AGGREGATION LOGIC
  const projectMap: Record<string, { totalHours: number, tasks: { dayName: string, title: string, hours: number, category: string }[] }> = {};

  reportDays.forEach(d => {
    if (d.status === 'working' && d.tasks) {
      d.tasks.forEach(t => {
        const pName = t.projectName || 'Uncategorized / Routine';
        if (!projectMap[pName]) projectMap[pName] = { totalHours: 0, tasks: [] };
        projectMap[pName].totalHours += t.hours;
        projectMap[pName].tasks.push({ dayName: formatShortDate(d.date), title: t.title, hours: t.hours, category: t.category });
      });
    }
  });
  const hasProjects = Object.keys(projectMap).length > 0;

  const generateCompiledEmailBody = () => {
    let body = `Hello,\n\n${customEmailIntro.trim()}\n\n`;
    body += `SUMMARY OF HOURS:\n`;
    body += `• Active Work Hours: ${totalActiveHours.toFixed(1)} hrs\n`;
    if (totalTimeOffHours > 0) body += `• PTO / Credited Hours: ${totalTimeOffHours.toFixed(1)} hrs\n`;
    body += `• Total Weekly Credited: ${totalCreditedHours.toFixed(1)} hrs\n`;
    body += `• Weekly Target Goal (${targetHours}h): ${isGoalMet ? 'Target Met' : 'Shortfall'} (${hoursDiff >= 0 ? '+' : ''}${hoursDiff.toFixed(1)} hrs)\n\n`;

    if (reportMode === 'project') {
      body += `PROJECT & INVOICE BREAKDOWN:\n`;
      Object.entries(projectMap).forEach(([projName, data]) => {
        body += `\n[${projName.toUpperCase()}] - ${data.totalHours.toFixed(1)} hrs\n`;
        data.tasks.forEach(t => {
          body += `  • ${t.dayName}: ${t.title} (${t.hours}h)\n`;
        });
      });
    } else {
      body += `DAILY WORK LOG & NOTICES:\n`;
      reportDays.forEach(d => {
        const dayName = formatShortDate(d.date);
        const active = d.status === 'working' ? (d.totalActiveHours || 0) : 0;
        const pto = d.timeOffHours || 0;

        if (d.status === 'working') {
          let line = `• ${dayName}: ${format12HourTime(d.startTime)} - ${format12HourTime(d.endTime)} (${active.toFixed(1)} hrs Active`;
          if (pto > 0) line += ` + ${pto.toFixed(1)} hrs PTO [${d.nonWorkingReason || 'Credited'}]`;
          line += `)\n`;
          body += line;
        } else {
          const ptoText = pto > 0 ? ` (${pto}h Credited)` : '';
          body += `• ${dayName}: NOT WORKING - Reason: ${d.nonWorkingReason || 'Not specified'}${ptoText}\n`;
        }
      });
    }

    body += `\nPlease let me know if you have any questions, thanks!\n\n${user.employeeName}\n${user.department}\n`;
    return body;
  };

  const compiledEmailBody = generateCompiledEmailBody();

  if (!isOpen) return null;

  const handleCopyText = () => {
    navigator.clipboard.writeText(compiledEmailBody);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGmail = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(compiledEmailBody)}`;
    window.open(gmailUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[90vh] text-slate-800">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs"><FileText className="w-5 h-5" /></div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">Manager Timecard Report</h3>
              <p className="text-xs text-slate-500">Weekly Active Hours Notice & Manager Submission</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="bg-slate-200/70 p-1 rounded-xl flex items-center text-xs font-bold">
              <button onClick={() => setActiveTab('preview')} className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'preview' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}><FileText className="w-3.5 h-3.5 inline mr-1" />Preview</button>
              <button onClick={() => setActiveTab('email')} className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'email' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}><Mail className="w-3.5 h-3.5 inline mr-1 text-indigo-600" />Email</button>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {activeTab === 'preview' ? (
            <>
              <div className="bg-indigo-50/60 border border-indigo-100 text-indigo-900 rounded-xl p-3 text-xs flex justify-between items-center">
                <span className="flex items-center gap-2"><CalendarCheck className="w-4 h-4" /> Export format style:</span>
                <div className="bg-white p-0.5 rounded-lg border border-indigo-200 flex text-[11px]">
                  <button onClick={() => setReportMode('barebones')} className={`px-2.5 py-1 font-bold rounded-md ${reportMode === 'barebones' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600'}`}>Barebones</button>
                  <button onClick={() => setReportMode('detailed')} className={`px-2.5 py-1 font-bold rounded-md ${reportMode === 'detailed' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600'}`}>Detailed</button>
                  <button onClick={() => setReportMode('project')} className={`px-2.5 py-1 font-bold rounded-md ${reportMode === 'project' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600'}`}>By Project</button>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6 text-slate-800">
                <div className="flex flex-col sm:flex-row justify-between border-b border-slate-200 pb-4 gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase text-indigo-600">Official Workplace Record</span>
                    <h2 className="text-xl font-extrabold text-slate-900">TIMECARD REPORT</h2>
                    <p className="text-xs text-slate-500 mt-1">Week of: <strong className="text-slate-800">{weekLabel}</strong></p>
                  </div>
                  <div className="text-left sm:text-right text-xs space-y-1 text-slate-700">
                    <p><strong>Employee:</strong> {user.employeeName}</p>
                    <p><strong>Department:</strong> {user.department}</p>
                    <p><strong>Manager:</strong> {cleanManagerName}</p>
                  </div>
                </div>

                <div className={`rounded-xl p-4 border flex items-center justify-between ${isGoalMet ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                  <div className="flex items-center space-x-3">
                    {isGoalMet ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertTriangle className="w-6 h-6 shrink-0" />}
                    <div>
                      <h4 className="text-sm font-bold">Total Weekly Credited: {totalCreditedHours.toFixed(1)} hrs</h4>
                      <p className="text-xs opacity-90 mt-0.5">
                        {totalTimeOffHours > 0 && `(${totalActiveHours.toFixed(1)} Active + ${totalTimeOffHours.toFixed(1)} PTO). `}
                        {isGoalMet ? `Target met (+${hoursDiff.toFixed(1)} hrs overtime).` : `Shortfall of ${Math.abs(hoursDiff).toFixed(1)} hrs below target.`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-white border border-current shadow-sm">{isGoalMet ? 'TARGET MET' : 'SHORTFALL'}</span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    {reportMode === 'project' ? 'Project & Invoice Breakdown' : 'Daily Work Notice'}
                  </h4>
                  <div className="space-y-4">

                    {/* PROJECT MODE VIEW */}
                    {reportMode === 'project' && hasProjects && (
                      Object.entries(projectMap).map(([projName, data]) => (
                        <div key={projName} className="bg-[#FAF9F6] border border-[#E5E0D8] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
                          <div className="w-full md:w-32 shrink-0 pt-1">
                            <div className="font-bold text-indigo-900 text-sm leading-tight break-words">{projName}</div>
                            <div className="mt-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1 w-fit"><FolderKanban className="w-3 h-3" /> Project</span>
                            </div>
                          </div>

                          <div className="flex-1 bg-white border border-[#E5E0D8] rounded-xl p-3 flex flex-col justify-center">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Logged Tasks</div>
                            <ul className="space-y-1.5">
                              {data.tasks.map((t, idx) => (
                                <li key={idx} className="text-xs text-slate-800 flex items-start gap-2 border-b border-slate-50 pb-1.5 last:border-0 last:pb-0">
                                  <span className="text-slate-400 font-mono text-[10px] w-12 shrink-0 pt-0.5">{t.dayName.split(',')[0]}</span>
                                  <span className="flex-1">{t.title} <strong className="text-indigo-600">({t.hours}h)</strong></span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="w-full md:w-24 shrink-0 flex flex-col justify-center items-end md:items-center text-right md:text-center mt-2 md:mt-0">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Total</div>
                            <div className="text-xl font-black text-slate-900 font-mono">{data.totalHours.toFixed(1)}h</div>
                          </div>
                        </div>
                      ))
                    )}
                    {reportMode === 'project' && !hasProjects && (
                      <div className="text-sm text-slate-500 italic p-4 border border-dashed border-slate-300 rounded-xl text-center">No projects or tasks logged for this week.</div>
                    )}

                    {/* DAILY CHRONOLOGICAL VIEW */}
                    {reportMode !== 'project' && reportDays.map(d => {
                      const isWorking = d.status === 'working';
                      const active = d.status === 'working' ? (d.totalActiveHours || 0) : 0;
                      const pto = d.timeOffHours || 0;
                      const dayTotal = active + pto;
                      const timeline = generateDailyTimeline(d);

                      return (
                        <div key={d.date} className="bg-[#FAF9F6] border border-[#E5E0D8] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
                          <div className="w-full md:w-32 shrink-0 pt-1">
                            <div className="font-bold text-slate-900 text-sm">{formatShortDate(d.date)}</div>
                            <div className="mt-2">
                              {isWorking ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Working</span> : <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Off</span>}
                            </div>
                          </div>

                          <div className="flex-1 bg-white border border-[#E5E0D8] rounded-xl p-3 flex flex-col justify-center">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{isWorking ? 'LOGGED TIME' : 'REASON'}</div>
                            <div className="text-sm text-slate-900 font-mono font-medium">
                              {isWorking ? `${format12HourTime(d.startTime)} - ${format12HourTime(d.endTime)}` : (d.nonWorkingReason || 'No reason specified')}
                              {isWorking && pto > 0 && <span className="ml-2 text-amber-600 text-xs font-bold font-sans"> (+{pto}h {d.nonWorkingReason})</span>}
                            </div>

                            {isWorking && reportMode === 'detailed' && (
                              <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                                {timeline.length > 0 && (
                                  <div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Timeline Log</div>
                                    <ul className="space-y-1">
                                      {timeline.map(event => (
                                        <li key={event.id} className="text-xs text-slate-800 flex items-start gap-1.5">
                                          {event.type === 'task' ? <span className="text-slate-400 mt-0.5">•</span> : <Coffee className="w-3 h-3 text-orange-500 mt-0.5" />}
                                          <span>{event.title} <strong className={event.type === 'task' ? 'text-indigo-600' : 'text-orange-600'}>({event.hours}h)</strong></span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {d.notes && (<div><div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Notes</div><div className="text-xs text-slate-600 italic whitespace-pre-wrap">{d.notes}</div></div>)}
                              </div>
                            )}
                          </div>

                          <div className="w-full md:w-24 shrink-0 flex flex-col justify-center items-end md:items-center text-right md:text-center mt-2 md:mt-0">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Total</div>
                            <div className="text-xl font-black text-slate-900 font-mono">{dayTotal.toFixed(1)}h</div>
                            {pto > 0 && <div className="text-[9px] text-amber-600 font-bold uppercase mt-0.5">{pto.toFixed(1)}h Credited</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4 text-slate-800">
              {emailSentSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                      <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold">Email Timecard Report Sent!</h4>
                      <p className="text-[11px] text-emerald-700">Official timecard report dispatches directly to <strong className="font-mono">{recipientEmail}</strong>.</p>
                    </div>
                  </div>
                  <button onClick={() => setEmailSentSuccess(false)} className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline">Dismiss</button>
                </div>
              )}

              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Mail className="w-4 h-4 text-indigo-600" />Compose Email to Manager</h3>
                    <p className="text-xs text-slate-500">Send your weekly timecard notice directly to your manager.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Manager Email (From Profile)</label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-indigo-700 font-semibold cursor-not-allowed">
                      {recipientEmail}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Subject Line (Auto-Formatted)</label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold cursor-not-allowed">
                      {emailSubject}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Custom Message (Saves Automatically)
                    </label>
                    <button
                      type="button"
                      onClick={() => setCustomEmailIntro(generateWeeklyManagerOverview(reportDays, totalCreditedHours, targetHours))}
                      className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-lg transition-all flex items-center gap-1 hover:bg-indigo-100"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-600" /> Draft AI Summary
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={customEmailIntro}
                    onChange={(e) => setCustomEmailIntro(e.target.value)}
                    placeholder="Add persistent custom messages here (e.g. 'I will be out next Friday')."
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4 transition-all"
                  />

                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Final Email Preview</label>
                  </div>
                  <textarea
                    readOnly
                    rows={10}
                    value={compiledEmailBody}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-500 focus:outline-none leading-relaxed resize-y cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t bg-slate-50 flex justify-between">
          <button onClick={handleCopyText} className="px-4 py-2 bg-white border rounded-xl text-xs font-semibold shadow-sm"><Copy className="w-4 h-4 inline mr-1" /> Copy Text</button>
          <div className="flex space-x-3">
            {activeTab === 'email' && <button onClick={handleOpenGmail} className="px-6 py-2.5 bg-[#EA4335] text-white rounded-xl text-xs font-bold shadow-md"><Mail className="w-4 h-4 inline mr-1" /> Open in Gmail</button>}
            {activeTab === 'preview' && <button onClick={() => exportToPDF(reportDays, user, mondayDate, reportMode)} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md"><Download className="w-4 h-4 inline mr-1" /> Download Official PDF</button>}
          </div>
        </div>
      </div>
    </div>
  );
};