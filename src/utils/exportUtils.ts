import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DayLog, UserProfile } from '../types';
import { formatShortDate, formatFullDate, format12HourTime, formatWeekRange, filterDaysForManagerReport } from './dateUtils';

/**
 * Downloads a CSV file of the weekly timecard log (excluding empty weekend days)
 */
export function exportToCSV(days: DayLog[], user: UserProfile, mondayDate: Date): void {
  const weekLabel = formatWeekRange(mondayDate);
  const reportDays = filterDaysForManagerReport(days);
  
  const headers = [
    'Date',
    'Day of Week',
    'Status',
    'Start Time',
    'End Time',
    'Total Active Hours',
    'Non-Working Reason',
    'Task Breakdown & Hours',
    'Personal Notes / Circumstances'
  ];

  const rows = reportDays.map(d => {
    const formattedDate = d.date;
    const dayOfWeek = formatShortDate(d.date).split(',')[0];
    const status = d.status === 'working' ? 'Working' : 'Not Working';
    const startTime = d.status === 'working' ? format12HourTime(d.startTime) : 'N/A';
    const endTime = d.status === 'working' ? format12HourTime(d.endTime) : 'N/A';
    const activeHours = d.status === 'working' ? d.totalActiveHours.toString() : '0.0';
    const reason = d.status === 'non_working' ? (d.nonWorkingReason || 'N/A') : 'N/A';
    
    const taskSummary = d.tasks && d.tasks.length > 0
      ? d.tasks.map(t => `${t.title} [${t.category}] (${t.hours}h)`).join('; ')
      : 'No granular tasks';

    // Clean notes for CSV escaping
    const notesClean = (d.notes || '').replace(/"/g, '""');

    return [
      `"${formattedDate}"`,
      `"${dayOfWeek}"`,
      `"${status}"`,
      `"${startTime}"`,
      `"${endTime}"`,
      `"${activeHours}"`,
      `"${reason}"`,
      `"${taskSummary.replace(/"/g, '""')}"`,
      `"${notesClean}"`
    ].join(',');
  });

  const metadata = [
    `"Employee Name: ${user.employeeName}"`,
    `"Employee ID: ${user.employeeId}"`,
    `"Department: ${user.department}"`,
    `"Manager: ${user.managerName}"`,
    `"Week Range: ${weekLabel}"`,
    `"Target Weekly Hours: ${user.targetWeeklyHours}"`,
    ''
  ];

  const csvContent = 'data:text/csv;charset=utf-8,' + [metadata.join('\n'), headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const sanitizedWeek = weekLabel.replace(/[^a-zA-Z0-9]/g, '_');
  link.setAttribute('download', `timecard_report_${sanitizedWeek}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates and downloads a polished PDF Manager Timecard Report
 */
export function exportToPDF(
  days: DayLog[], 
  user: UserProfile, 
  mondayDate: Date, 
  isBarebonesMode: boolean = false
): void {
  const doc = new jsPDF();
  const weekLabel = formatWeekRange(mondayDate);
  const reportDays = filterDaysForManagerReport(days);

  // Total calculation
  const totalWorkedHours = reportDays.reduce((sum, d) => sum + (d.status === 'working' ? d.totalActiveHours : 0), 0);
  const targetHours = user.targetWeeklyHours || 40;
  const hoursDifference = totalWorkedHours - targetHours;

  // Title Block
  doc.setFillColor(79, 70, 229); // Indigo-600
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('WORKPLACE TIMECARD REPORT', 14, 15);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 15);

  // Employee Metadata Grid
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Information:', 14, 38);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${user.employeeName} (${user.employeeId})`, 14, 44);
  doc.text(`Department: ${user.department}`, 14, 50);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Report Details:', 120, 38);
  doc.setFont('helvetica', 'normal');
  doc.text(`Manager: ${user.managerName}`, 120, 44);
  doc.text(`Period: ${weekLabel}`, 120, 50);

  // Weekly Summary Highlight Box
  doc.setFillColor(241, 245, 249); // Slate-100
  doc.roundedRect(14, 56, 182, 20, 2, 2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Active Work Hours: ${totalWorkedHours.toFixed(1)} hrs`, 20, 68);
  
  if (hoursDifference >= 0) {
    doc.setTextColor(22, 101, 52); // Green
    doc.text(`Status: Target Met (${hoursDifference >= 0 ? '+' : ''}${hoursDifference.toFixed(1)} hrs over target)`, 110, 68);
  } else {
    doc.setTextColor(180, 83, 9); // Amber
    doc.text(`Status: Shortfall (${Math.abs(hoursDifference).toFixed(1)} hrs remaining to 40h target)`, 110, 68);
  }

  // Table Data Preparation
  const tableData = reportDays.map(d => {
    const dayName = formatShortDate(d.date);
    const isWorking = d.status === 'working';
    const statusText = isWorking ? 'Working' : 'Not Working';
    const startEnd = isWorking ? `${format12HourTime(d.startTime)} – ${format12HourTime(d.endTime)}` : 'N/A';
    const hours = isWorking ? `${d.totalActiveHours.toFixed(1)} h` : '0.0 h';
    
    let details = '';
    if (!isWorking) {
      details = `REASON: ${d.nonWorkingReason || 'Not Working'}`;
    } else if (isBarebonesMode) {
      details = d.notes ? `Note: ${d.notes}` : 'Active work hours logged.';
    } else {
      const taskList = (d.tasks || []).map(t => `${t.title} (${t.hours}h)`).join(', ');
      details = taskList ? `Tasks: ${taskList}` : (d.notes || 'Active work hours');
    }

    return [dayName, statusText, startEnd, hours, details];
  });

  autoTable(doc, {
    startY: 82,
    head: [['Day / Date', 'Status', 'Start - End Time', 'Active Hours', isBarebonesMode ? 'Notice / Notes' : 'Tasks & Details']],
    body: tableData,
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 4
    },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 24 },
      2: { cellWidth: 38 },
      3: { cellWidth: 26, fontStyle: 'bold' },
      4: { cellWidth: 62 }
    },
    theme: 'striped'
  });

  // Notes and Extenuating Circumstances
  let currentY = (doc as any).lastAutoTable.finalY + 12;

  const notesWithContent = reportDays.filter(d => d.notes && d.notes.trim().length > 0);
  if (notesWithContent.length > 0 && currentY < 230) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Personal Notes & Extenuating Circumstances:', 14, currentY);
    currentY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    
    notesWithContent.forEach(d => {
      if (currentY < 245) {
        const line = `${formatShortDate(d.date)}: ${d.notes}`;
        const splitText = doc.splitTextToSize(line, 182);
        doc.text(splitText, 14, currentY);
        currentY += splitText.length * 4;
      }
    });
  }

  // Official Report Footer Notice (Signatures removed per user preference)
  const footerY = Math.max(currentY + 10, 255);
  doc.setLineWidth(0.3);
  doc.setDrawColor(203, 213, 225);
  doc.line(14, footerY, 196, footerY);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'italic');
  doc.text('Official Timecard Notice & Record • Submitted Electronically • No Signatures Required', 14, footerY + 6);
  doc.text(`Employee: ${user.employeeName} (${user.employeeId}) | Reporting Manager: ${user.managerName}`, 14, footerY + 11);

  const sanitizedWeek = weekLabel.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Manager_Timecard_${sanitizedWeek}.pdf`);
}
