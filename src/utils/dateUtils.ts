import { DayLog, BreakItem, TaskItem } from '../types';
import {
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  parse,
  parseISO,
  addWeeks,
  subWeeks,
  isSameDay,
  isToday,
  differenceInMinutes
} from 'date-fns';

/**
 * Returns the Monday of the week containing the given date string or Date object.
 */
export function getWeekMonday(dateInput: Date | string): Date {
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  return startOfWeek(date, { weekStartsOn: 1 }); // 1 = Monday
}

/**
 * Returns an array of 7 dates (Mon-Sun) for a given week start Monday.
 */
export function getDaysOfWeek(mondayDate: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(mondayDate, i));
}

/**
 * Formats a date object to YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Pretty formats a date string (e.g., "Mon, Aug 5")
 */
export function formatShortDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'EEE, MMM d');
  } catch {
    return dateStr;
  }
}

/**
 * Pretty formats full date (e.g. "Monday, August 5, 2026")
 */
export function formatFullDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'EEEE, MMMM d, yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Converts 24h time string (e.g., "08:30") to 12h display string (e.g., "8:30 AM")
 */
export function format12HourTime(time24: string): string {
  if (!time24) return '--';
  try {
    const parsed = parse(time24, 'HH:mm', new Date());
    return format(parsed, 'h:mm a');
  } catch {
    return time24;
  }
}

/**
 * Calculates decimal hours between start and end time 24h strings (e.g. "08:30" to "17:00" => 8.5)
 */

export function calculateActiveHours(startTime: string, endTime: string, breaks: BreakItem[] = []): number {
  if (!startTime || !endTime) return 0;
  try {
    const today = new Date();
    const start = parse(startTime, 'HH:mm', today);
    let end = parse(endTime, 'HH:mm', today);

    // Handle overnight shifts if end is earlier than start
    if (end < start) {
      end = addDays(end, 1);
    }

    let minutes = differenceInMinutes(end, start);

    // Subtract any logged break durations
    if (breaks && breaks.length > 0) {
      breaks.forEach(b => {
        if (b.startTime && b.endTime) {
          const bStart = parse(b.startTime, 'HH:mm', today);
          let bEnd = parse(b.endTime, 'HH:mm', today);
          if (bEnd < bStart) bEnd = addDays(bEnd, 1);

          const breakMins = differenceInMinutes(bEnd, bStart);
          if (!isNaN(breakMins) && breakMins > 0) {
            minutes -= breakMins;
          }
        }
      });
    }

    if (isNaN(minutes) || minutes <= 0) return 0;

    // Round to 2 decimal places
    return Math.round((minutes / 60) * 100) / 100;
  } catch {
    return 0;
  }
}

/**
 * Moves week forward or backward
 */
export function shiftWeek(mondayDate: Date, weeks: number): Date {
  return weeks >= 0 ? addWeeks(mondayDate, weeks) : subWeeks(mondayDate, Math.abs(weeks));
}

/**
 * Formats a range for week header (e.g. "Aug 3 – Aug 9, 2026")
 */
export function formatWeekRange(mondayDate: Date): string {
  const sundayDate = addDays(mondayDate, 6);
  const startMonth = format(mondayDate, 'MMM d');
  const endMonth = format(sundayDate, 'MMM d, yyyy');
  return `${startMonth} – ${endMonth}`;
}

/**
 * Checks if a given YYYY-MM-DD date string falls on Saturday or Sunday.
 */
export function isWeekendDay(dateStr: string): boolean {
  try {
    const day = parseISO(dateStr).getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  } catch {
    return false;
  }
}

/**
 * Filters days for the Manager Report:
 * Excludes Saturday and Sunday UNLESS hours have been logged for those days (totalActiveHours > 0).
 */
export function filterDaysForManagerReport(days: DayLog[]): DayLog[] {
  return days.filter(d => {
    if (isWeekendDay(d.date)) {
      return d.totalActiveHours > 0;
    }
    return true;
  });
}

/**
 * Calculates chronological start and end times for a task, automatically fast-forwarding through breaks.
 */
export function getTaskTimeRange(
  startTime: string,
  taskIndex: number,
  tasks: TaskItem[],
  breaks: BreakItem[] = []
): string {
  if (!startTime) return '';
  try {
    const today = new Date();
    let cursor = parse(startTime, 'HH:mm', today);

    // Parse and sort breaks chronologically
    const parsedBreaks = breaks
      .filter(b => b.startTime && b.endTime)
      .map(b => {
        let bStart = parse(b.startTime, 'HH:mm', today);
        let bEnd = parse(b.endTime, 'HH:mm', today);
        if (bEnd < bStart) bEnd = addDays(bEnd, 1);
        return { start: bStart, end: bEnd };
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    // Helper: Fast-forwards the clock if it currently sits inside a break
    const skipBreaks = (current: Date) => {
      let time = new Date(current.getTime());
      let inBreak = true;
      while (inBreak) {
        inBreak = false;
        for (const b of parsedBreaks) {
          if (time >= b.start && time < b.end) {
            time = new Date(b.end.getTime());
            inBreak = true;
          }
        }
      }
      return time;
    };

    let taskStart = cursor;
    let taskEnd = cursor;

    // Simulate the clock ticking through all tasks up to the target one
    for (let i = 0; i <= taskIndex; i++) {
      // Fast forward over any breaks before starting this task
      cursor = skipBreaks(cursor);
      taskStart = new Date(cursor.getTime());

      let minsRemaining = Math.round(tasks[i].hours * 60);

      // Allocate time to the task, jumping over breaks if it spans across them
      while (minsRemaining > 0) {
        const nextBreak = parsedBreaks.find(b => b.start > cursor);

        if (nextBreak) {
          const msToBreak = nextBreak.start.getTime() - cursor.getTime();
          const minsToBreak = msToBreak / 60000;

          if (minsToBreak < minsRemaining) {
            // Work until the break starts
            cursor = new Date(nextBreak.start.getTime());
            minsRemaining -= minsToBreak;
            // Skip the break itself
            cursor = skipBreaks(cursor);
          } else {
            // Task finishes before the next break
            cursor = new Date(cursor.getTime() + minsRemaining * 60000);
            minsRemaining = 0;
          }
        } else {
          // No more breaks for the rest of the day
          cursor = new Date(cursor.getTime() + minsRemaining * 60000);
          minsRemaining = 0;
        }
      }
      taskEnd = new Date(cursor.getTime());
    }

    return `${format(taskStart, 'h:mm a')} - ${format(taskEnd, 'h:mm a')}`;
  } catch (e) {
    return '';
  }
}

export interface TimelineEvent {
  id: string;
  type: 'task' | 'break';
  title: string;
  category?: string;
  projectName?: string;
  timeDisplay: string;
  hours: number;
  sortTime: number;
}

/**
 * Generates a unified, chronologically sorted timeline of tasks and breaks for the UI.
 */
export function generateDailyTimeline(dayLog: DayLog): TimelineEvent[] {
  if (!dayLog.startTime) return [];
  try {
    const today = new Date();
    let cursor = parse(dayLog.startTime, 'HH:mm', today);
    const breaks = dayLog.breaks || [];
    const tasks = dayLog.tasks || [];

    // Parse breaks
    const parsedBreaks = breaks
      .filter(b => b.startTime && b.endTime)
      .map(b => {
        let bStart = parse(b.startTime, 'HH:mm', today);
        let bEnd = parse(b.endTime, 'HH:mm', today);
        if (bEnd < bStart) bEnd = addDays(bEnd, 1);
        return { ...b, start: bStart, end: bEnd, durationHours: (bEnd.getTime() - bStart.getTime()) / 3600000 };
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const skipBreaks = (current: Date) => {
      let time = new Date(current.getTime());
      let inBreak = true;
      while (inBreak) {
        inBreak = false;
        for (const b of parsedBreaks) {
          if (time >= b.start && time < b.end) {
            time = new Date(b.end.getTime());
            inBreak = true;
          }
        }
      }
      return time;
    };

    const events: TimelineEvent[] = [];

    // 1. Add Breaks to timeline
    parsedBreaks.forEach(b => {
      events.push({
        id: b.id,
        type: 'break',
        title: b.reason || 'Break',
        timeDisplay: `${format(b.start, 'h:mm a')} - ${format(b.end, 'h:mm a')}`,
        hours: Math.round(b.durationHours * 100) / 100,
        sortTime: b.start.getTime()
      });
    });

    // 2. Add Tasks to timeline (Simulating the clock)
    for (let i = 0; i < tasks.length; i++) {
      cursor = skipBreaks(cursor);
      const taskStart = new Date(cursor.getTime());
      let minsRemaining = Math.round(tasks[i].hours * 60);

      while (minsRemaining > 0) {
        const nextBreak = parsedBreaks.find(b => b.start > cursor);
        if (nextBreak) {
          const minsToBreak = (nextBreak.start.getTime() - cursor.getTime()) / 60000;
          if (minsToBreak < minsRemaining) {
            cursor = new Date(nextBreak.start.getTime());
            minsRemaining -= minsToBreak;
            cursor = skipBreaks(cursor);
          } else {
            cursor = new Date(cursor.getTime() + minsRemaining * 60000);
            minsRemaining = 0;
          }
        } else {
          cursor = new Date(cursor.getTime() + minsRemaining * 60000);
          minsRemaining = 0;
        }
      }
      const taskEnd = new Date(cursor.getTime());

      events.push({
        id: tasks[i].id,
        type: 'task',
        title: tasks[i].title,
        category: tasks[i].category,
        projectName: tasks[i].projectName,
        timeDisplay: `${format(taskStart, 'h:mm a')} - ${format(taskEnd, 'h:mm a')}`,
        hours: tasks[i].hours,
        sortTime: taskStart.getTime()
      });
    }

    // Sort chronologically
    return events.sort((a, b) => a.sortTime - b.sortTime);
  } catch {
    return [];
  }
}