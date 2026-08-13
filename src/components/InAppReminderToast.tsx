import React, { useEffect } from 'react';
import { Bell, X, ArrowRight } from 'lucide-react';

interface InAppReminderToastProps {
  toast: {
    id: string;
    type: 'clockIn' | 'clockOut';
    title: string;
    message: string;
    time: string;
  } | null;
  onDismiss: () => void;
  onActionLogTime: () => void;
  soundEnabled: boolean;
}

// Web Audio API chime synthesizer
function playChimeSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Audio Context blocked or not supported
  }
}

export const InAppReminderToast: React.FC<InAppReminderToastProps> = ({
  toast,
  onDismiss,
  onActionLogTime,
  soundEnabled
}) => {
  useEffect(() => {
    if (toast && soundEnabled) {
      playChimeSound();
    }
  }, [toast, soundEnabled]);

  if (!toast) return null;

  const isClockIn = toast.type === 'clockIn';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full font-sans">
      <div 
        className={`border rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col gap-3 text-slate-800 ${
          isClockIn 
            ? 'bg-white/95 border-indigo-200 shadow-indigo-600/10' 
            : 'bg-white/95 border-rose-200 shadow-rose-600/10'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl text-white ${isClockIn ? 'bg-indigo-600' : 'bg-rose-600'}`}>
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                TIMECARD REMINDER • {toast.time}
              </span>
              <h4 className="text-sm font-bold text-slate-900">{toast.title}</h4>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {toast.message}
        </p>

        <div className="flex items-center space-x-2 pt-1">
          <button
            onClick={() => {
              onActionLogTime();
              onDismiss();
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white shadow-xs transition-all flex items-center justify-center gap-1.5 ${
              isClockIn ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-rose-600 hover:bg-rose-500'
            }`}
          >
            <span>Log Active Hours Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={onDismiss}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
