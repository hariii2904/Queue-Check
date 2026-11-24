import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Hospital, Doctor, Queue, Token, Department, HospitalSource } from '../types';
import { dataService, queueEvents } from '../services/dataService';
import { PredictionEngine } from '../services/predictionEngine';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { TokenBadge } from '../components/queue/TokenBadge';
import { WaitTimeBadge } from '../components/queue/WaitTimeBadge';
import {
  MapPin,
  Phone,
  Clock,
  Stethoscope,
  Users,
  Activity,
  ArrowLeft,
  ChevronRight,
  PlusCircle,
  PauseCircle,
  Building2,
  Globe,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Send,
  CheckCircle,
} from 'lucide-react';

export const ClinicDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { showToast } = useNotification();

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [sources, setSources] = useState<HospitalSource[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  // Walk-in modal state
  const [activeModalQueueId, setActiveModalQueueId] = useState<string | null>(null);
  const [patientNameInput, setPatientNameInput] = useState('');
  const [patientPhoneInput, setPatientPhoneInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<'general' | 'followup' | 'emergency' | 'senior'>('general');
  const [isSubmittingToken, setIsSubmittingToken] = useState(false);
  const [requestedIntegration, setRequestedIntegration] = useState(false);

  const loadData = async () => {
    if (!id) return;
    const hosp = await dataService.getHospitalById(id);
    if (!hosp) {
      setLoading(false);
      return;
    }
    setHospital(hosp);

    const [srcList, deptList, docList, qList, tokList] = await Promise.all([
      dataService.getHospitalSources(hosp.id),
      dataService.getDepartments(hosp.id),
      dataService.getDoctors(hosp.id),
      dataService.getQueues(hosp.id),
      dataService.getTokens(),
    ]);

    setSources(srcList);
    setDepartments(deptList);
    setDoctors(docList);
    setQueues(qList);
    setTokens(tokList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsub = queueEvents.subscribe(loadData);
    return unsub;
  }, [id]);

  const handleRegisterToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalQueueId) return;

    setIsSubmittingToken(true);
    try {
      const newToken = await dataService.registerWalkInToken(
        activeModalQueueId,
        patientNameInput.trim() || 'Guest Patient',
        patientPhoneInput.trim(),
        categoryInput
      );

      showToast(
        `Token ${newToken.token_number} generated successfully!`,
        'success',
        'Token Issued'
      );

      setActiveModalQueueId(null);
      setPatientNameInput('');
      setPatientPhoneInput('');
      navigate(`/track?token=${newToken.token_number}`);
    } catch {
      showToast('Failed to generate token. Please try again.', 'alert', 'Error');
    } finally {
      setIsSubmittingToken(false);
    }
  };

  const handleRequestIntegration = () => {
    setRequestedIntegration(true);
    showToast(t.requestSentSuccess, 'success', 'Request Recorded');
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 space-y-2">
        <Activity size={32} className="mx-auto text-sky-500 animate-spin" />
        <p className="text-sm">{t.loading}</p>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Hospital not found</h2>
        <Link to="/clinics" className="text-sky-600 font-semibold hover:underline">
          Return to Hospital Directory
        </Link>
      </div>
    );
  }

  const clinicName = (language === 'ta' && hospital.name_ta) ? hospital.name_ta : hospital.name;
  const clinicAddress = (language === 'ta' && hospital.address_ta) ? hospital.address_ta : hospital.address;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Navigation */}
      <div>
        <Link
          to="/clinics"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Hospital Directory</span>
        </Link>
      </div>

      {/* Hospital Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                  hospital.is_partner_queue
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {hospital.is_partner_queue ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{t.partnerBadge}</span>
                  </>
                ) : (
                  <>
                    <Building2 size={11} />
                    <span>{t.publicDirectoryBadge}</span>
                  </>
                )}
              </span>

              <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                {hospital.area}, Chennai
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {clinicName}
            </h1>

            <p className="text-sm text-slate-600 flex items-start gap-1.5">
              <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <span>{clinicAddress}</span>
            </p>
          </div>

          {/* Contact Details & External Links */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <Phone size={14} className="text-teal-600 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">{t.contactNumber}</div>
                <div className="font-bold text-slate-800 font-mono">{hospital.phone}</div>
              </div>
            </div>

            {hospital.emergency_phone && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                <Phone size={14} className="text-rose-600 shrink-0" />
                <div>
                  <div className="text-[10px] text-rose-500 uppercase font-semibold">{t.emergencyNumber}</div>
                  <div className="font-bold text-rose-900 font-mono">{hospital.emergency_phone}</div>
                </div>
              </div>
            )}

            {hospital.website && (
              <a
                href={hospital.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 text-xs text-sky-700 font-bold transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-sky-600" />
                  <span>{t.websiteLabel}</span>
                </div>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>

        {/* Operating Hours & Data Source Transparency Banner */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Clock size={15} className="text-slate-400 shrink-0" />
            <span>
              <strong>{t.operatingHours}:</strong> {hospital.opening_time}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck size={15} className="text-teal-600 shrink-0" />
            <span className="truncate">
              <strong>{t.dataSourceLabel}:</strong> {hospital.data_source}
            </span>
          </div>
        </div>
      </div>

      {/* Verified Departments & Clinical Services */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Stethoscope size={18} className="text-teal-600" />
          <span>{t.departmentsTitle}</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {(hospital.departments || ['General Medicine', 'Emergency Services']).map((dept, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-800"
            >
              {dept}
            </div>
          ))}
        </div>
      </div>

      {/* Queue Status Section */}
      {hospital.is_partner_queue ? (
        /* Connected Partner Doctor Queues */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Activity size={20} className="text-emerald-600" />
                <span>{t.doctorQueues}</span>
              </h2>
              <p className="text-xs text-slate-500">
                Live lines updated in real-time by authorized reception staff at this hospital.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {doctors.length} Doctors on duty
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {doctors.map((doctor) => {
              const queue = queues.find((q) => q.doctor_id === doctor.id);
              const docTokens = queue ? tokens.filter((t) => t.queue_id === queue.id) : [];
              const waitingTokens = docTokens.filter((t) => t.status === 'waiting');
              const consultingToken = docTokens.find((t) => t.status === 'consulting');
              const isPaused = queue?.queue_status === 'paused';

              const walkInEst = queue
                ? PredictionEngine.estimateForNewWalkIn(queue, doctor, docTokens)
                : { rangeText: '10–15 mins', minutes: 12, lower: 10, upper: 15, patientsAhead: 0 };

              const docName = (language === 'ta' && doctor.name_ta) ? doctor.name_ta : doctor.name;
              const docSpecialty = (language === 'ta' && doctor.specialty_ta) ? doctor.specialty_ta : doctor.specialty;

              return (
                <div
                  key={doctor.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:border-sky-300 transition-all p-6 flex flex-col justify-between space-y-5"
                >
                  <div>
                    {/* Doctor Top Row */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                          <Stethoscope size={22} />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-base">{docName}</h3>
                          <div className="text-xs font-semibold text-teal-700">
                            {docSpecialty} • {doctor.room_number}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isPaused
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isPaused ? t.statusPaused : t.statusActive}
                      </span>
                    </div>

                    {/* Paused alert if applicable */}
                    {isPaused && (
                      <div className="mb-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                        <PauseCircle size={15} className="text-amber-600 shrink-0" />
                        <span>{queue?.pause_reason || 'Doctor is on a short break.'}</span>
                      </div>
                    )}

                    {/* Queue Metrics */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 text-center mb-4">
                      <div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {t.currentlyServing}
                        </div>
                        <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">
                          {consultingToken?.token_number || queue?.current_token_number || 'None'}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {t.waitingCount}
                        </div>
                        <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                          {waitingTokens.length}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {t.estimatedWait}
                        </div>
                        <div className="text-sm font-bold text-sky-700 font-mono mt-1">
                          {walkInEst.rangeText}
                        </div>
                      </div>
                    </div>

                    {/* Next in line tokens */}
                    {waitingTokens.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Next Up In Line:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {waitingTokens.slice(0, 5).map((tok) => (
                            <Link
                              key={tok.id}
                              to={`/track?token=${tok.token_number}`}
                              title={`Click to track token ${tok.token_number}`}
                            >
                              <TokenBadge tokenNumber={tok.token_number} status="waiting" size="sm" />
                            </Link>
                          ))}
                          {waitingTokens.length > 5 && (
                            <span className="text-xs text-slate-400 self-center font-mono">
                              +{waitingTokens.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    {queue ? (
                      <>
                        <button
                          onClick={() => {
                            const demoToken = waitingTokens[0]?.token_number || consultingToken?.token_number || 'A028';
                            navigate(`/track?token=${demoToken}`);
                          }}
                          className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
                        >
                          <span>{t.trackThisQueue}</span>
                          <ChevronRight size={14} />
                        </button>

                        <button
                          onClick={() => setActiveModalQueueId(queue.id)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                        >
                          <PlusCircle size={14} />
                          <span>{t.getWalkInToken}</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-xs text-slate-400 italic">
                        {t.queueNotStarted}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Transparent Unavailable Notice for Public Directory Hospitals */
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Clock size={24} />
          </div>

          <div className="space-y-1.5 max-w-lg mx-auto">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              {t.statusUnavailable}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t.queueUnavailableNotice}
            </p>
          </div>

          <div className="pt-3">
            <button
              onClick={handleRequestIntegration}
              disabled={requestedIntegration}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                requestedIntegration
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
              }`}
            >
              {requestedIntegration ? (
                <>
                  <CheckCircle size={14} />
                  <span>Integration Request Recorded</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>{t.requestQueueIntegration}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Walk-in Registration Modal */}
      {activeModalQueueId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {t.registerPatient}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Get an instant digital token. No registration fee or patient portal login required.
            </p>

            <form onSubmit={handleRegisterToken} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.patientDisplayName} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S. Lakshmi or K. Sundaram"
                  value={patientNameInput}
                  onChange={(e) => setPatientNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.patientPhone}
                </label>
                <input
                  type="tel"
                  placeholder="+91 98400 XXXXX"
                  value={patientPhoneInput}
                  onChange={(e) => setPatientPhoneInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.consultationCategory}
                </label>
                <select
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-hidden focus:border-sky-500"
                >
                  <option value="general">{t.catGeneral}</option>
                  <option value="followup">{t.catFollowup}</option>
                  <option value="emergency">{t.catEmergency}</option>
                  <option value="senior">{t.catSenior}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModalQueueId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t.btnCancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingToken}
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-all"
                >
                  {isSubmittingToken ? t.loading : t.generateTokenBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
