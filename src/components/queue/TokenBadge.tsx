import React from 'react';
import { TokenStatus } from '../../types';

interface TokenBadgeProps {
  tokenNumber: string;
  status?: TokenStatus;
  size?: 'sm' | 'md' | 'lg';
  category?: 'general' | 'followup' | 'emergency' | 'senior';
}

export const TokenBadge: React.FC<TokenBadgeProps> = ({
  tokenNumber,
  status = 'waiting',
  size = 'md',
  category,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 rounded-md font-bold',
    md: 'text-sm px-3 py-1 rounded-lg font-bold tracking-wider',
    lg: 'text-xl px-4 py-2 rounded-xl font-extrabold tracking-widest',
  };

  const statusStyles: Record<TokenStatus, string> = {
    consulting: 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-200 animate-pulse',
    waiting: 'bg-sky-50 text-sky-800 border border-sky-200 font-semibold',
    completed: 'bg-slate-100 text-slate-500 line-through opacity-75',
    skipped: 'bg-amber-100 text-amber-800 border border-amber-300',
    no_show: 'bg-rose-100 text-rose-700 border border-rose-300',
    cancelled: 'bg-rose-50 text-rose-600 border border-rose-200 line-through',
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`${sizeClasses[size]} ${statusStyles[status]} font-mono inline-block`}>
        {tokenNumber}
      </span>
      {category === 'emergency' && (
        <span className="text-[10px] bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded uppercase">
          Urgent
        </span>
      )}
      {category === 'senior' && (
        <span className="text-[10px] bg-purple-600 text-white font-bold px-1.5 py-0.5 rounded uppercase">
          Senior
        </span>
      )}
    </div>
  );
};
