import React, { useState } from 'react';
import { ReminderSettings } from '../types';
import { format12HourTime } from '../utils/dateUtils';
import { 
  X, 
  Bell, 
  Clock, 
  Check, 
  Volume2, 
  VolumeX, 
  Play, 
  CalendarCheck 
} from 'lucide-react';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: ReminderSettings;
  onSaveReminders: (updated: ReminderSettings) => void;
  onTriggerTestReminder: (type: 'clockIn' | 'clockOut') => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  reminders,
  onSaveReminders,
  onTriggerTestReminder
}) => {
  const [enabled, setEnabled] = useState(reminders.enabled);
  const [clockInTime, setClockInTime] = useState(reminders.clockInTime || '07:30');
  const [clockOutTime, setClockOutTime] = useState(reminders.clockOutTime || '18:00');
  const [weekdaysOnly, setWeekdaysOnly] = useState(reminders.weekdaysOnly);
  const [soundEnabled, setSoundEnabled] = useState(reminders.soundEnabled);
  const [desktopNotifications, setDesktopNotifications] = useState(reminders.desktopNotifications);
  const [permissionState, setPermissionState] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  if (!isOpen) return null;

  const handleRequestDesktopPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      if (permission === 'granted') {
        setDesktopNotifications(true);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveReminders({
      enabled,
      clockInTime,
      clockOutTime,
      weekdaysOnly,
      soundEnabled,
      desktopNotifications
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto font-sans text-slate-800">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl my-8">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Weekday Timecard Reminders
              </h3>
              <p className="text-xs text-slate-500">
                Clock-in (7:30 AM) & Clock-out (6:00 PM) alerts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-5 text-slate-800">
          
          {/* Main Enable Switch */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Enable Automated Daily Reminders</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Notifies you to log active hours on workplace schedule
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {enabled && (
            <div className="space-y-4">
              
              {/* Times Config */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                  <label className="text-[11px] font-bold text-indigo-700 block mb-1">
                    Morning Clock-In Time
                  </label>
                  <input
                    type="time"
                    value={clockInTime}
                    onChange={(e) => setClockInTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Default: {format12HourTime('07:30')}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                  <label className="text-[11px] font-bold text-rose-700 block mb-1">
                    Evening Clock-Out Time
                  </label>
                  <input
                    type="time"
                    value={clockOutTime}
                    onChange={(e) => setClockOutTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Default: {format12HourTime('18:00')} (6:00 PM max)
                  </span>
                </div>
              </div>

              {/* Weekdays Only Toggle */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-indigo-600" />
                  Trigger on Weekdays Only (Mon – Fri)
                </span>
                <input
                  type="checkbox"
                  checked={weekdaysOnly}
                  onChange={(e) => setWeekdaysOnly(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                />
              </div>

              {/* Sound & Browser Notification Settings */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-bold flex items-center gap-2">
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                    Play Audio Chime Alert
                  </span>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-slate-700 font-bold block">Browser Desktop Notifications</span>
                    <span className="text-[10px] text-slate-500">
                      Permission: <strong className="uppercase">{permissionState}</strong>
                    </span>
                  </div>

                  {permissionState === 'granted' ? (
                    <input
                      type="checkbox"
                      checked={desktopNotifications}
                      onChange={(e) => setDesktopNotifications(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestDesktopPermission}
                      className="text-[11px] font-bold text-indigo-700 hover:underline bg-indigo-50 px-2 py-1 rounded border border-indigo-200"
                    >
                      Enable Permission
                    </button>
                  )}
                </div>
              </div>

              {/* TEST REMINDER BUTTONS */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Test Reminder Trigger
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onTriggerTestReminder('clockIn')}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 text-indigo-600" />
                    Test 7:30 AM Alert
                  </button>

                  <button
                    type="button"
                    onClick={() => onTriggerTestReminder('clockOut')}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 text-rose-600" />
                    Test 6:00 PM Alert
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Reminder Settings
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
