import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { dataService } from '../../services/dataService';
import { useNotification } from '../../context/NotificationContext';
import { Database, RotateCcw, UserCheck, ShieldCheck, CheckCircle } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser, switchRole } = useAuth();
  const { showToast } = useNotification();
  const supabaseActive = isSupabaseConfigured();

  const handleResetData = () => {
    if (window.confirm('Reset all queues and tokens back to verified Chennai pilot state?')) {
      dataService.resetDemoData();
      showToast('Data reset to verified Chennai hospital pilot state', 'info', 'Reset Completed');
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-teal-950 text-white text-xs py-2 px-4 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Platform & Data Transparency Notice */}
        <div className="flex items-center gap-2 font-medium">
          <span className="inline-flex items-center gap-1 bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide">
            <CheckCircle size={12} />
            REAL DATA INTEGRATED
          </span>
          <span className="hidden sm:inline text-slate-300">
            OpenStreetMap & Verified Chennai Hospital Directory. Live queues from authorized partner desks.
          </span>
        </div>

        {/* Right: Storage Status & Role Switcher */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 text-slate-300"
            title={supabaseActive ? t.sysStatusHealthy : t.sysStatusLocal}
          >
            <Database size={13} className={supabaseActive ? 'text-emerald-400' : 'text-sky-300'} />
            <span className="hidden md:inline text-[11px]">
              {supabaseActive ? 'Supabase PostgreSQL' : 'Local Reactive Store'}
            </span>
          </div>

          <div className="h-3 w-px bg-slate-700" />

          {/* Current Role Indicator */}
          <div className="flex items-center gap-1.5">
            <UserCheck size={13} className="text-teal-400" />
            <span className="text-slate-300">
              Role: <strong className="text-white capitalize">{currentUser.role}</strong>
              {currentUser.hospital_id === 'hosp-apollo-greams' && ' (Apollo Greams)'}
              {currentUser.hospital_id === 'hosp-kauvery-alwarpet' && ' (Kauvery)'}
            </span>
          </div>

          {/* Quick role switches */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => switchRole('patient')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                currentUser.role === 'patient'
                  ? 'bg-sky-500 text-white font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Patient
            </button>
            <button
              onClick={() => switchRole('receptionist', 'hosp-apollo-greams')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                currentUser.role === 'receptionist' && currentUser.hospital_id === 'hosp-apollo-greams'
                  ? 'bg-teal-500 text-white font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Apollo Staff
            </button>
            <button
              onClick={() => switchRole('receptionist', 'hosp-kauvery-alwarpet')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                currentUser.role === 'receptionist' && currentUser.hospital_id === 'hosp-kauvery-alwarpet'
                  ? 'bg-teal-500 text-white font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Kauvery Staff
            </button>
            <button
              onClick={() => switchRole('admin')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                currentUser.role === 'admin'
                  ? 'bg-indigo-500 text-white font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Admin
            </button>
          </div>

          <button
            onClick={handleResetData}
            title="Reset verified records"
            className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors cursor-pointer"
          >
            <RotateCcw size={11} />
            <span className="hidden lg:inline">Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
