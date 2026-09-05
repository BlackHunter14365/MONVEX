'use client';

import React from 'react';
import { motion, HTMLMotionProps, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MOTION_DURATIONS, MOTION_EASINGS } from '@/lib/motion';

export interface CardRevealProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  /** Stagger index for staggered grid entrance (0-indexed) */
  index?: number;
  /** Optional manual delay override in seconds */
  delay?: number;
  /** Duration override in seconds */
  duration?: number;
  /** Enable subtle interactive lift on hover (-2px translateY) */
  hoverLift?: boolean;
  /** Enable micro-press feedback on click (scale 0.99) */
  activePress?: boolean;
  /** Observe viewport visibility (default: true) */
  viewportOnce?: boolean;
  /** Trigger immediately without viewport trigger (default: false) */
  immediate?: boolean;
  /** Completely disable motion */
  disabled?: boolean;
}

export const CardReveal: React.FC<CardRevealProps> = ({
  children,
  className,
  index = 0,
  delay,
  duration = MOTION_DURATIONS.CARD,
  hoverLift = false,
  activePress = false,
  viewportOnce = true,
  immediate = false,
  disabled = false,
  ...props
}) => {
  const prefersReduced = useReducedMotion();
  const shouldReduce = Boolean(prefersReduced) || disabled;

  const calculatedDelay =
    delay !== undefined
      ? delay
      : Math.min(index * MOTION_DURATIONS.STAGGER_STEP, MOTION_DURATIONS.STAGGER_MAX);

  const hoverAnimation =
    hoverLift && !shouldReduce
      ? { y: -2, transition: { duration: MOTION_DURATIONS.FAST, ease: MOTION_EASINGS.PRIMARY } }
      : undefined;

  const tapAnimation =
    activePress && !shouldReduce
      ? { scale: 0.99, transition: { duration: 0.1 } }
      : undefined;

  const initialVariant = shouldReduce
    ? { opacity: 1, y: 0, scale: 1 }
    : { opacity: 0, y: 12, scale: 0.985 };

  const activeVariant = {
    opacity: 1,
    y: 0,
    scale: 1,
  };

  if (immediate) {
    return (
      <motion.div
        initial={initialVariant}
        animate={activeVariant}
        transition={{
          duration: shouldReduce ? 0 : duration,
          ease: MOTION_EASINGS.PRIMARY,
          delay: shouldReduce ? 0 : calculatedDelay,
        }}
        whileHover={hoverAnimation}
        whileTap={tapAnimation}
        className={cn('relative transform-gpu', className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={initialVariant}
      whileInView={activeVariant}
      viewport={{ once: viewportOnce, margin: '0px 0px -20px 0px' }}
      transition={{
        duration: shouldReduce ? 0 : duration,
        ease: MOTION_EASINGS.PRIMARY,
        delay: shouldReduce ? 0 : calculatedDelay,
      }}
      whileHover={hoverAnimation}
      whileTap={tapAnimation}
      className={cn('relative transform-gpu', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};
