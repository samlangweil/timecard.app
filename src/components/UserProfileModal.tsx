import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { X, User, Check, Briefcase, Mail, Hash, Target, CalendarOff } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSaveProfile: (user: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user, onSaveProfile }) => {
  const [formData, setFormData] = useState<UserProfile>(user);

  useEffect(() => {
    setFormData(user);
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl my-8">

        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl"><User className="w-5 h-5" /></div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">User Profile Settings</h3>
              <p className="text-xs text-slate-500">Manage your employment details & goals</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Full Name</label>
              <input type="text" value={formData.employeeName} onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1 flex items-center gap-1"><Hash className="w-3 h-3" /> Employee ID</label>
              <input type="text" value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Department</label>
            <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Manager Name</label>
              <input type="text" value={formData.managerName} onChange={(e) => setFormData({ ...formData, managerName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Manager Email</label>
              <input type="email" value={formData.managerEmail || ''} onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1 flex items-center gap-1"><Target className="w-3 h-3" /> Weekly Target (Hrs)</label>
              <input type="number" min="1" max="100" value={formData.targetWeeklyHours} onChange={(e) => setFormData({ ...formData, targetWeeklyHours: Number(e.target.value) })} className="w-full bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl px-3 py-2 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div>
              <label className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-1 flex items-center gap-1"><CalendarOff className="w-3 h-3" /> Annual PTO Vault (Hrs)</label>
              <input type="number" min="0" max="500" value={formData.annualPTOAllowance || 120} onChange={(e) => setFormData({ ...formData, annualPTOAllowance: Number(e.target.value) })} className="w-full bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-3 py-2 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-amber-500" required />
            </div>
          </div>

          <div className="pt-4 mt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"><Check className="w-4 h-4" /> Save Profile</button>
          </div>
        </form>

      </div>
    </div>
  );
};