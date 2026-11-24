import React, { useState, useEffect } from 'react';
import { Hospital, Doctor, Queue, Token } from '../types';
import { dataService, queueEvents } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { Modal } from '../components/common/Modal';
import { TokenBadge } from '../components/queue/TokenBadge';
import {
  Stethoscope,
  Users,
  Play,
  CheckCircle,
  Pause,
  SkipForward,
  UserX,
  PlusCircle,
  Clock,
  Activity,
  AlertCircle,
  Phone,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

export const ReceptionistDashboard: React.FC = () => {
  const { currentUser, switchRole } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useNotification();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(currentUser.hospital_id || 'hosp-1');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [queues, setQueues] = useState<Queue[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  // Walk-in Registration form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCategory, setRegCategory] = useState<'general' | 'followup' | 'emergency' | 'senior'>('general');
  const [isRegistering, setIsRegistering] = useState(false);

  // Confirmation Modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDestructive: false,
  });

  const loadData = async () => {
    const hospList = await dataService.getHospitals();
    setHospitals(hospList);

    const docList = await dataService.getDoctors(selectedHospitalId);
    setDoctors(docList);

    if (docList.length > 0 && (!selectedDoctorId || !docList.some((d) => d.id === selectedDoctorId))) {
      setSelectedDoctorId(docList[0].id);
    }

    const qList = await dataService.getQueues(selectedHospitalId);
    setQueues(qList);

    const tokList = await dataService.getTokens();
    setTokens(tokList);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsub = queueEvents.subscribe(loadData);
    return unsub;
  }, [selectedHospitalId]);

  const activeDoctor = doctors.find((d) => d.id === selectedDoctorId);
  const activeQueue = queues.find((q) => q.doctor_id === selectedDoctorId);
  const doctorTokens = activeQueue
    ? tokens.filter((t) => t.queue_id === activeQueue.id)
    : [];

  const waitingTokens = doctorTokens
    .filter((t) => t.status === 'waiting')
    .sort((a, b) => new Date(a.registered_at).getTime() - new Date(b.registered_at).getTime());

  const consultingToken = doctorTokens.find((t) => t.status === 'consulting');
  const completedTokens = doctorTokens.filter((t) => t.status === 'completed');
  const isPaused = activeQueue?.queue_status === 'paused';

  // Actions
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQueue) {
      showToast('No active queue configured for this doctor today.', 'warning');
      return;
    }

    setIsRegistering(true);
    try {
      const newToken = await dataService.registerWalkInToken(
        activeQueue.id,
        regName.trim() || 'Walk-in Patient',
        regPhone.trim(),
        regCategory
      );

      showToast(
        `${t.tokenGeneratedSuccess}: ${newToken.token_number}`,
        'success',
        'Token Assigned'
      );
      setRegName('');
      setRegPhone('');
    } catch {
      showToast('Error registering patient.', 'alert');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCallNext = async () => {
    if (!activeQueue) return;
    const nextToken = await dataService.callNextToken(activeQueue.id);
    if (nextToken) {
      showToast(`Calling Token ${nextToken.token_number} - ${nextToken.patient_name}`, 'info', 'Next Token Called');
    } else {
      showToast('No waiting patients in queue.', 'warning');
    }
  };

  const handleComplete = async (tokenId: string) => {
    await dataService.completeConsultation(tokenId);
    showToast('Consultation marked completed.', 'success');
  };

  const confirmSkip = (token: Token) => {
    setModalConfig({
      isOpen: true,
      title: 'Confirm Skip Token',
      message: `Are you sure you want to skip Token ${token.token_number} (${token.patient_name})? This token will be removed from the active line.`,
      isDestructive: true,
      onConfirm: async () => {
        await dataService.skipToken(token.id);
        showToast(`Token ${token.token_number} skipped.`, 'info');
      },
    });
  };

  const confirmNoShow = (token: Token) => {
    setModalConfig({
      isOpen: true,
      title: 'Mark as No-Show',
      message: `Mark Token ${token.token_number} (${token.patient_name}) as No-Show? The patient did not respond to multiple calls.`,
      isDestructive: true,
      onConfirm: async () => {
        await dataService.markNoShow(token.id);
        showToast(`Token ${token.token_number} marked as No-Show.`, 'warning');
      },
    });
  };

  const confirmTogglePause = () => {
    if (!activeQueue) return;
    if (isPaused) {
      dataService.resumeQueue(activeQueue.id);
      showToast('Queue resumed. Patients notified.', 'success');
    } else {
      setModalConfig({
        isOpen: true,
        title: 'Pause Queue',
        message: `Pause the queue for ${activeDoctor?.name}? Patients tracking this queue will receive an alert that the doctor is on a short break.`,
        isDestructive: false,
        onConfirm: async () => {
          await dataService.pauseQueue(activeQueue.id, 'Doctor attending emergency case / Short break');
          showToast('Queue paused. Waiting patients alerted.', 'warning');
        },
      });
    }
  };

  const currentHospital = hospitals.find((h) => h.id === selectedHospitalId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Dashboard Top Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full">
            <ShieldCheck size={14} className="text-teal-600" />
            <span>Staff Portal • Role-Based Access Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t.receptionistTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {currentHospital?.name} ({currentHospital?.area}, Chennai) • Logged in as: <strong>{currentUser.full_name}</strong>
          </p>
        </div>

        {/* Hospital Switcher for Multi-Clinic Demo */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Clinic:</label>
          <select
            value={selectedHospitalId}
            onChange={(e) => {
              setSelectedHospitalId(e.target.value);
              switchRole('receptionist', e.target.value);
            }}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden"
          >
            <optgroup label="--- Authorized Partner Pilot Desks (Live Queues) ---">
              {hospitals
                .filter((h) => h.is_partner_queue)
                .map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.area}) [Pilot Desk]
                  </option>
                ))}
            </optgroup>
            <optgroup label="--- Public Directory Facilities (Queue Disabled) ---">
              {hospitals
                .filter((h) => !h.is_partner_queue)
                .map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.area}) [Public Listing]
                  </option>
                ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Safeguard Banner if an Unpartnered Hospital is Selected */}
      {currentHospital && !currentHospital.is_partner_queue && (
        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={22} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-bold text-sm text-amber-900">
                Public Healthcare Facility — Live Queue Desk Not Activated
              </div>
              <p className="text-amber-800 leading-relaxed">
                <strong>{currentHospital.name}</strong> is currently listed as a verified public healthcare facility.
                QueueCheck zero-fabrication policy strictly prohibits simulating fake patient tokens for unpartnered public hospitals.
                Patients viewing this facility see: <em>&ldquo;Live queue information is currently unavailable.&rdquo;</em>
              </p>
              <p className="text-amber-700">
                To test live token registration and queue dispatching, switch to an active pilot desk below or authorize this facility in the Platform Admin dashboard.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                const partner = hospitals.find((h) => h.is_partner_queue);
                if (partner) {
                  setSelectedHospitalId(partner.id);
                  switchRole('receptionist', partner.id);
                }
              }}
              className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Switch to Partner Desk
            </button>
          </div>
        </div>
      )}

      {/* Doctor Queue Selection Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Stethoscope size={16} className="text-sky-600" />
          <span>{t.selectDoctorQueue}:</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {doctors.map((doc) => {
            const isSelected = doc.id === selectedDoctorId;
            return (
              <button
                key={doc.id}
                onClick={() => setSelectedDoctorId(doc.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {doc.name} ({doc.specialty})
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Metric Summary Cards + Pause Toggle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Waiting Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">{t.waitingCount}</div>
          <div className="text-3xl font-black text-sky-700 font-mono">
            {waitingTokens.length}
          </div>
          <div className="text-[11px] text-slate-400">Patients in line</div>
        </div>

        {/* Consulting Now */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">{t.consultingNow}</div>
          <div className="text-3xl font-black text-emerald-700 font-mono">
            {consultingToken?.token_number || 'None'}
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {consultingToken ? consultingToken.patient_name : 'Room available'}
          </div>
        </div>

        {/* Completed Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">{t.completedCount}</div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {completedTokens.length}
          </div>
          <div className="text-[11px] text-slate-400">Finished consultations</div>
        </div>

        {/* Queue Control Buttons */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <button
            onClick={handleCallNext}
            disabled={waitingTokens.length === 0}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Play size={14} className="fill-white" />
            <span>{t.btnCallNext}</span>
          </button>

          <button
            onClick={confirmTogglePause}
            className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isPaused
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Pause size={13} />
            <span>{isPaused ? t.btnResumeQueue : t.btnPauseQueue}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Registration Form (Left) & Active Queue Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Register Walk-in Patient Form */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5 h-fit">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <PlusCircle size={18} className="text-teal-600" />
              <span>{t.registerPatient}</span>
            </h2>
            <p className="text-xs text-slate-500">
              Generate an immediate sequential token for a walk-in patient.
            </p>
          </div>

          <form onSubmit={handleRegisterPatient} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.patientDisplayName} *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. S. Lakshmi or K. Sundaram"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.patientPhone}
              </label>
              <input
                type="tel"
                placeholder="+91 98400 12345"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.consultationCategory}
              </label>
              <select
                value={regCategory}
                onChange={(e) => setRegCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-hidden focus:border-sky-500"
              >
                <option value="general">{t.catGeneral}</option>
                <option value="followup">{t.catFollowup}</option>
                <option value="emergency">{t.catEmergency}</option>
                <option value="senior">{t.catSenior}</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
              <div>Assigned Doctor: <strong>{activeDoctor?.name}</strong></div>
              <div>Estimated Token: <strong>{waitingTokens.length + 1} patients ahead</strong></div>
            </div>

            <button
              type="submit"
              disabled={isRegistering || !activeQueue}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isRegistering ? t.loading : t.generateTokenBtn}
            </button>
          </form>
        </div>

        {/* Right Column: Active Queue Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Live Queue – {activeDoctor?.name}
              </h2>
              <p className="text-xs text-slate-500">
                Manage token status, consultations, and queue advancement.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">
              Total {doctorTokens.length} tokens today
            </span>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">{t.colToken}</th>
                  <th className="py-3 px-3.5">{t.colPatient}</th>
                  <th className="py-3 px-3.5">{t.colCategory}</th>
                  <th className="py-3 px-3.5">{t.colStatus}</th>
                  <th className="py-3 px-3.5 text-right">{t.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctorTokens.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No tokens issued for this doctor today. Register a patient above!
                    </td>
                  </tr>
                ) : (
                  doctorTokens.map((token) => (
                    <tr
                      key={token.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        token.status === 'consulting'
                          ? 'bg-emerald-50/40 font-semibold'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-3.5">
                        <TokenBadge tokenNumber={token.token_number} status={token.status} size="sm" />
                      </td>
                      <td className="py-3 px-3.5 text-slate-800">
                        <div>{token.patient_name}</div>
                        {token.patient_phone && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {token.patient_phone}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="capitalize text-slate-600">{token.category}</span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            token.status === 'consulting'
                              ? 'bg-emerald-100 text-emerald-800'
                              : token.status === 'waiting'
                              ? 'bg-sky-100 text-sky-800'
                              : token.status === 'completed'
                              ? 'bg-slate-100 text-slate-500'
                              : token.status === 'skipped'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {token.status}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {token.status === 'consulting' && (
                          <button
                            onClick={() => handleComplete(token.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-colors cursor-pointer"
                          >
                            {t.btnComplete}
                          </button>
                        )}

                        {token.status === 'waiting' && (
                          <>
                            <button
                              onClick={() => confirmSkip(token)}
                              title="Skip Token"
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              {t.btnSkip}
                            </button>
                            <button
                              onClick={() => confirmNoShow(token)}
                              title="Mark No-Show"
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-800 text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              {t.btnNoShow}
                            </button>
                          </>
                        )}

                        {token.status === 'completed' && (
                          <span className="text-[11px] text-slate-400 font-medium">Done</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        isDestructive={modalConfig.isDestructive}
      />
    </div>
  );
};
