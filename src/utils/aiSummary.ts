import { DayLog } from '../types';

/**
 * Generates a simple text summary for a single day's notes.
 */
export const generateDailySummary = (dayLog: DayLog): string => {
  if (dayLog.status === 'non_working') {
    return `Out of office: ${dayLog.nonWorkingReason || 'Unspecified'}`;
  }
  if (!dayLog.tasks || dayLog.tasks.length === 0) {
    return `Completed ${dayLog.totalActiveHours.toFixed(1)} hours of standard operational duties.`;
  }

  const taskNames = dayLog.tasks.map(t => t.title).join(', ');
  return `Successfully advanced the following items today: ${taskNames}.`;
};

/**
 * Synthesizes a highly professional, 3-sentence weekly summary for a manager email
 * by analyzing task categories and time spent.
 */
export const generateWeeklyManagerOverview = (days: DayLog[], totalHours: number, targetHours: number): string => {
  const workingDays = days.filter(d => d.status === 'working');

  // Edge Case: No work done this week
  if (workingDays.length === 0) {
    return "I was out of the office for the entirety of this week and have logged my credited time accordingly.";
  }

  const allTasks = workingDays.flatMap(d => d.tasks || []);

  // Edge Case: Worked, but no specific tasks were logged
  if (allTasks.length === 0) {
    return `This week, I completed ${totalHours.toFixed(1)} hours of routine operational duties and standard workflows. All daily responsibilities were managed effectively and within expectations. Please let me know if you need any additional details regarding my logged hours!`;
  }

  // 1. Find the primary focus (the category with the most hours)
  const categoryHours: Record<string, number> = {};
  allTasks.forEach(t => {
    categoryHours[t.category] = (categoryHours[t.category] || 0) + t.hours;
  });

  const sortedCategories = Object.entries(categoryHours).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories[0][0];

  // 2. Find the top 2 biggest accomplishments (tasks with the most hours)
  const sortedTasks = [...allTasks].sort((a, b) => b.hours - a.hours);
  const topTasks = sortedTasks.slice(0, 2).map(t => t.title);

  // 3. Assemble the synthesized sentences
  let summary = `This week, I directed the majority of my focus toward ${topCategory} initiatives. `;

  if (topTasks.length > 0) {
    summary += `Key accomplishments included driving progress on "${topTasks[0]}"`;
    if (topTasks.length > 1) {
      summary += ` and successfully executing "${topTasks[1]}". `;
    } else {
      summary += `. `;
    }
  }

  summary += "All regular communications and departmental workflows were maintained alongside these primary objectives.";

  return summary;
};