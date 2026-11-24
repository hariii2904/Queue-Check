import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Token, Hospital } from '../types';
import { dataService, queueEvents } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { Modal } from '../components/common/Modal';
import { TokenBadge } from '../components/queue/TokenBadge';
import {
  User,
  Clock,
  Activity,
  ArrowRight,
  XCircle,
  Building2,
  Stethoscope,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTargetToken, setCancelTargetToken] = useState<Token | null>(null);

  const loadPatientTokens = async () => {
    // Find tokens by current patient name or sample Lakshmi
    const term = currentUser.role === 'patient' && currentUser.full_name ? currentUser.full_name : 'Lakshmi';
    const patientTokens = await dataService.getPatientTokens(term);
    setTokens(patientTokens);
    setLoading(false);
  };

  useEffect(() => {
    loadPatientTokens();
    const unsub = queueEvents.subscribe(loadPatientTokens);
    return unsub;
  }, [currentUser]);

  const activeToken = tokens.find((tok) => tok.status === 'waiting' || tok.status === 'consulting');
  const pastTokens = tokens.filter((tok) => tok.status !== 'waiting' && tok.status !== 'consulting');

  const handleConfirmCancel = async () => {
    if (!cancelTargetToken) return;
    await dataService.cancelToken(cancelTargetToken.id);
    showToast(`Token ${cancelTargetToken.token_number} cancelled.`, 'info', 'Token Cancelled');
    setCancelTargetToken(null);
    loadPatientTokens();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xl shrink-0">
            <User size={28} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full mb-1">
              <span>{t.myTokensTitle}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {currentUser.full_name}
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              {currentUser.phone || '+91 98401 23456'} • Patient ID: {currentUser.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/clinics"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Building2 size={15} />
            <span>Find Clinics & Book Token</span>
          </Link>
        </div>
      </div>

      {/* Active Token Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity size={18} className="text-emerald-600" />
            <span>{t.activeToken}</span>
          </h2>
          {activeToken && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live Line Synchronized
            </span>
          )}
        </div>

        {activeToken ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sky-200/90 shadow-md shadow-sky-900/5 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <TokenBadge tokenNumber={activeToken.token_number} status={activeToken.status} size="lg" />
                <div>
                  <div className="text-xs font-semibold text-slate-500">
                    {activeToken.status === 'consulting' ? 'Currently Consulting' : 'Waiting in Queue'}
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {activeToken.hospital_name || 'Participating Healthcare Center'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(`/track?token=${activeToken.token_number}`)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <span>Open Live Tracker</span>
                  <ExternalLink size={13} />
                </button>

                <button
                  onClick={() => setCancelTargetToken(activeToken)}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                >
                  <XCircle size={14} />
                  <span>{t.cancelToken}</span>
                </button>
              </div>
            </div>

            {/* Token Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-slate-400 font-medium">{t.doctorName}</div>
                <div className="font-bold text-slate-900 text-sm">{activeToken.doctor_name || 'Dr. S. Ramanathan, MD'}</div>
                <div className="text-slate-500">{activeToken.department_name || 'General Medicine'}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-slate-400 font-medium">Position / Ahead</div>
                <div className="font-mono font-black text-sky-700 text-xl">
                  {activeToken.status === 'consulting' ? '0 (Now)' : `${activeToken.position_in_queue || 5} Patients`}
                </div>
                <div className="text-slate-400">Moving at ~6 mins / patient</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-slate-400 font-medium">Registered At</div>
                <div className="font-bold text-slate-800 text-sm">
                  {new Date(activeToken.registered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-slate-400">Date: {new Date(activeToken.registered_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-3">
            <CheckCircle2 size={36} className="mx-auto text-slate-300" />
            <h3 className="font-bold text-slate-900 text-sm">No Active Token</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {t.noActiveTokens}
            </p>
            <Link
              to="/clinics"
              className="inline-block px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs"
            >
              Browse Hospitals
            </Link>
          </div>
        )}
      </div>

      {/* Past Tokens History */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Clock size={18} className="text-indigo-600" />
              <span>{t.pastTokens}</span>
            </h2>
            <p className="text-xs text-slate-500">
              Audit log of previous appointments and consultation states.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {pastTokens.length} records
          </span>
        </div>

        {pastTokens.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            {t.noPastTokens}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">Token #</th>
                  <th className="py-3 px-3.5">Hospital</th>
                  <th className="py-3 px-3.5">Doctor & Dept</th>
                  <th className="py-3 px-3.5">Date</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pastTokens.map((tok) => (
                  <tr key={tok.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3.5">
                      <TokenBadge tokenNumber={tok.token_number} status={tok.status} size="sm" />
                    </td>
                    <td className="py-3 px-3.5 font-bold text-slate-900">
                      {tok.hospital_name || 'Apollo Hospitals, Greams Road'}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600">
                      <div>{tok.doctor_name || 'Dr. S. Ramanathan'}</div>
                      <div className="text-[10px] text-slate-400">{tok.department_name || 'General Medicine'}</div>
                    </td>
                    <td className="py-3 px-3.5 text-slate-500">
                      {new Date(tok.registered_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          tok.status === 'completed'
                            ? 'bg-slate-100 text-slate-600'
                            : tok.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {tok.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <Link
                        to={`/track?token=${tok.token_number}`}
                        className="text-xs font-semibold text-sky-600 hover:text-sky-800"
                      >
                        View Summary
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Token Cancellation */}
      <Modal
        isOpen={Boolean(cancelTargetToken)}
        title={t.confirmCancelTitle}
        message={
          cancelTargetToken
            ? t.confirmCancelMsg.replace('{token}', cancelTargetToken.token_number)
            : ''
        }
        confirmText="Cancel My Token"
        isDestructive={true}
        onConfirm={handleConfirmCancel}
        onClose={() => setCancelTargetToken(null)}
      />
    </div>
  );
};
