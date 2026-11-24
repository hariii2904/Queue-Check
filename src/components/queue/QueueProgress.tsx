import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { CheckCircle2, User, Stethoscope } from 'lucide-react';

interface QueueProgressProps {
  currentToken: string;
  patientToken: string;
  patientsAhead: number;
  totalInQueue?: number;
}

export const QueueProgress: React.FC<QueueProgressProps> = ({
  currentToken,
  patientToken,
  patientsAhead,
  totalInQueue = 10,
}) => {
  const { t } = useLanguage();

  // Calculate progress percentage: 0 ahead is 100%, 10 ahead is ~10%
  const clampedAhead = Math.max(0, patientsAhead);
  const total = Math.max(clampedAhead + 1, totalInQueue);
  const completedCount = total - clampedAhead;
  const progressPercent = Math.min(100, Math.max(10, Math.round((completedCount / total) * 100)));

  return (
    <div className="w-full bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
      {/* Header labels */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <span>{t.currentlyServing}</span>
        <span>{t.yourToken}</span>
      </div>

      {/* Main Tokens Display */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Stethoscope size={20} />
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-emerald-700 tracking-tight">
              {currentToken || '—'}
            </div>
            <div className="text-[11px] font-medium text-emerald-600">
              Inside Consultation
            </div>
          </div>
        </div>

        {/* Arrow / Line connector */}
        <div className="flex-1 px-4 flex flex-col items-center justify-center">
          <div className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100 mb-1">
            {clampedAhead === 0 ? 'Your Turn Now!' : `${clampedAhead} ${t.patientsAhead}`}
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-emerald-500 via-sky-500 to-teal-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-right">
          <div>
            <div className="text-2xl font-black font-mono text-sky-700 tracking-tight">
              {patientToken}
            </div>
            <div className="text-[11px] font-medium text-sky-600">
              Your Position
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
            <User size={20} />
          </div>
        </div>
      </div>

      {/* Step Pills */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1 text-emerald-600 font-medium">
          <CheckCircle2 size={14} />
          <span>Queue Active</span>
        </div>
        <div className="text-slate-400 font-mono text-[11px]">
          Estimated Pace: ~5-7 mins / patient
        </div>
      </div>
    </div>
  );
};
