export type WorkStatus = 'working' | 'non_working';

export type NonWorkingReason =
  | 'PTO / Vacation'
  | 'Sick Leave'
  | 'Sick'
  | 'Weekend'
  | 'Off'
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

export interface BreakItem {
  id: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface DayLog {
  date: string;
  status: WorkStatus;
  nonWorkingReason?: NonWorkingReason | string;
  startTime: string;
  endTime: string;
  totalActiveHours: number;
  timeOffHours?: number;
  isManualHoursOverride?: boolean;
  notes: string;
  tasks: TaskItem[];
  breaks?: BreakItem[];
}

export interface UserProfile {
  employeeName: string;
  employeeId: string;
  department: string;
  managerName: string;
  managerEmail?: string;
  targetWeeklyHours: number;
  annualPTOAllowance?: number; // <-- NEW: Tracks your global PTO cap
}

export interface ReminderSettings {
  enabled: boolean;
  clockInTime: string;
  clockOutTime: string;
  weekdaysOnly: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
}

export interface CalendarWeek {
  weekStartDate: string;
  days: DayLog[];
}