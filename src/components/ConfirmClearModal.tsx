import React from 'react';
import { AlertTriangle, X, Eraser } from 'lucide-react';
import { formatFullDate } from '../utils/dateUtils';

interface ConfirmClearModalProps {
  isOpen: boolean;
  type: 'day' | 'week';
  dateStr?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmClearModal: React.FC<ConfirmClearModalProps> = ({
  isOpen,
  type,
  dateStr,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const title = type === 'day' ? 'Clear Day Data' : 'Clear Entire Week';

  const description = type === 'day'
    ? "Are you sure? This will clear all data logged, including hours and activities."
    : "Are you sure? This will clear all data logged, including hours and activities for the entire week.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans text-slate-800">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-100 border border-rose-200 text-rose-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">{description}</p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-800 font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex items-center justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5"
          >
            <Eraser className="w-4 h-4" />
            {type === 'day' ? 'Clear Day' : 'Clear Week'}
          </button>
        </div>

      </div>
    </div>
  );
};
