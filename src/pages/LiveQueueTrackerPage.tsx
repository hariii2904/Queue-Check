import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Token, Queue, Doctor, Hospital, Prediction } from '../types';
import { dataService, queueEvents } from '../services/dataService';
import { PredictionEngine } from '../services/predictionEngine';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { QueueProgress } from '../components/queue/QueueProgress';
import { TokenBadge } from '../components/queue/TokenBadge';
import { WaitTimeBadge } from '../components/queue/WaitTimeBadge';
import {
  Activity,
  BellRing,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Clock,
  Stethoscope,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export const LiveQueueTrackerPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { showToast, playAlertSound } = useNotification();

  const tokenParam = searchParams.get('token') || 'A028'; // Default to demo patient A028
  const [tokenInput, setTokenInput] = useState(tokenParam);

  const [tokenData, setTokenData] = useState<{
    token: Token;
    queue: Queue;
    doctor: Doctor;
    hospital: Hospital;
  } | null>(null);

  const [allTokensInQueue, setAllTokensInQueue] = useState<Token[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');
  const [hasAlertedApproaching, setHasAlertedApproaching] = useState(false);

  const loadTokenDetails = async () => {
    if (!tokenParam) {
      setLoading(false);
      return;
    }

    const result = await dataService.getTokenById(tokenParam);
    if (!result) {
      setTokenData(null);
      setLoading(false);
      return;
    }

    setTokenData(result);

    // Fetch all tokens for this doctor's queue
    const queueTokens = await dataService.getTokens(result.queue.id);
    setAllTokensInQueue(queueTokens);

    // Run prediction engine
    const pred = PredictionEngine.estimateWaitingTime({
      queue: result.queue,
      doctor: result.doctor,
      tokensInQueue: queueTokens,
      targetToken: result.token,
    });
    setPrediction(pred);
    setLastCheckTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setLoading(false);

    // Notification checks
    const patientsAhead = pred.factors?.patientsAhead || 0;
    if (patientsAhead <= 2 && patientsAhead > 0 && !hasAlertedApproaching) {
      setHasAlertedApproaching(true);
      showToast(t.alertTurnApproachingDesc, 'alert', t.alertTurnApproaching);
      playAlertSound();
    } else if (patientsAhead === 0 && result.token.status === 'consulting') {
      showToast(t.alertYourTurnNowDesc, 'success', t.alertYourTurnNow);
    }
  };

  useEffect(() => {
    loadTokenDetails();
    const unsub = queueEvents.subscribe(loadTokenDetails);
    return unsub;
  }, [tokenParam]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      setSearchParams({ token: tokenInput.trim().toUpperCase() });
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast(t.copiedLink, 'info', 'Link Copied');
    }
  };

  const clinicName = tokenData
    ? (language === 'ta' && tokenData.hospital.name_ta) ? tokenData.hospital.name_ta : tokenData.hospital.name
    : '';

  const docName = tokenData
    ? (language === 'ta' && tokenData.doctor.name_ta) ? tokenData.doctor.name_ta : tokenData.doctor.name
    : '';

  const patientsAhead = prediction?.factors?.patientsAhead ?? 0;
  const isConsultingNow = tokenData?.token.status === 'consulting';
  const isCompleted = tokenData?.token.status === 'completed';
  const isPaused = tokenData?.queue.queue_status === 'paused';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Token Input bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full mb-1">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span>Real-Time Hospital Queue Tracker</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {t.trackerTitle}
            </h1>
          </div>

          {/* Quick Token Switcher Input */}
          <form onSubmit={handleLookup} className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Token # (e.g. A028)"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                className="pl-8 pr-3 py-2 text-xs uppercase font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl w-36 focus:outline-hidden focus:border-sky-500"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-all"
            >
              {t.trackBtn}
            </button>
          </form>
        </div>

        {/* Sample Token Quick Click Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="font-medium text-slate-400">Quick Demo Tokens:</span>
          {['A028', 'A025', 'B016', 'C012'].map((tok) => (
            <button
              key={tok}
              onClick={() => {
                setTokenInput(tok);
                setSearchParams({ token: tok });
              }}
              className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold transition-all ${
                tokenParam === tok
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tok}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 space-y-2 bg-white rounded-3xl border border-slate-200">
          <Activity size={32} className="mx-auto text-sky-500 animate-spin" />
          <p className="text-sm">{t.loading}</p>
        </div>
      ) : !tokenData ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
          <AlertTriangle size={36} className="mx-auto text-amber-500" />
          <h2 className="text-lg font-bold text-slate-900">Token Not Found</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            We could not find token "{tokenParam}". Please check your token number or register a walk-in token at the clinic.
          </p>
          <button
            onClick={() => {
              setTokenInput('A028');
              setSearchParams({ token: 'A028' });
            }}
            className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs"
          >
            Load Sample Token (A028)
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* URGENT / ALERT BANNER IF APPLICABLE */}
          {isConsultingNow ? (
            <div className="p-4 rounded-2xl bg-emerald-500 text-white shadow-lg flex items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} className="text-emerald-100 shrink-0" />
                <div>
                  <div className="font-extrabold text-sm">{t.alertYourTurnNow}</div>
                  <div className="text-xs text-emerald-100">{t.alertYourTurnNowDesc}</div>
                </div>
              </div>
              <span className="font-mono font-black text-xl bg-white/20 px-3 py-1 rounded-xl">
                {tokenData.token.token_number}
              </span>
            </div>
          ) : isCompleted ? (
            <div className="p-4 rounded-2xl bg-slate-800 text-white shadow-md flex items-center gap-3">
              <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
              <div>
                <div className="font-extrabold text-sm">{t.alertQueueCompleted}</div>
                <div className="text-xs text-slate-300">{t.alertQueueCompletedDesc}</div>
              </div>
            </div>
          ) : isPaused ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm flex items-center gap-3">
              <AlertTriangle size={22} className="text-amber-600 shrink-0" />
              <div>
                <div className="font-extrabold text-sm">{t.alertQueuePaused}</div>
                <div className="text-xs text-amber-700">
                  {tokenData.queue.pause_reason || t.alertQueuePausedDesc}
                </div>
              </div>
            </div>
          ) : patientsAhead <= 2 ? (
            <div className="p-4 rounded-2xl bg-amber-500 text-slate-950 font-bold shadow-md flex items-center gap-3">
              <BellRing size={22} className="text-slate-950 shrink-0 animate-bounce" />
              <div>
                <div className="text-sm font-black">{t.alertTurnApproaching}</div>
                <div className="text-xs font-medium text-slate-900">{t.alertTurnApproachingDesc}</div>
              </div>
            </div>
          ) : null}

          {/* VISUAL QUEUE PROGRESS CARD */}
          <QueueProgress
            currentToken={tokenData.queue.current_token_number || 'A022'}
            patientToken={tokenData.token.token_number}
            patientsAhead={patientsAhead}
          />

          {/* ESTIMATION & CLINIC METRICS CARD */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            {/* Primary Big Metric Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              {/* Token Number */}
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 flex flex-col justify-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t.yourToken}
                </span>
                <span className="text-3xl font-black text-sky-700 font-mono mt-1">
                  {tokenData.token.token_number}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 capitalize">
                  {tokenData.token.patient_name}
                </span>
              </div>

              {/* Patients Ahead */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t.patientsAhead}
                </span>
                <span className="text-3xl font-black text-slate-900 font-mono mt-1">
                  {patientsAhead}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  In line before your token
                </span>
              </div>

              {/* Waiting Time Range */}
              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100 flex flex-col justify-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t.estimatedWaitRange}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-teal-700 font-mono mt-1">
                  {isConsultingNow ? 'NOW' : isCompleted ? 'Done' : `${prediction?.lower_estimate}–${prediction?.upper_estimate} min`}
                </span>
                {/* Confidence indicator */}
                <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-teal-600">
                  <Sparkles size={12} />
                  <span>
                    {prediction?.confidence_level === 'high'
                      ? t.confidenceHigh
                      : prediction?.confidence_level === 'medium'
                      ? t.confidenceMedium
                      : t.confidenceLow}
                  </span>
                </div>
              </div>
            </div>

            {/* Doctor & Clinic Info Row */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold uppercase">{t.doctorName}</div>
                  <div className="text-sm font-bold text-slate-900">{docName}</div>
                  <div className="text-xs text-teal-700 font-medium">
                    {tokenData.doctor.specialty} • {tokenData.doctor.room_number}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold uppercase">Clinic Location</div>
                  <div className="text-sm font-bold text-slate-900">{clinicName}</div>
                  <div className="text-xs text-slate-500">
                    {tokenData.hospital.area}, Chennai
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamp & Share Action */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <RefreshCw size={12} className="text-emerald-500" />
                <span>Last updated at: {lastCheckTime} (Live synced)</span>
              </div>

              <button
                onClick={handleShare}
                className="flex items-center gap-1 text-sky-600 hover:text-sky-800 font-semibold transition-colors cursor-pointer"
              >
                <Share2 size={13} />
                <span>{t.shareTracker}</span>
              </button>
            </div>
          </div>

          {/* Medical Disclaimer Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs space-y-1">
            <div className="font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-slate-400" />
              <span>{t.disclaimerTitle}</span>
            </div>
            <p className="leading-relaxed">
              {t.disclaimerText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
