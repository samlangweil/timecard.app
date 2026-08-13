import { DayLog, TaskItem } from '../types';
import { format12HourTime } from './dateUtils';

/**
 * Generates an executive daily summary from tasks and work status
 */
export function generateDailySummary(dayLog: DayLog): string {
  if (dayLog.status === 'non_working') {
    return `STATUS: Non-Working Day\nREASON: ${dayLog.nonWorkingReason || 'Not specified'}\nNote: No active work hours logged for this date.`;
  }

  const startTimeFormatted = format12HourTime(dayLog.startTime);
  const endTimeFormatted = format12HourTime(dayLog.endTime);
  const totalHours = dayLog.totalActiveHours;

  let summary = `ACTIVE WORK HOURS: ${startTimeFormatted} – ${endTimeFormatted} (${totalHours} hrs total)\n`;

  if (dayLog.tasks && dayLog.tasks.length > 0) {
    summary += `\nKEY ACTIVITIES & DELIVERABLES:\n`;
    
    // Group tasks by category
    const categoryMap = new Map<string, TaskItem[]>();
    dayLog.tasks.forEach(task => {
      const list = categoryMap.get(task.category) || [];
      list.push(task);
      categoryMap.set(task.category, list);
    });

    categoryMap.forEach((tasks, category) => {
      summary += `• [${category.toUpperCase()}]\n`;
      tasks.forEach(t => {
        const projectTag = t.projectName ? ` (${t.projectName})` : '';
        const desc = t.description ? ` - ${t.description}` : '';
        summary += `   - ${t.title}${projectTag}: ${t.hours}h${desc}\n`;
      });
    });
  } else {
    summary += `\nNote: General active work carried out. No granular sub-tasks categorized.`;
  }

  if (dayLog.notes && dayLog.notes.trim().length > 0 && !dayLog.notes.includes('KEY ACTIVITIES & DELIVERABLES')) {
    summary += `\nDAILY NOTES & CIRCUMSTANCES:\n${dayLog.notes}`;
  }

  return summary.trim();
}

/**
 * Generates a weekly overview summary for the manager report
 */
export function generateWeeklyManagerOverview(days: DayLog[], totalHours: number, targetHours: number): string {
  const workingDays = days.filter(d => d.status === 'working');
  const nonWorkingDays = days.filter(d => d.status === 'non_working');

  let overview = `WEEKLY TIMECARD SUMMARY REPORT\n`;
  overview += `Total Active Hours Logged: ${totalHours} hrs / Target: ${targetHours} hrs `;
  
  if (totalHours >= targetHours) {
    overview += `(Goal Met: +${(totalHours - targetHours).toFixed(1)} hrs)\n`;
  } else {
    overview += `(Shortfall: ${(targetHours - totalHours).toFixed(1)} hrs remaining)\n`;
  }

  overview += `Days Worked: ${workingDays.length} | Non-Working Days: ${nonWorkingDays.length}\n`;

  if (nonWorkingDays.length > 0) {
    overview += `\nNON-WORKING DAYS SUMMARY:\n`;
    nonWorkingDays.forEach(d => {
      overview += `• ${d.date}: ${d.nonWorkingReason || 'No reason provided'}\n`;
    });
  }

  return overview.trim();
}
