import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true }) => {
  const sizeMap = {
    sm: { icon: 26, text: 'text-lg' },
    md: { icon: 34, text: 'text-xl' },
    lg: { icon: 44, text: 'text-2xl' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      {/* Brand Icon: Location Pin + Healthcare Cross + Circular Queue Ring */}
      <div className="relative flex items-center justify-center">
        <svg
          width={currentSize.icon}
          height={currentSize.icon}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          {/* Location Pin Base */}
          <path
            d="M18 2C10.82 2 5 7.82 5 15C5 24 18 34 18 34C18 34 31 24 31 15C31 7.82 25.18 2 18 2Z"
            fill="url(#logo_grad_pin)"
          />
          {/* Outer Queue Circular Track */}
          <circle
            cx="18"
            cy="14"
            r="8.5"
            stroke="white"
            strokeWidth="1.8"
            strokeDasharray="2.5 2.5"
            opacity="0.9"
          />
          {/* Medical Cross in Center */}
          <rect x="16.2" y="9.5" width="3.6" height="9" rx="1.2" fill="white" />
          <rect x="13.5" y="12.2" width="9" height="3.6" rx="1.2" fill="white" />
          {/* Active Queue Progress Pip */}
          <circle cx="24" cy="9.5" r="2.2" fill="#38bdf8" stroke="white" strokeWidth="1" />

          <defs>
            <linearGradient id="logo_grad_pin" x1="5" y1="2" x2="31" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0284c7" /> {/* Sky Blue 600 */}
              <stop offset="1" stopColor="#0f766e" /> {/* Teal 700 */}
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`${currentSize.text} text-slate-900 font-extrabold tracking-tight`}>
            Queue<span className="text-sky-600">Check</span>
          </span>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-teal-700 mt-0.5">
            Healthcare Queues
          </span>
        </div>
      )}
    </div>
  );
};
