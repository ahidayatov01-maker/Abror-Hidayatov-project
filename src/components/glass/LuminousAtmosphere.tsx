import React from 'react';

export const AmbientAurora: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="absolute top-0 left-0 right-0 h-48 pointer-events-none overflow-hidden z-0 opacity-40 dark:opacity-50"
      style={{ willChange: 'transform, opacity' }}
    >
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1000px] h-[220px] rounded-full blur-[120px] opacity-30 dark:opacity-40 animate-pulse"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(84,221,245,0.3) 0%, rgba(100,155,255,0.2) 40%, rgba(167,139,250,0.15) 70%, transparent 100%)',
          animationDuration: '12s',
        }}
      />
    </div>
  );
};

interface SiriPlasmaWaveProps {
  state?: 'idle' | 'thinking' | 'generating' | 'success';
  className?: string;
}

export const SiriPlasmaWave: React.FC<SiriPlasmaWaveProps> = ({ state = 'idle', className = '' }) => {
  const duration = state === 'thinking' ? '3.5s' : state === 'generating' ? '2.5s' : '9s';

  return (
    <div
      aria-hidden="true"
      className={`relative flex items-center justify-center overflow-hidden pointer-events-none ${className}`}
      style={{ height: '72px', width: '100%' }}
    >
      <svg
        viewBox="0 0 600 120"
        className="w-full h-full opacity-85 dark:opacity-95"
        style={{ filter: 'drop-shadow(0 0 16px rgba(84, 221, 245, 0.35))' }}
      >
        <defs>
          <linearGradient id="plasmaGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#54DDF5" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#649BFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="plasmaGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5865F2" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#54DDF5" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#383B91" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Ribbon 1 */}
        <path
          d="M 0 60 C 120 20, 240 100, 360 60 C 480 20, 540 90, 600 60"
          fill="none"
          stroke="url(#plasmaGrad1)"
          strokeWidth="3.5"
          strokeLinecap="round"
          className="animate-pulse"
          style={{ animationDuration: duration }}
        />

        {/* Ribbon 2 */}
        <path
          d="M 0 60 C 150 100, 300 20, 450 70 C 525 95, 570 40, 600 60"
          fill="none"
          stroke="url(#plasmaGrad2)"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="animate-pulse"
          style={{ animationDuration: '6s', animationDelay: '0.5s' }}
        />

        {/* Core Energy Shimmer */}
        <path
          d="M 50 60 C 180 40, 320 80, 550 60"
          fill="none"
          stroke="#54DDF5"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    </div>
  );
};

export const LuminousAura: React.FC<{ size?: string; className?: string }> = ({
  size = 'w-10 h-10',
  className = '',
}) => {
  return (
    <div
      aria-hidden="true"
      className={`absolute -inset-1 rounded-full pointer-events-none opacity-60 animate-spin-slow ${size} ${className}`}
      style={{
        background: 'conic-gradient(from 0deg at 50% 50%, #54DDF5 0%, #649BFF 35%, #A78BFA 70%, #54DDF5 100%)',
        filter: 'blur(6px)',
        animationDuration: '14s',
      }}
    />
  );
};
