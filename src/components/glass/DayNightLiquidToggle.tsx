import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import type { AppearanceMode } from '../../types/domain';

interface DayNightLiquidToggleProps {
  appearance: AppearanceMode;
  onChange: (mode: AppearanceMode) => void;
  ariaLabel?: string;
  className?: string;
}

export const DayNightLiquidToggle: React.FC<DayNightLiquidToggleProps> = ({
  appearance,
  onChange,
  ariaLabel = 'Toggle day and night mode',
  className = '',
}) => {
  const isDark = appearance === 'dark';

  const handleToggle = () => {
    // Toggle between light and dark (if bw, switch to dark)
    onChange(isDark ? 'light' : 'dark');
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={ariaLabel}
      onClick={handleToggle}
      className={`relative group inline-flex items-center h-9 w-[84px] rounded-full p-1 cursor-pointer transition-[background,box-shadow,border-color] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] ${
        isDark
          ? 'bg-gradient-to-r from-[#040812] via-[#0b1329] to-[#0f172a] border border-sky-500/30 shadow-[0_8px_24px_-8px_rgba(3,7,18,0.7),inset_0_1px_2px_rgba(56,189,248,0.25)]'
          : 'bg-gradient-to-r from-[#e0f2fe] via-[#bae6fd] to-[#7dd3fc] border border-sky-300/80 shadow-[0_8px_24px_-8px_rgba(2,132,199,0.28),inset_0_1px_3px_rgba(255,255,255,0.9)]'
      } ${className}`}
    >
      {/* Sky Ambient Atmosphere / Clouds / Stars Container */}
      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Day Mode Atmosphere: Sunburst glow & soft floating clouds */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isDark ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {/* Warm Sunlight Glow on Left */}
          <div className="absolute -left-2 top-0 bottom-0 w-12 bg-gradient-to-r from-amber-300/40 via-sky-200/30 to-transparent blur-sm" />
          {/* Subtle Floating Cloud 1 */}
          <div className="absolute left-7 top-2.5 w-5 h-2 bg-white/70 rounded-full blur-[0.6px] animate-pulse" />
          {/* Subtle Floating Cloud 2 */}
          <div className="absolute left-4 bottom-2.5 w-4 h-1.5 bg-white/60 rounded-full blur-[0.5px]" />
        </div>

        {/* Night Mode Atmosphere: Midnight deep glow & twinkling stars */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isDark ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Moonlight glow on Right */}
          <div className="absolute -right-2 top-0 bottom-0 w-12 bg-gradient-to-l from-indigo-500/30 via-sky-400/20 to-transparent blur-sm" />
          {/* Star 1 */}
          <div className="absolute left-3 top-2 w-1 h-1 bg-sky-200 rounded-full shadow-[0_0_6px_rgba(125,211,252,0.9)]" />
          {/* Star 2 */}
          <div className="absolute left-7 bottom-2 w-1.5 h-1.5 bg-indigo-200 rounded-full shadow-[0_0_8px_rgba(199,210,254,0.9)]" />
          {/* Star 3 */}
          <div className="absolute left-12 top-3 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.9)]" />
        </div>
      </div>

      {/* Movable Glass Sun / Moon Knob */}
      <motion.div
        layout
        transition={{
          type: 'spring',
          stiffness: 320,
          damping: 28,
          mass: 0.9,
        }}
        className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-md backdrop-blur-md transition-colors duration-500 ${
          isDark
            ? 'translate-x-[47px] bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-400/50 text-indigo-200 shadow-[0_4px_14px_rgba(99,102,241,0.45),inset_0_1px_1px_rgba(255,255,255,0.25)]'
            : 'translate-x-0 bg-gradient-to-br from-amber-100 via-amber-200 to-yellow-400 border border-white/90 text-amber-900 shadow-[0_4px_14px_rgba(245,158,11,0.45),inset_0_1px_2px_rgba(255,255,255,0.9)]'
        }`}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-indigo-200 drop-shadow-[0_0_4px_rgba(165,180,252,0.8)]" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-700 drop-shadow-[0_0_4px_rgba(245,158,11,0.8)]" />
        )}
      </motion.div>
    </button>
  );
};
