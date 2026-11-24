import React, { useState, useEffect } from 'react';
import { Hospital, Doctor, Queue, Token, HospitalSource, QueueEvent, VerificationStatus } from '../types';
import { dataService, queueEvents } from '../services/dataService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import {
  Shield,
  Building2,
  Stethoscope,
  Activity,
  Users,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Clock,
  Database,
  BarChart3,
  Server,
  Layers,
  MapPin,
  RefreshCw,
  Globe,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { showToast } = useNotification();
  const supabaseActive = isSupabaseConfigured();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [sources, setSources] = useState<HospitalSource[]>([]);
  const [queueEventsList, setQueueEventsList] = useState<QueueEvent[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [activeTab, setActiveTab] = useState<'clinics' | 'queues' | 'sources' | 'analytics'>('clinics');
  const [isSyncingOsm, setIsSyncingOsm] = useState(false);

  // Add Clinic modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHospName, setNewHospName] = useState('');
  const [newHospArea, setNewHospArea] = useState('Anna Nagar');
  const [newHospAddress, setNewHospAddress] = useState('');
  const [newHospPhone, setNewHospPhone] = useState('+91 44 ');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAllData = async () => {
    const [hList, sList, eList, dList, qList, tList] = await Promise.all([
      dataService.getHospitals(),
      dataService.getHospitalSources(),
      dataService.getQueueEvents(),
      dataService.getDoctors(),
      dataService.getQueues(),
      dataService.getTokens(),
    ]);
    setHospitals(hList);
    setSources(sList);
    setQueueEventsList(eList);
    setDoctors(dList);
    setQueues(qList);
    setTokens(tList);
  };

  useEffect(() => {
    loadAllData();
    const unsub = queueEvents.subscribe(loadAllData);
    return unsub;
  }, []);

  const handleToggleStatus = async (hospitalId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await dataService.updateHospitalStatus(hospitalId, nextStatus);
    showToast(
      `Hospital status updated to ${nextStatus.toUpperCase()}`,
      nextStatus === 'active' ? 'success' : 'warning',
      'Status Changed'
    );
  };

  const handleTogglePartner = async (hospitalId: string, currentIsPartner: boolean) => {
    await dataService.updateHospital(hospitalId, { is_partner_queue: !currentIsPartner });
    showToast(
      `Partner Live Queue ${!currentIsPartner ? 'ENABLED' : 'DISABLED'} for this hospital.`,
      !currentIsPartner ? 'success' : 'warning',
      'Queue Desk Status'
    );
  };

  const handleToggleVerification = async (hospitalId: string, currentStatus: VerificationStatus) => {
    const nextStatus: VerificationStatus = currentStatus === 'verified' ? 'unverified' : 'verified';
    await dataService.updateHospital(hospitalId, {
      verification_status: nextStatus,
      last_verified: new Date().toISOString(),
    });
    showToast(
      `Listing verification status set to ${nextStatus.toUpperCase()}`,
      nextStatus === 'verified' ? 'success' : 'info',
      'Verification Updated'
    );
  };

  const handleAdminSyncOsm = async () => {
    setIsSyncingOsm(true);
    showToast('Querying OpenStreetMap Overpass API for Chennai health facilities...', 'info');
    try {
      const count = await dataService.fetchAndMergeOsmHospitals();
      if (count > 0) {
        showToast(`Imported ${count} new facilities from OpenStreetMap!`, 'success', 'OSM Sync');
      } else {
        showToast('All OpenStreetMap Chennai facilities are already synchronized.', 'info');
      }
      loadAllData();
    } catch {
      showToast('Could not reach OpenStreetMap Overpass server. Local registry retained.', 'warning');
    } finally {
      setIsSyncingOsm(false);
    }
  };

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHospName.trim()) return;

    setIsSubmitting(true);
    try {
      await dataService.addHospital({
        name: newHospName.trim(),
        area: newHospArea,
        address: newHospAddress.trim() || `${newHospArea}, Chennai, Tamil Nadu`,
        phone: newHospPhone.trim() || '+91 44 2600 0000',
        latitude: 13.0850,
        longitude: 80.2100,
      });

      showToast(`Clinic "${newHospName}" added successfully!`, 'success', 'Clinic Created');
      setShowAddModal(false);
      setNewHospName('');
      setNewHospAddress('');
    } catch {
      showToast('Failed to add clinic', 'alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics
  const totalClinics = hospitals.length;
  const activeClinics = hospitals.filter((h) => h.status === 'active').length;
  const totalDoctors = doctors.length;
  const activeQueuesCount = queues.filter((q) => q.queue_status === 'active').length;
  const totalTokens = tokens.length;
  const completedTokensCount = tokens.filter((t) => t.status === 'completed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
            <Shield size={14} className="text-indigo-600" />
            <span>Platform Governance & Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t.adminTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {t.adminSubtitle}
          </p>
        </div>

        {/* System Health Pill */}
        <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <Server size={16} className={supabaseActive ? 'text-emerald-500' : 'text-sky-500'} />
          <div>
            <div className="font-bold text-slate-800">
              {supabaseActive ? 'Supabase Realtime: CONNECTED' : 'Demo Reactive Store: ACTIVE'}
            </div>
            <div className="text-[11px] text-slate-400">
              Cross-tab real-time event bus listening
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.statTotalClinics}</div>
          <div className="text-2xl font-black text-slate-900 font-mono">{totalClinics}</div>
          <div className="text-[10px] text-slate-400">Chennai facilities</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.statActiveClinics}</div>
          <div className="text-2xl font-black text-emerald-600 font-mono">{activeClinics}</div>
          <div className="text-[10px] text-emerald-600 font-medium">Accepting walk-ins</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.statTotalDoctors}</div>
          <div className="text-2xl font-black text-slate-900 font-mono">{totalDoctors}</div>
          <div className="text-[10px] text-slate-400">Practicing physicians</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.statActiveQueues}</div>
          <div className="text-2xl font-black text-teal-600 font-mono">{activeQueuesCount}</div>
          <div className="text-[10px] text-teal-600 font-medium">Live lines moving</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.statTokensToday}</div>
          <div className="text-2xl font-black text-sky-600 font-mono">{totalTokens}</div>
          <div className="text-[10px] text-sky-600 font-medium">{completedTokensCount} completed</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Avg Wait Time</div>
          <div className="text-2xl font-black text-indigo-600 font-mono">~22m</div>
          <div className="text-[10px] text-slate-400">Chennai citywide</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold pb-2">
        <button
          onClick={() => setActiveTab('clinics')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'clinics'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 size={14} />
          <span>{t.tabClinics}</span>
        </button>

        <button
          onClick={() => setActiveTab('queues')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'queues'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity size={14} />
          <span>{t.tabQueues}</span>
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'sources'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database size={14} />
          <span>Data Sources & Audit Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 size={14} />
          <span>{t.tabAnalytics}</span>
        </button>
      </div>

      {/* Tab 1: Clinics Management */}
      {activeTab === 'clinics' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Healthcare Centers Directory
              </h2>
              <p className="text-xs text-slate-500">
                Manage registered hospital accounts, approvals, and operational state.
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle size={14} />
              <span>{t.addNewClinic}</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">{t.clinicName}</th>
                  <th className="py-3 px-3.5">{t.clinicArea}</th>
                  <th className="py-3 px-3.5">{t.clinicPhone}</th>
                  <th className="py-3 px-3.5">{t.clinicHours}</th>
                  <th className="py-3 px-3.5">{t.clinicStatus}</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hospitals.map((hosp) => (
                  <tr key={hosp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3.5 font-bold text-slate-900">
                      {hosp.name}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600">
                      {hosp.area}, Chennai
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-600">
                      {hosp.phone}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600">
                      {hosp.opening_time} – {hosp.closing_time}
                    </td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          hosp.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {hosp.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => handleToggleStatus(hosp.id, hosp.status)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          hosp.status === 'active'
                            ? 'bg-slate-100 text-rose-700 hover:bg-rose-50'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {hosp.status === 'active' ? t.actionDeactivate : t.actionActivate}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Live Queues Monitor */}
      {activeTab === 'queues' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Citywide Queues Real-Time Feed
            </h2>
            <p className="text-xs text-slate-500">
              Live status across all doctor rooms in Chennai.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queues.map((q) => {
              const doc = doctors.find((d) => d.id === q.doctor_id);
              const hosp = hospitals.find((h) => h.id === q.hospital_id);
              const qTokens = tokens.filter((t) => t.queue_id === q.id);
              const waiting = qTokens.filter((t) => t.status === 'waiting');
              const isPaused = q.queue_status === 'paused';

              return (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-extrabold text-sm text-slate-900">{doc?.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {hosp?.name} ({hosp?.area})
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isPaused
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {q.queue_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 bg-white rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-400">Serving</div>
                      <div className="font-mono font-black text-emerald-700 text-sm">
                        {q.current_token_number || 'None'}
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-400">Waiting</div>
                      <div className="font-mono font-black text-slate-900 text-sm">
                        {waiting.length}
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>{doc?.specialty}</span>
                    <span>Updated: {new Date(q.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Usage Analytics (Backed by Actual Database Records) */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tokens per Hospital Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BarChart3 size={16} className="text-indigo-600" />
                <span>Tokens Issued per Clinic (Actual Records)</span>
              </h3>
              <div className="space-y-3 pt-2">
                {hospitals.map((hosp) => {
                  const hospQueues = queues.filter((q) => q.hospital_id === hosp.id);
                  const queueIds = new Set(hospQueues.map((q) => q.id));
                  const count = tokens.filter((t) => queueIds.has(t.queue_id)).length;
                  const pct = Math.min(100, Math.round((count / Math.max(1, tokens.length)) * 100));

                  return (
                    <div key={hosp.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700">{hosp.name}</span>
                        <span className="font-mono font-bold text-slate-900">{count} tokens ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Token Status Breakdown */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers size={16} className="text-teal-600" />
                <span>Token Lifecycle Breakdown</span>
              </h3>
              <div className="space-y-3 pt-2">
                {[
                  { label: 'Completed Consultations', status: 'completed', color: 'bg-emerald-500' },
                  { label: 'Waiting in Queue', status: 'waiting', color: 'bg-sky-500' },
                  { label: 'Currently in Consultation', status: 'consulting', color: 'bg-teal-500' },
                  { label: 'Skipped / Postponed', status: 'skipped', color: 'bg-amber-500' },
                  { label: 'Marked No-Show', status: 'no_show', color: 'bg-rose-500' },
                ].map((item) => {
                  const count = tokens.filter((t) => t.status === item.status).length;
                  const pct = Math.min(100, Math.round((count / Math.max(1, tokens.length)) * 100));

                  return (
                    <div key={item.status} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700">{item.label}</span>
                        <span className="font-mono font-bold text-slate-900">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Data Sources & Audit Logs */}
      {activeTab === 'sources' && (
        <div className="space-y-6">
          {/* Section 1: Hospital Information Sources & Verification */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Database size={18} className="text-indigo-600" />
                  <span>Hospital Information Sources & Verification Matrix</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Audit publicly accessible healthcare sources, verify registry links, and govern authorized live queue desks.
                </p>
              </div>

              <button
                onClick={handleAdminSyncOsm}
                disabled={isSyncingOsm}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
              >
                <RefreshCw size={14} className={isSyncingOsm ? 'animate-spin' : ''} />
                <span>{isSyncingOsm ? 'Querying Overpass API...' : 'Sync OpenStreetMap API'}</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3.5">Healthcare Facility</th>
                    <th className="py-3 px-3.5">Information Source & License</th>
                    <th className="py-3 px-3.5">Verification Status</th>
                    <th className="py-3 px-3.5">Queue Authorization</th>
                    <th className="py-3 px-3.5 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hospitals.map((hosp) => {
                    const hospSource = sources.find((s) => s.hospital_id === hosp.id);
                    const isPartner = hosp.is_partner_queue;
                    const isVerified = hosp.verification_status === 'verified';

                    return (
                      <tr key={hosp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900">{hosp.name}</div>
                          <div className="text-[11px] text-slate-500">{hosp.area}, Chennai</div>
                        </td>

                        <td className="py-3 px-3.5 max-w-xs">
                          <div className="font-medium text-slate-800">
                            {hosp.data_source || hospSource?.source_name || 'Public Registry'}
                          </div>
                          {hosp.website && (
                            <a
                              href={hosp.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-sky-600 hover:underline flex items-center gap-1 mt-0.5 truncate"
                            >
                              <ExternalLink size={11} />
                              <span className="truncate">{hosp.website}</span>
                            </a>
                          )}
                        </td>

                        <td className="py-3 px-3.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase inline-flex items-center gap-1 ${
                              isVerified
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isVerified ? <ShieldCheck size={11} /> : <AlertCircle size={11} />}
                            <span>{hosp.verification_status}</span>
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {hosp.last_verified ? new Date(hosp.last_verified).toLocaleDateString() : 'Audited'}
                          </div>
                        </td>

                        <td className="py-3 px-3.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                              isPartner
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isPartner ? 'bg-teal-500 animate-pulse' : 'bg-slate-400'
                              }`}
                            />
                            <span>{isPartner ? 'Live Partner Desk' : 'Public Directory Only'}</span>
                          </span>
                        </td>

                        <td className="py-3 px-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => handleTogglePartner(hosp.id, isPartner)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isPartner
                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                : 'bg-teal-600 text-white hover:bg-teal-700'
                            }`}
                          >
                            {isPartner ? 'Revoke Partner' : 'Authorize Partner'}
                          </button>

                          <button
                            onClick={() => handleToggleVerification(hosp.id, hosp.verification_status)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isVerified
                                ? 'bg-slate-100 text-amber-700 hover:bg-amber-50'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {isVerified ? 'Unverify' : 'Verify'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Real-Time Queue Event Audit Log */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Activity size={16} className="text-sky-600" />
                  <span>Real-Time Queue Event Audit Trail</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Immutable event stream tracking registrations, calls, consultations, cancellations, pauses, and no-shows.
                </p>
              </div>

              <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                {queueEventsList.length} events logged
              </span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {queueEventsList.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No queue events recorded yet today.
                </div>
              ) : (
                queueEventsList.map((evt) => {
                  const badgeColorMap: Record<string, string> = {
                    registered: 'bg-sky-100 text-sky-800 border-sky-200',
                    called: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    completed: 'bg-teal-100 text-teal-800 border-teal-200',
                    cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
                    skipped: 'bg-amber-100 text-amber-800 border-amber-200',
                    no_show: 'bg-rose-100 text-rose-800 border-rose-200',
                    paused: 'bg-purple-100 text-purple-800 border-purple-200',
                    resumed: 'bg-blue-100 text-blue-800 border-blue-200',
                  };

                  const colorClass = badgeColorMap[evt.event_type] || 'bg-slate-100 text-slate-800 border-slate-200';

                  return (
                    <div
                      key={evt.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/40 flex items-start sm:items-center justify-between gap-3 text-xs hover:bg-white transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${colorClass} shrink-0`}
                        >
                          {evt.event_type}
                        </span>
                        <div>
                          <span className="font-semibold text-slate-900">{evt.notes || 'Queue mutation'}</span>
                          <span className="text-slate-400 text-[11px] ml-2 font-mono">
                            Queue: {evt.queue_id}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] font-mono text-slate-400 shrink-0">
                        {new Date(evt.event_timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Clinic Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-1">{t.addNewClinic}</h3>
            <p className="text-xs text-slate-500 mb-4">
              Register a new hospital or outpatient center into the Chennai network.
            </p>

            <form onSubmit={handleCreateHospital} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinic Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Billroth Hospitals (Shenoy Nagar)"
                  value={newHospName}
                  onChange={(e) => setNewHospName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Area / Locality *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anna Nagar, Shenoy Nagar, Tambaram"
                  value={newHospArea}
                  onChange={(e) => setNewHospArea(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  placeholder="Street & Pin Code"
                  value={newHospAddress}
                  onChange={(e) => setNewHospAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  placeholder="+91 44 2600 0000"
                  value={newHospPhone}
                  onChange={(e) => setNewHospPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t.btnCancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
                >
                  {isSubmitting ? t.loading : 'Create Clinic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
