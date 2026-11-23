import React from 'react';

export const BrandLogoMark: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 rounded-xl bg-gradient-to-br from-[#0F172A] via-[#1E3A5F] to-[#1E1B4B] p-1.5 shadow-sm ring-1 ring-slate-900/10 dark:ring-sky-400/25 ${className}`}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="brand-book" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#BAE6FD" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
          <linearGradient id="brand-globe" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="55%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#818CF8" />
          </linearGradient>
        </defs>

        {/* Open Academic Book Base */}
        <path
          d="M 8 48 C 18 44, 30 48, 32 52 C 34 48, 46 44, 56 48 L 56 34 C 46 30, 34 34, 32 38 C 30 34, 18 30, 8 34 Z"
          fill="url(#brand-book)"
          stroke="#E0F2FE"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M 32 38 L 32 52" stroke="#0369A1" strokeWidth="2" strokeLinecap="round" />

        {/* Globe Atop Book */}
        <circle
          cx="32"
          cy="23"
          r="12"
          fill="url(#brand-globe)"
          stroke="#7DD3FC"
          strokeWidth="1.5"
        />
        <ellipse cx="32" cy="23" rx="5" ry="12" stroke="#FFFFFF" strokeWidth="1" fill="none" opacity="0.65" />
        <path d="M 20 23 H 44" stroke="#FFFFFF" strokeWidth="1" opacity="0.65" />
        <path d="M 22 17 H 42" stroke="#FFFFFF" strokeWidth="0.85" opacity="0.45" />
        <path d="M 22 29 H 42" stroke="#FFFFFF" strokeWidth="0.85" opacity="0.45" />

        {/* Star Sparkle Atop Globe */}
        <path
          d="M 32 5 L 33.6 9.4 L 38 11 L 33.6 12.6 L 32 17 L 30.4 12.6 L 26 11 L 30.4 9.4 Z"
          fill="#FFFFFF"
        />
      </svg>
    </div>
  );
};
