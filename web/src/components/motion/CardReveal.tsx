'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MOTION_DURATIONS, MOTION_EASINGS, checkReducedMotion } from '@/lib/motion';

export interface CardRevealProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  /**
   * Stagger index for staggered grid entrance (0-indexed)
   */
  index?: number;
  /**
   * Optional manual delay override in seconds
   */
  delay?: number;
  /**
   * Enable subtle interactive lift on hover (-2px translateY)
   */
  hoverLift?: boolean;
  /**
   * Enable micro-press feedback on click (scale 0.99)
   */
  activePress?: boolean;
  /**
   * Observe viewport visibility via IntersectionObserver
   */
  viewportOnce?: boolean;
}

export const CardReveal: React.FC<CardRevealProps> = ({
  children,
  className,
  index = 0,
  delay,
  hoverLift = false,
  activePress = false,
  viewportOnce = true,
  ...props
}) => {
  const isReduced = checkReducedMotion();
  const calculatedDelay = delay !== undefined ? delay : Math.min(index * MOTION_DURATIONS.STAGGER_STEP, MOTION_DURATIONS.STAGGER_MAX);

  const hoverAnimation = hoverLift && !isReduced ? { y: -2, transition: { duration: 0.15 } } : undefined;
  const tapAnimation = activePress && !isReduced ? { scale: 0.99, transition: { duration: 0.10 } } : undefined;

  return (
    <motion.div
      initial={isReduced ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.985 }}
      whileInView={isReduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: viewportOnce, margin: '0px 0px -40px 0px' }}
      transition={{
        duration: MOTION_DURATIONS.CARD,
        ease: MOTION_EASINGS.PRIMARY,
        delay: isReduced ? 0 : calculatedDelay,
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
