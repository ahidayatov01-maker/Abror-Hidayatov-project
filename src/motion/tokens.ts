import type { NavSectionId } from '../types/domain';

/**
 * Natural, fluid deceleration curves calibrated for calm Liquid Glass motion:
 * zero jarring bounce, graceful settling across 60Hz & 120Hz displays.
 */
export const MOTION_EASE = [0.22, 1, 0.36, 1] as const;
export const MOTION_EASE_SOFT = [0.16, 1, 0.3, 1] as const;

export const MOTION_DURATION = {
  micro: 0.22,       // 180-250ms subtle UI shifts
  buttonHover: 0.30, // 250-350ms button elevation & sheen
  cardHover: 0.36,   // 300-450ms card lift
  glassLight: 0.42,  // 350-500ms refractive lighting fade
  modal: 0.42,       // 350-500ms modal backdrop & panel settle
  cardReveal: 0.44,  // calm card entrance
  sidebar: 0.48,     // 400-550ms drawer & indicator glide
  panelOpen: 0.52,   // 450-600ms expanded panels
  pageExit: 0.24,    // smooth cross-exit before enter
  pageEnter: 0.48,   // 400-650ms total page stage reveal
  heroReveal: 0.58,  // editorial hero visual reveal
  ringDraw: 0.90,    // readiness ring smooth draw
} as const;

export const MOTION_SPRING = {
  /** Viscous liquid glass indicator pill / toggle glide */
  liquid: {
    type: 'spring' as const,
    stiffness: 230,
    damping: 30,
    mass: 1.0,
  },
  /** Calm dialog & panel entrance without overshoot bounce */
  gentle: {
    type: 'spring' as const,
    stiffness: 215,
    damping: 28,
    mass: 1.02,
  },
  /** Fluid sidebar drawer slide */
  drawer: {
    type: 'spring' as const,
    stiffness: 210,
    damping: 29,
    mass: 1.05,
  },
} as const;

/**
 * Sections hosting interactive WebGL canvases or physical pointer-driven stationery
 * surfaces must avoid parent CSS transforms so fixed overlays and pointer hit-testing
 * never inherit a transformed containing block.
 */
const OPACITY_ONLY_SECTIONS = new Set<NavSectionId>(['world-explorer', 'paper-journal']);

export function shouldUseOpacityOnlyTransition(section: NavSectionId): boolean {
  return OPACITY_ONLY_SECTIONS.has(section);
}

export function computeStaggerDelay(index: number, stepSeconds = 0.048, maxDelaySeconds = 0.28): number {
  if (!Number.isFinite(index) || index <= 0) return 0;
  return Math.min(index * stepSeconds, maxDelaySeconds);
}

export function getPageTransitionVariants(section: NavSectionId) {
  const opacityOnly = shouldUseOpacityOnlyTransition(section);
  if (opacityOnly) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.34, ease: MOTION_EASE } },
      exit: { opacity: 0, transition: { duration: 0.2, ease: MOTION_EASE_SOFT } },
    };
  }

  // Distinct, subtle GPU-composited motion signatures by section family
  const isMapOrRoadmap = section === 'my-academic-journey';
  const isAiView = section === 'ai-advisor';
  const isProductivity = section === 'routine' || section === 'todo-list';

  if (isMapOrRoadmap) {
    return {
      initial: { opacity: 0, scale: 0.988 },
      animate: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.42, ease: MOTION_EASE },
      },
      exit: {
        opacity: 0,
        scale: 0.992,
        transition: { duration: 0.2, ease: MOTION_EASE_SOFT },
      },
    };
  }

  if (isAiView) {
    return {
      initial: { opacity: 0, y: 8, scale: 0.994 },
      animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.38, ease: MOTION_EASE },
      },
      exit: {
        opacity: 0,
        y: -4,
        transition: { duration: 0.18, ease: MOTION_EASE_SOFT },
      },
    };
  }

  if (isProductivity) {
    return {
      initial: { opacity: 0, x: 10 },
      animate: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.34, ease: MOTION_EASE },
      },
      exit: {
        opacity: 0,
        x: -6,
        transition: { duration: 0.18, ease: MOTION_EASE_SOFT },
      },
    };
  }

  return {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: MOTION_DURATION.pageEnter, ease: MOTION_EASE },
    },
    exit: {
      opacity: 0,
      y: -6,
      transition: { duration: MOTION_DURATION.pageExit, ease: MOTION_EASE_SOFT },
    },
  };
}
