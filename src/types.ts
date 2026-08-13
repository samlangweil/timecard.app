export type WorkStatus = 'working' | 'non_working';

export type NonWorkingReason =
  | 'PTO / Vacation'
  | 'Sick Leave'
  | 'Sick' // NEW
  | 'Weekend' // NEW
  | 'Off' // NEW
  | 'Company Holiday'
  | 'Doctor Appointment'
  | 'Personal Leave'
  | 'Remote Travel'
  | 'Training / Conference'
  | 'Other';

export type TaskCategory =
  | 'Projects'
  | 'Phone/Video Calls'
  | 'Urgent Matters'
  | 'Administrative'
  | 'Meetings'
  | 'Development'
  | 'Client Support'
  | 'Other';

export interface TaskItem {
  id: string;
  title: string;
  projectName?: string;
  category: TaskCategory;
  hours: number;
  description?: string;
}

// NEW: Interface for tracking breaks/OOO within a working day
export interface BreakItem {
  id: string;
  startTime: string; // 24h format
  endTime: string;   // 24h format
  reason: string;    // e.g., "Lunch", "Doctor", "School Run"
}

export interface DayLog {
  date: string;
  status: WorkStatus;
  nonWorkingReason?: NonWorkingReason | string;
  startTime: string;
  endTime: string;
  totalActiveHours: number;
  isManualHoursOverride?: boolean;
  notes: string;
  tasks: TaskItem[];
  breaks?: BreakItem[]; // NEW: Added breaks array
}

export interface UserProfile {
  employeeName: string;
  employeeId: string;
  department: string;
  managerName: string;
  managerEmail?: string;
  targetWeeklyHours: number; // default 40
}

export interface ReminderSettings {
  enabled: boolean;
  clockInTime: string; // e.g. "07:30"
  clockOutTime: string; // e.g. "18:00"
  weekdaysOnly: boolean; // default true
  soundEnabled: boolean;
  desktopNotifications: boolean;
}

export interface CalendarWeek {
  weekStartDate: string; // YYYY-MM-DD for Monday (or Sunday)
  days: DayLog[];
}
