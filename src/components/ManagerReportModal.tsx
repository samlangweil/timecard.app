import React, { useState, useEffect } from 'react';
import { DayLog, UserProfile } from '../types';
import { formatWeekRange, formatShortDate, format12HourTime, filterDaysForManagerReport, generateDailyTimeline } from '../utils/dateUtils';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { generateWeeklyManagerOverview } from '../utils/aiSummary';
import {
  X, FileText, Download, CheckCircle2, AlertTriangle, Copy, Check, CalendarCheck, Mail, Send, Paperclip, CheckSquare, Coffee
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
  const [reportMode, setReportMode] = useState<'barebones' | 'detailed'>('barebones');
  const [activeTab, setActiveTab] = useState<'preview' | 'email'>('preview');
  const [copied, setCopied] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  // Persistent Custom Email Intro
  const [customEmailIntro, setCustomEmailIntro] = useState(() => {
    return localStorage.getItem('timecard_custom_intro') || 'Please find my official weekly timecard report below.';
  });

  useEffect(() => {
    localStorage.setItem('timecard_custom_intro', customEmailIntro);
  }, [customEmailIntro]);

  const reportDays = filterDaysForManagerReport(days);
  const weekLabel = formatWeekRange(mondayDate);
  const totalWorkedHours = reportDays.reduce((sum, d) => sum + (d.status === 'working' ? d.totalActiveHours : 0), 0);
  const targetHours = user.targetWeeklyHours || 40;
  const hoursDiff = totalWorkedHours - targetHours;
  const isGoalMet = totalWorkedHours >= targetHours;

  const cleanManagerName = user.managerName.replace(/\s*\(.*?\)\s*/g, '').trim();
  const recipientEmail = user.managerEmail || 'manager@company.com';
  const emailSubject = `Weekly Timecard: ${weekLabel}`;

  const emailPrefix = recipientEmail.split('@')[0];
  const rawFirstName = emailPrefix.split('.')[0];
  const managerFirstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase();

  const generateCompiledEmailBody = () => {
    let body = `${managerFirstName},\n\n`;

    if (customEmailIntro.trim()) {
      body += `${customEmailIntro.trim()}\n\n`;
    }

    body += `SUMMARY OF HOURS:\n`;
    body += `• Total Active Work Hours: ${totalWorkedHours.toFixed(1)} hrs\n`;
    body += `• Weekly Target Goal (${targetHours}h): ${isGoalMet ? 'Target Met' : 'Shortfall'} (${hoursDiff >= 0 ? '+' : ''}${hoursDiff.toFixed(1)} hrs)\n\n`;
    body += `DAILY WORK LOG & NOTICES:\n`;

    reportDays.forEach(d => {
      const dayName = formatShortDate(d.date);
      if (d.status === 'working') {
        body += `• ${dayName}: ${format12HourTime(d.startTime)} - ${format12HourTime(d.endTime)} (${d.totalActiveHours.toFixed(1)} hrs)\n`;

        if (reportMode === 'detailed') {
          const timeline = generateDailyTimeline(d);
          timeline.forEach(event => {
            if (event.type === 'task') {
              body += `    - Task: ${event.title} (${event.hours}h) [${event.timeDisplay}]\n`;
            } else {
              body += `    - Break: ${event.title} (${event.hours}h) [${event.timeDisplay}]\n`;
            }
          });
        } else if (reportMode === 'barebones' && d.breaks && d.breaks.length > 0) {
          d.breaks.forEach(b => {
            body += `    - Break: ${b.reason} [${format12HourTime(b.startTime)} - ${format12HourTime(b.endTime)}]\n`;
          });
        }
      } else {
        body += `• ${dayName}: NOT WORKING - Reason: ${d.nonWorkingReason || 'Not specified'}\n`;
      }
      if (reportMode === 'detailed' && d.notes) {
        body += `    - Note: ${d.notes}\n`;
      }
    });

    body += `\nPlease let me know if you have any questions, thanks!\n\n`;
    body += `${user.employeeName}\n${user.department}\n`;
    return body;
  };

  const compiledEmailBody = generateCompiledEmailBody();

  if (!isOpen) return null;

  const handleCopyText = () => {
    const textOverview = generateWeeklyManagerOverview(reportDays, totalWorkedHours, targetHours);
    let fullText = `${textOverview}\n\n`;
    fullText += `Employee: ${user.employeeName}\nDepartment: ${user.department}\nManager: ${cleanManagerName}\nWeek: ${weekLabel}\n\n`;
    fullText += `DAILY HOURS LOG:\n`;

    reportDays.forEach(d => {
      const dayName = formatShortDate(d.date);
      if (d.status === 'working') {
        fullText += `• ${dayName}: ${format12HourTime(d.startTime)} - ${format12HourTime(d.endTime)} (${d.totalActiveHours} hrs)\n`;

        if (reportMode === 'detailed') {
          const timeline = generateDailyTimeline(d);
          timeline.forEach(event => {
            if (event.type === 'task') {
              fullText += `    - Task: ${event.title} (${event.hours}h) [${event.timeDisplay}]\n`;
            } else {
              fullText += `    - Break: ${event.title} (${event.hours}h) [${event.timeDisplay}]\n`;
            }
          });
        } else if (reportMode === 'barebones' && d.breaks && d.breaks.length > 0) {
          d.breaks.forEach(b => {
            fullText += `    - Break: ${b.reason} [${format12HourTime(b.startTime)} - ${format12HourTime(b.endTime)}]\n`;
          });
        }
      } else {
        fullText += `• ${dayName}: NOT WORKING - Reason: ${d.nonWorkingReason || 'Off'}\n`;
      }
      if (reportMode === 'detailed' && d.notes) {
        fullText += `    - Notes: ${d.notes}\n`;
      }
    });

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenMailClient = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(compiledEmailBody)}`;
    window.location.href = mailtoUrl;
  };

  const handleSendSimulatedEmail = () => {
    setEmailSentSuccess(true);
    setTimeout(() => setEmailSentSuccess(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto transition-colors">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[90vh] text-slate-800">

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">Manager Timecard Report</h3>
              <p className="text-xs text-slate-500">Weekly Active Hours Notice & Manager Submission</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="bg-slate-200/70 p-1 rounded-xl border border-slate-300/50 flex items-center text-xs font-bold">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'preview' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Timecard View</span>
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'email' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                <span>Email to Manager</span>
              </button>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">

          {activeTab === 'preview' ? (
            <>
              {/* Notice Banner & Toggle */}
              <div className="bg-indigo-50/60 border border-indigo-100 text-indigo-900 rounded-xl p-3 text-xs flex flex-col sm:flex-row items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-medium">
                  <CalendarCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Saturday & Sunday are hidden from manager report unless active hours are added.</span>
                </span>
                <div className="bg-white p-0.5 rounded-lg border border-indigo-200 flex items-center text-[11px]">
                  <button
                    onClick={() => setReportMode('barebones')}
                    className={`px-2.5 py-1 font-bold rounded-md transition-all ${reportMode === 'barebones' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Barebones
                  </button>
                  <button
                    onClick={() => setReportMode('detailed')}
                    className={`px-2.5 py-1 font-bold rounded-md transition-all ${reportMode === 'detailed' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Detailed
                  </button>
                </div>
              </div>

              {/* PDF VISUAL PREVIEW AREA */}
              <div className="space-y-6">

                <div className="flex flex-col sm:flex-row justify-between border-b border-slate-200 pb-4 gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Official Workplace Record</span>
                    <h2 className="text-xl font-extrabold text-slate-900">TIMECARD REPORT</h2>
                    <p className="text-xs text-slate-500 mt-1">Week of: <strong className="text-slate-800">{weekLabel}</strong></p>
                  </div>
                  <div className="text-left sm:text-right text-xs space-y-1 text-slate-700">
                    <p><strong className="text-slate-500">Employee:</strong> {user.employeeName}</p>
                    <p><strong className="text-slate-500">Department:</strong> {user.department}</p>
                    <p><strong className="text-slate-500">Manager:</strong> {cleanManagerName}</p>
                  </div>
                </div>

                <div className={`rounded-xl p-4 border flex items-center justify-between bg-amber-50 border-amber-200 text-amber-900 shadow-sm`}>
                  <div className="flex items-center space-x-3">
                    {isGoalMet ? <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />}
                    <div>
                      <h4 className="text-sm font-bold">Total Active Work Hours: {totalWorkedHours.toFixed(1)} hrs</h4>
                      <p className="text-xs opacity-90 mt-0.5">
                        {isGoalMet ? `Target met (+${hoursDiff.toFixed(1)} hrs over target).` : `Shortfall of ${Math.abs(hoursDiff).toFixed(1)} hrs below the ${targetHours}-hour target.`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-white border border-amber-600/30 text-amber-800 shadow-sm">
                    {isGoalMet ? 'TARGET MET' : 'SHORTFALL'}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Daily Work Notice
                  </h4>
                  <div className="space-y-4">
                    {reportDays.map(d => {
                      const isWorking = d.status === 'working';
                      const timeline = generateDailyTimeline(d);

                      return (
                        <div key={d.date} className="bg-[#FAF9F6] border border-[#E5E0D8] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 md:items-stretch">

                          {/* Left Column */}
                          <div className="w-full md:w-32 shrink-0 flex flex-col justify-start pt-1">
                            <div className="font-bold text-slate-900 text-sm">{formatShortDate(d.date)}</div>
                            <div className="mt-2">
                              {isWorking ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Working</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Off</span>
                              )}
                            </div>
                          </div>

                          {/* Middle Column (White Info Box) */}
                          <div className="flex-1 w-full bg-white border border-[#E5E0D8] rounded-xl p-3 flex flex-col justify-center">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              {isWorking ? 'LOGGED TIME' : 'REASON'}
                            </div>
                            <div className="text-sm text-slate-900 font-mono font-medium">
                              {isWorking ? `${format12HourTime(d.startTime)}  -  ${format12HourTime(d.endTime)}` : (d.nonWorkingReason || 'No reason specified')}
                            </div>

                            {/* Detailed Info Rendered only if 'detailed' toggle is selected */}
                            {isWorking && reportMode === 'detailed' && (
                              <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                                {timeline.length > 0 && (
                                  <div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Timeline Log</div>
                                    <ul className="space-y-1">
                                      {timeline.map(event => (
                                        <li key={event.id} className="text-xs text-slate-800 flex items-start gap-1.5">
                                          {event.type === 'task' ? <span className="text-slate-400 mt-0.5">•</span> : <Coffee className="w-3 h-3 text-orange-500 mt-0.5" />}
                                          <span>
                                            {event.title} <strong className={event.type === 'task' ? 'text-indigo-600' : 'text-orange-600'}>({event.hours}h)</strong> <span className="text-slate-400 font-mono text-[10px]">[{event.timeDisplay}]</span>
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {d.notes && (
                                  <div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Notes</div>
                                    <div className="text-xs text-slate-600 italic leading-relaxed whitespace-pre-wrap">{d.notes}</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Right Column (Total Hours) */}
                          <div className="w-full md:w-24 shrink-0 flex flex-col justify-center items-end md:items-center text-right md:text-center mt-2 md:mt-0">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Total</div>
                            <div className="text-xl font-black text-slate-900 font-mono">
                              {isWorking ? d.totalActiveHours.toFixed(1) : '0.0'}h
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
              {/* END PREVIEW AREA */}
            </>
          ) : (
            /* ================= EMAIL COMPOSITION TAB ================= */
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
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Custom Message (Saves Automatically)
                  </label>
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

                <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-900 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span><strong>Official PDF Report Included:</strong> Download the PDF to attach directly.</span>
                  </div>
                  <button onClick={() => exportToPDF(reportDays, user, mondayDate, reportMode === 'barebones')} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs shadow-sm shrink-0 flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </button>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button onClick={handleOpenMailClient} className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 w-full sm:w-auto justify-center">
                      <Mail className="w-4 h-4 text-indigo-600" /> <span>Open in Mail Client</span>
                    </button>
                    <button onClick={handleCopyText} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1">
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />} <span>{copied ? 'Copied!' : 'Copy Body'}</span>
                    </button>
                  </div>
                  <button onClick={handleSendSimulatedEmail} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 w-full sm:w-auto justify-center">
                    <Send className="w-4 h-4" /> <span>Send Email to Manager</span>
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button onClick={handleCopyText} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm w-full sm:w-auto">
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />} <span>{copied ? 'Copied Summary Text!' : 'Copy Summary Text'}</span>
            </button>
            {activeTab === 'preview' && (
              <button onClick={() => setActiveTab('email')} className="px-4 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-indigo-600" /> <span>Send via Email</span>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button onClick={() => exportToCSV(reportDays, user, mondayDate)} className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-600" /> <span>Export CSV</span>
            </button>

            <button onClick={() => exportToPDF(reportDays, user, mondayDate, reportMode === 'barebones')} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5">
              <Download className="w-4 h-4" /> <span>Download Official PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};