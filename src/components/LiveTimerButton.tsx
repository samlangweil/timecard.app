import React, { useState, useEffect } from 'react';
import { Play, Square, Clock } from 'lucide-react';

interface LiveTimerButtonProps {
    clockInISO: string | null;
    onClockIn: () => void;
    onClockOut: () => void;
}

export const LiveTimerButton: React.FC<LiveTimerButtonProps> = ({ clockInISO, onClockIn, onClockOut }) => {
    const [elapsed, setElapsed] = useState('00:00:00');

    // Calculates the live running time every second
    useEffect(() => {
        if (!clockInISO) {
            setElapsed('00:00:00');
            return;
        }

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const start = new Date(clockInISO).getTime();
            const diff = now - start;

            const hrs = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            setElapsed(
                `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [clockInISO]);

    return (
        <div className="bg-white border border-slate-200/90 shadow-sm rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl transition-colors ${clockInISO ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    <Clock className={`w-6 h-6 ${clockInISO ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-900">Live Time Tracker</h3>
                    <p className="text-xs text-slate-500">{clockInISO ? 'You are currently clocked in and recording active hours.' : 'Ready to start your day?'}</p>
                </div>
            </div>

            <div className="flex items-center gap-5 w-full sm:w-auto justify-between sm:justify-end">
                {clockInISO && (
                    <div className="text-3xl font-black font-mono text-slate-800 tracking-tight">
                        {elapsed}
                    </div>
                )}

                {!clockInISO ? (
                    <button
                        onClick={onClockIn}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                        <Play className="w-4 h-4 fill-current" /> Clock In
                    </button>
                ) : (
                    <button
                        onClick={onClockOut}
                        className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                        <Square className="w-4 h-4 fill-current" /> Clock Out
                    </button>
                )}
            </div>
        </div>
    );
};