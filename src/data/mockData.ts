import { DayLog, UserProfile, ReminderSettings } from '../types';
import { getWeekMonday, getDaysOfWeek, formatDateKey } from '../utils/dateUtils';

export const initialUserProfile: UserProfile = {
  employeeName: 'Sam Langweil',
  employeeId: 'EMP-4092',
  department: 'Product Engineering',
  managerName: 'Alex Rivera (VP Operations)',
  managerEmail: 'alex.rivera@entrusted.com',
  targetWeeklyHours: 40,
};

export const initialReminderSettings: ReminderSettings = {
  enabled: true,
  clockInTime: '07:30',
  clockOutTime: '18:00',
  weekdaysOnly: true,
  soundEnabled: true,
  desktopNotifications: false,
};

export function createSampleWeekLogs(mondayDate: Date): DayLog[] {
  const days = getDaysOfWeek(mondayDate);

  // Maps over the 7 days and returns a completely blank slate for each
  return days.map((d) => ({
    date: formatDateKey(d),
    status: 'working',
    startTime: '', // Blank so you have to input it
    endTime: '',   // Blank so you have to input it
    totalActiveHours: 0,
    notes: '',
    tasks: [],
    breaks: [],
  }));
}