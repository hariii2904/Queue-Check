import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { Logo } from '../components/common/Logo';
import {
  Lock,
  Mail,
  UserCheck,
  ShieldCheck,
  Stethoscope,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { switchRole, loginAs, demoProfiles } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (email.toLowerCase().includes('admin')) {
        switchRole('admin');
        showToast('Logged in as Platform Administrator', 'success');
        navigate('/admin');
      } else {
        switchRole('receptionist', 'hosp-1');
        showToast('Logged in as Clinic Receptionist (Kilpauk)', 'success');
        navigate('/receptionist');
      }
    }, 400);
  };

  const handleOneClickLogin = (profileId: string, role: string) => {
    loginAs(profileId);
    showToast(`Logged in as ${role}`, 'success');
    if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/receptionist');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-900/5 p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Logo size="lg" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Staff & Hospital Portal
          </h1>
          <p className="text-xs text-slate-500">
            Secure Role-Based Access Control (RBAC) for Hospital Staff & Admins
          </p>
        </div>

        {/* 1-Click Quick Demo Login Shortcuts */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <UserCheck size={14} className="text-teal-600" />
            <span>Instant Demo Logins (No password needed):</span>
          </div>

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => handleOneClickLogin('user-rec-1', 'receptionist')}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-teal-50 border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-between transition-colors shadow-2xs cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Stethoscope size={14} className="text-teal-600" />
                <span>Receptionist (Apollo Kilpauk)</span>
              </div>
              <ArrowRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => handleOneClickLogin('user-rec-2', 'receptionist')}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-teal-50 border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-between transition-colors shadow-2xs cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Stethoscope size={14} className="text-teal-600" />
                <span>Receptionist (Kauvery Hospital)</span>
              </div>
              <ArrowRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => handleOneClickLogin('user-admin', 'admin')}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-between transition-colors shadow-2xs cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-indigo-600" />
                <span>Platform Admin (Chennai HQ)</span>
              </div>
              <ArrowRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
          <div className="flex-1 h-px bg-slate-200" />
          <span>or sign in with credentials</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Standard Form */}
        <form onSubmit={handleManualLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Staff Email Address
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="staff@apollo.queuecheck.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:border-sky-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            {isLoading ? t.loading : 'Sign In to Portal'}
          </button>
        </form>

        {/* Security / Privacy notice */}
        <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 flex items-start gap-2">
          <ShieldAlert size={14} className="text-slate-400 shrink-0 mt-0.5" />
          <span>
            Follows privacy-by-design. Staff members only access queues within their assigned facility.
          </span>
        </div>
      </div>
    </div>
  );
};
