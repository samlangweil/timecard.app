import jsPDF from 'jspdf';
import { DayLog, UserProfile } from '../types';
import {
  formatShortDate,
  format12HourTime,
  formatWeekRange,
  filterDaysForManagerReport,
  generateDailyTimeline
} from './dateUtils';

export function exportToCSV(days: DayLog[], user: UserProfile, mondayDate: Date): void {
  // Existing CSV logic remains unchanged
  const weekLabel = formatWeekRange(mondayDate);
  const reportDays = filterDaysForManagerReport(days);
  const headers = ['Date', 'Day of Week', 'Status', 'Start Time', 'End Time', 'Total Active Hours', 'Non-Working Reason', 'Task Breakdown & Hours', 'Personal Notes'];

  const rows = reportDays.map(d => {
    const formattedDate = d.date;
    const dayOfWeek = formatShortDate(d.date).split(',')[0];
    const status = d.status === 'working' ? 'Working' : 'Not Working';
    const startTime = d.status === 'working' ? format12HourTime(d.startTime) : 'N/A';
    const endTime = d.status === 'working' ? format12HourTime(d.endTime) : 'N/A';
    const activeHours = d.status === 'working' ? d.totalActiveHours.toString() : '0.0';
    const reason = d.status === 'non_working' ? (d.nonWorkingReason || 'N/A') : 'N/A';
    const taskSummary = d.tasks && d.tasks.length > 0 ? d.tasks.map(t => `${t.title} [${t.category}] (${t.hours}h)`).join('; ') : 'No granular tasks';
    const notesClean = (d.notes || '').replace(/"/g, '""');

    return [`"${formattedDate}"`, `"${dayOfWeek}"`, `"${status}"`, `"${startTime}"`, `"${endTime}"`, `"${activeHours}"`, `"${reason}"`, `"${taskSummary.replace(/"/g, '""')}"`, `"${notesClean}"`].join(',');
  });

  const metadata = [`"Employee Name: ${user.employeeName}"`, `"Department: ${user.department}"`, `"Manager: ${user.managerName}"`, `"Week Range: ${weekLabel}"`, `"Target Weekly Hours: ${user.targetWeeklyHours}"`, ''];
  const csvContent = 'data:text/csv;charset=utf-8,' + [metadata.join('\n'), headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `timecard_report_${weekLabel.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Custom PDF Generator that visually mimics the UI layout natively.
 */
export function exportToPDF(
  days: DayLog[],
  user: UserProfile,
  mondayDate: Date,
  isBarebonesMode: boolean = false
): void {
  // Use Standard US Letter format (215.9mm x 279.4mm)
  const doc = new jsPDF({ format: 'letter', unit: 'mm' });
  const weekLabel = formatWeekRange(mondayDate);
  const reportDays = filterDaysForManagerReport(days);
  const cleanManagerName = user.managerName.replace(/\s*\(.*?\)\s*/g, '').trim();

  const totalWorkedHours = reportDays.reduce((sum, d) => sum + (d.status === 'working' ? d.totalActiveHours : 0), 0);
  const targetHours = user.targetWeeklyHours || 40;
  const hoursDifference = totalWorkedHours - targetHours;
  const isGoalMet = totalWorkedHours >= targetHours;

  let y = 16; // Vertical cursor
  const leftMargin = 14;
  const contentWidth = 188; // 215.9 - 28

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > 270) {
      doc.addPage();
      y = 20;
    }
  };

  // 1. Header Section
  doc.setTextColor(79, 70, 229); // Indigo
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL WORKPLACE RECORD', leftMargin, y);

  y += 7;
  doc.setTextColor(15, 23, 42); // Black/Slate-900
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TIMECARD REPORT', leftMargin, y);

  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Week of: `, leftMargin, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(weekLabel, leftMargin + 16, y);

  // 2. Right-Aligned Metadata
  const rightAlignX = leftMargin + contentWidth;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Employee:  ${user.employeeName}`, rightAlignX, y - 10, { align: 'right' });
  doc.text(`Department:  ${user.department}`, rightAlignX, y - 5, { align: 'right' });
  doc.text(`Manager:  ${cleanManagerName}`, rightAlignX, y, { align: 'right' });

  y += 6;
  doc.setDrawColor(226, 232, 240); // Line separator
  doc.setLineWidth(0.5);
  doc.line(leftMargin, y, leftMargin + contentWidth, y);
  y += 8;

  // 3. Goal Status Box (The Yellow/Green Banner)
  doc.setFillColor(255, 251, 235); // Amber-50 (Using amber for both to match your specific screenshot style)
  doc.setDrawColor(253, 230, 138); // Amber-200
  doc.roundedRect(leftMargin, y, contentWidth, 22, 3, 3, 'FD');

  doc.setTextColor(146, 64, 14); // Amber-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Total Active Work Hours: ${totalWorkedHours.toFixed(1)} hrs`, leftMargin + 14, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const statusText = isGoalMet
    ? `Target met (+${hoursDifference.toFixed(1)} hrs over target).`
    : `Shortfall of ${Math.abs(hoursDifference).toFixed(1)} hrs below the ${targetHours}-hour target.`;
  doc.text(statusText, leftMargin + 14, y + 15);

  // Status Badge in Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(146, 64, 14);
  doc.setLineWidth(0.3);
  doc.roundedRect(rightAlignX - 34, y + 6, 28, 9, 4.5, 4.5, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(isGoalMet ? 'TARGET MET' : 'SHORTFALL', rightAlignX - 20, y + 12.5, { align: 'center' });

  y += 32;

  // 4. Daily Log Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text('DAILY WORK NOTICE', leftMargin, y);
  y += 6;

  // Draw each daily card
  reportDays.forEach(d => {
    const isWorking = d.status === 'working';
    const timeline = generateDailyTimeline(d);

    // Calculate how tall this specific day's box needs to be
    let innerContentHeight = 14;
    if (isWorking) {
      if (!isBarebonesMode && timeline.length > 0) {
        innerContentHeight += (timeline.length * 5) + 6; // Space for timeline
      }
      if (!isBarebonesMode && d.notes) {
        const splitNotes = doc.splitTextToSize(d.notes, 100);
        innerContentHeight += (splitNotes.length * 4) + 6; // Space for notes
      }
    }
    const boxHeight = Math.max(26, innerContentHeight + 8);
    checkPageBreak(boxHeight + 6);

    // Outer Beige Card Background
    doc.setFillColor(245, 243, 238); // Soft beige
    doc.setDrawColor(226, 222, 212); // Slightly darker beige border
    doc.setLineWidth(0.5);
    doc.roundedRect(leftMargin, y, contentWidth, boxHeight, 3, 3, 'FD');

    // Left Column: Date & Status Badge
    doc.setTextColor(15, 23, 42); // Black
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(formatShortDate(d.date), leftMargin + 4, y + 9);

    if (isWorking) {
      doc.setFillColor(209, 250, 229); // Emerald-100
      doc.setDrawColor(209, 250, 229);
      doc.roundedRect(leftMargin + 4, y + 13, 16, 5, 1, 1, 'FD');
      doc.setTextColor(6, 95, 70); // Emerald-800
      doc.setFontSize(7);
      doc.text('Working', leftMargin + 12, y + 16.5, { align: 'center' });
    } else {
      doc.setFillColor(254, 243, 199); // Amber-100
      doc.setDrawColor(254, 243, 199);
      doc.roundedRect(leftMargin + 4, y + 13, 12, 5, 1, 1, 'FD');
      doc.setTextColor(146, 64, 14);
      doc.setFontSize(7);
      doc.text('Off', leftMargin + 10, y + 16.5, { align: 'center' });
    }

    // Middle Column: White Information Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 222, 212);
    doc.roundedRect(leftMargin + 45, y + 4, 115, boxHeight - 8, 2, 2, 'FD');

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139); // Gray text
    doc.setFont('helvetica', 'bold');
    doc.text(isWorking ? 'LOGGED TIME' : 'REASON', leftMargin + 49, y + 9);

    let currentInnerY = y + 14;
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42); // Dark text

    if (isWorking) {
      doc.setFont('courier', 'bold'); // Monospaced time
      doc.text(`${format12HourTime(d.startTime)}  -  ${format12HourTime(d.endTime)}`, leftMargin + 49, currentInnerY);

      // Detailed View Items
      if (!isBarebonesMode) {
        if (timeline.length > 0) {
          currentInnerY += 7;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text('TIMELINE LOG', leftMargin + 49, currentInnerY);
          currentInnerY += 5;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(15, 23, 42);
          timeline.forEach(event => {
            const prefix = event.type === 'task' ? '• ' : '☕ ';
            doc.text(`${prefix}${event.title} (${event.hours}h)   [${event.timeDisplay}]`, leftMargin + 49, currentInnerY);
            currentInnerY += 5;
          });
        }
        if (d.notes) {
          currentInnerY += 3;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text('NOTES', leftMargin + 49, currentInnerY);
          currentInnerY += 4;

          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          const splitNotes = doc.splitTextToSize(d.notes, 105);
          doc.text(splitNotes, leftMargin + 49, currentInnerY);
        }
      }
    } else {
      doc.setFont('helvetica', 'italic');
      doc.text(d.nonWorkingReason || 'No reason specified', leftMargin + 49, currentInnerY);
    }

    // Right Column: Total Hours
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', rightAlignX - 10, y + 10, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.setFont('courier', 'bold');
    doc.text(`${isWorking ? d.totalActiveHours.toFixed(1) : '0.0'}h`, rightAlignX - 10, y + 16, { align: 'center' });

    y += boxHeight + 4; // Space between cards
  });

  const sanitizedWeek = weekLabel.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Manager_Timecard_${sanitizedWeek}.pdf`);
}