/**
 * MONVEX Centralized Motion & Animation System
 * Core Principle: Fast, subtle, professional, GPU-friendly, data-aware.
 */

export const MOTION_DURATIONS = {
  FAST: 0.15,      // 150ms - Micro-interactions, icons, tooltips
  NORMAL: 0.22,    // 220ms - Buttons, tabs, dropdowns
  CARD: 0.28,      // 280ms - Card entrances, panel reveals
  MODAL: 0.20,     // 200ms - Dialogs, confirmation popups
  DRAWER: 0.24,    // 240ms - Side drawers, mobile navigation
  COUNTER_MS: 650, // 650ms - Financial KPI count-up easing
  STAGGER_STEP: 0.04, // 40ms stagger per child card
  STAGGER_MAX: 0.24,  // 240ms maximum total stagger delay cap
} as const;

export const MOTION_EASINGS = {
  // Apple/Linear-style premium deceleration curve
  PRIMARY: [0.16, 1, 0.3, 1] as [number, number, number, number],
  // Snappy spring-like exit
  EXIT: [0.32, 0, 0.67, 0] as [number, number, number, number],
  // Chart reveals
  CHART: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
} as const;

export function checkReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const cardEntranceVariants = {
  hidden: {
    opacity: 0,
    y: 8,
    scale: 0.985,
  },
  visible: (customDelay: number = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: MOTION_DURATIONS.CARD,
      ease: MOTION_EASINGS.PRIMARY,
      delay: Math.min(customDelay, MOTION_DURATIONS.STAGGER_MAX),
    },
  }),
  exit: {
    opacity: 0,
    y: 6,
    scale: 0.985,
    transition: {
      duration: MOTION_DURATIONS.FAST,
      ease: MOTION_EASINGS.EXIT,
    },
  },
};

export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: MOTION_DURATIONS.STAGGER_STEP,
      delayChildren: 0.02,
    },
  },
};

export const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.97,
    y: 4,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.MODAL,
      ease: MOTION_EASINGS.PRIMARY,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 4,
    transition: {
      duration: MOTION_DURATIONS.FAST,
      ease: MOTION_EASINGS.EXIT,
    },
  },
};

export const backdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: MOTION_DURATIONS.FAST },
  },
  exit: {
    opacity: 0,
    transition: { duration: MOTION_DURATIONS.FAST },
  },
};

export const drawerVariants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: {
      duration: MOTION_DURATIONS.DRAWER,
      ease: MOTION_EASINGS.PRIMARY,
    },
  },
  exit: {
    x: '100%',
    transition: {
      duration: MOTION_DURATIONS.FAST,
      ease: MOTION_EASINGS.EXIT,
    },
  },
};
