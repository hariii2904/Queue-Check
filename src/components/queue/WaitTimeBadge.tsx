import React from 'react';
import { Clock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface WaitTimeBadgeProps {
  minutes: number;
  lower?: number;
  upper?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const WaitTimeBadge: React.FC<WaitTimeBadgeProps> = ({
  minutes,
  lower,
  upper,
  size = 'md',
  showIcon = true,
}) => {
  const { t } = useLanguage();

  const isLow = minutes <= 15;
  const isMed = minutes > 15 && minutes <= 35;

  const colorClasses = isLow
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : isMed
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-orange-50 text-orange-700 border-orange-200';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 rounded-md font-medium',
    md: 'text-sm px-2.5 py-1 rounded-lg font-semibold',
    lg: 'text-base px-3.5 py-1.5 rounded-xl font-bold',
  };

  const displayText =
    lower !== undefined && upper !== undefined
      ? `${lower}–${upper} ${t.mins}`
      : `~${minutes} ${t.mins}`;

  return (
    <span
      className={`inline-flex items-center gap-1.5 border ${colorClasses} ${sizeClasses[size]}`}
    >
      {showIcon && <Clock size={size === 'sm' ? 12 : 14} />}
      <span>{displayText}</span>
    </span>
  );
};
