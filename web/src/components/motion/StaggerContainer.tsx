'use client';

import React from 'react';
import { motion, HTMLMotionProps, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MOTION_DURATIONS, MOTION_EASINGS } from '@/lib/motion';

export interface StaggerContainerProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  /** Stagger step in seconds (default: 0.04s) */
  staggerStep?: number;
  /** Initial delay before staggering starts in seconds (default: 0.02s) */
  delayChildren?: number;
  /** Whether to trigger stagger once entering viewport (default: true) */
  viewportOnce?: boolean;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className,
  staggerStep = MOTION_DURATIONS.STAGGER_STEP,
  delayChildren = 0.02,
  viewportOnce = true,
  ...props
}) => {
  const prefersReduced = useReducedMotion();
  const shouldReduce = Boolean(prefersReduced);

  return (
    <motion.div
      initial={shouldReduce ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={{ once: viewportOnce, margin: '0px 0px -20px 0px' }}
      variants={{
        hidden: { opacity: shouldReduce ? 1 : 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: shouldReduce ? 0 : staggerStep,
            delayChildren: shouldReduce ? 0 : delayChildren,
          },
        },
      }}
      className={cn('w-full', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export interface StaggerItemProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className,
  duration = MOTION_DURATIONS.CARD,
  ...props
}) => {
  const prefersReduced = useReducedMotion();
  const shouldReduce = Boolean(prefersReduced);

  return (
    <motion.div
      variants={{
        hidden: {
          opacity: shouldReduce ? 1 : 0,
          y: shouldReduce ? 0 : 12,
          scale: shouldReduce ? 1 : 0.985,
        },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: shouldReduce ? 0 : duration,
            ease: MOTION_EASINGS.PRIMARY,
          },
        },
      }}
      className={cn('transform-gpu', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};
