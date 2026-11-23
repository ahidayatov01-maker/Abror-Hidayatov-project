import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import type { NavSectionId } from '../types/domain';
import {
  computeStaggerDelay,
  getPageTransitionVariants,
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_EASE_SOFT,
  MOTION_SPRING,
} from './tokens';

export const MotionPageStage: React.FC<{
  section: NavSectionId;
  children: React.ReactNode;
}> = ({ section, children }) => {
  const variants = getPageTransitionVariants(section);
  return (
    <motion.div
      key={section}
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
    >
      {children}
    </motion.div>
  );
};

interface MotionRevealProps extends HTMLMotionProps<'div'> {
  delayIndex?: number;
  distance?: number;
  children: React.ReactNode;
}

export const MotionReveal: React.FC<MotionRevealProps> = ({
  delayIndex = 0,
  distance = 10,
  className,
  children,
  ...rest
}) => {
  const delay = computeStaggerDelay(delayIndex);
  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION_DURATION.panelOpen, delay, ease: MOTION_EASE }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

interface MotionCardProps extends HTMLMotionProps<'div'> {
  delayIndex?: number;
  interactive?: boolean;
  children: React.ReactNode;
}

export const MotionCard: React.FC<MotionCardProps> = ({
  delayIndex = 0,
  interactive = false,
  className,
  children,
  ...rest
}) => {
  const delay = computeStaggerDelay(delayIndex);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION_DURATION.cardReveal, delay, ease: MOTION_EASE }}
      whileHover={
        interactive
          ? { y: -3, transition: { duration: MOTION_DURATION.cardHover, ease: MOTION_EASE } }
          : undefined
      }
      whileTap={
        interactive
          ? { scale: 0.992, transition: { duration: MOTION_DURATION.micro, ease: MOTION_EASE_SOFT } }
          : undefined
      }
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export const MotionModalBackdrop: React.FC<{
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}> = ({ onClick, className = '', children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: MOTION_DURATION.modal, ease: MOTION_EASE }}
    className={className}
  >
    {onClick && (
      <div className="fixed inset-0" onClick={onClick} aria-hidden="true" />
    )}
    {children}
  </motion.div>
);

export const MotionModalPanel: React.FC<HTMLMotionProps<'div'>> = ({
  className,
  children,
  ...rest
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.965, y: 12 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.975, y: 8 }}
    transition={MOTION_SPRING.gentle}
    className={className}
    {...rest}
  >
    {children}
  </motion.div>
);

export const MotionDropdown: React.FC<HTMLMotionProps<'div'>> = ({
  className,
  children,
  ...rest
}) => (
  <motion.div
    initial={{ opacity: 0, y: -6, scale: 0.975 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -4, scale: 0.98 }}
    transition={{ duration: MOTION_DURATION.buttonHover, ease: MOTION_EASE }}
    className={className}
    {...rest}
  >
    {children}
  </motion.div>
);

export const MotionDrawer: React.FC<HTMLMotionProps<'aside'>> = ({
  className,
  children,
  ...rest
}) => (
  <motion.aside
    initial={{ x: '-100%' }}
    animate={{ x: 0 }}
    exit={{ x: '-100%' }}
    transition={MOTION_SPRING.drawer}
    className={className}
    {...rest}
  >
    {children}
  </motion.aside>
);
