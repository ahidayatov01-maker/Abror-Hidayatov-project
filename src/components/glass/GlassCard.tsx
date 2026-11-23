import React from 'react';
import { motion } from 'motion/react';
import { computeStaggerDelay, MOTION_DURATION, MOTION_EASE } from '../../motion/tokens';

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  subtle?: boolean;
  delayIndex?: number;
  animateEntrance?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  role?: string;
  'aria-label'?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  interactive = false,
  subtle = false,
  delayIndex = 0,
  animateEntrance = false,
  onClick,
  role,
  'aria-label': ariaLabel,
}) => {
  const baseClass = `${subtle ? 'surface-subtle' : 'surface-card'} ${
    interactive ? 'glass-interactive' : ''
  } rounded-2xl ${className}`.trim();

  if (animateEntrance) {
    const delay = computeStaggerDelay(delayIndex);
    return (
      <motion.div
        data-glass-surface="true"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION_DURATION.cardReveal, delay, ease: MOTION_EASE }}
        onClick={onClick}
        role={role}
        aria-label={ariaLabel}
        className={baseClass}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      data-glass-surface="true"
      onClick={onClick}
      role={role}
      aria-label={ariaLabel}
      className={baseClass}
    >
      {children}
    </div>
  );
};
