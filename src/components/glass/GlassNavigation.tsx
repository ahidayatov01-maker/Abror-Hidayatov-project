import React from 'react';
import { motion } from 'motion/react';
import { MOTION_SPRING } from '../../motion/tokens';

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  ariaLabel?: string;
}

export function GlassSegmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className = '',
  buttonClassName = 'px-2.5 py-1 text-xs font-medium rounded-lg',
  layoutGroupId,
}: {
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (next: T) => void;
  ariaLabel?: string;
  className?: string;
  buttonClassName?: string;
  layoutGroupId?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`flex items-center rounded-xl glass-segmented p-0.5 ${className}`.trim()}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-label={opt.ariaLabel}
            aria-pressed={isActive}
            onClick={() => onChange(opt.value)}
            className={`relative whitespace-nowrap cursor-pointer transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${buttonClassName} ${
              isActive
                ? layoutGroupId
                  ? 'text-[var(--text-primary)] font-semibold'
                  : 'glass-pill-active text-[var(--text-primary)] font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {isActive && layoutGroupId && (
              <motion.span
                layoutId={layoutGroupId}
                transition={MOTION_SPRING.liquid}
                aria-hidden="true"
                className="absolute inset-0 rounded-lg glass-pill-active"
              />
            )}
            <span className="relative z-10 inline-flex items-center justify-center gap-1.5">
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export interface GlassNavItemProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
  layoutId?: string;
}

export const GlassNavItem: React.FC<GlassNavItemProps> = ({
  icon,
  label,
  count,
  isActive,
  onClick,
  layoutId = 'sidebar-active-bg',
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={isActive ? 'page' : undefined}
    className={`relative w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-[13px] transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer whitespace-nowrap ${
      isActive
        ? 'text-[var(--text-primary)] font-semibold'
        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06]'
    }`}
  >
    {isActive && (
      <motion.span
        layoutId={layoutId}
        transition={MOTION_SPRING.liquid}
        aria-hidden="true"
        className="absolute inset-0 rounded-xl glass-pill-active"
      />
    )}
    <span className="relative z-10 flex items-center gap-2.5 min-w-0">
      <span className={`shrink-0 transition-colors duration-300 ${isActive ? 'text-[var(--accent-primary)]' : ''}`}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </span>
    {typeof count === 'number' && (
      <span
        className={`relative z-10 font-mono-tabular text-[11px] transition-colors duration-300 ${
          isActive ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-muted)]'
        }`}
      >
        {count}
      </span>
    )}
  </button>
);
