'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MOTION_DURATIONS, MOTION_EASINGS, checkReducedMotion } from '@/lib/motion';

export interface StaggerContainerProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  staggerStep?: number;
  delayChildren?: number;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className,
  staggerStep = MOTION_DURATIONS.STAGGER_STEP,
  delayChildren = 0.02,
  ...props
}) => {
  const isReduced = checkReducedMotion();

  return (
    <motion.div
      initial={isReduced ? { opacity: 1 } : 'hidden'}
      animate={isReduced ? { opacity: 1 } : 'visible'}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: isReduced ? 0 : staggerStep,
            delayChildren: isReduced ? 0 : delayChildren,
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
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className,
  ...props
}) => {
  const isReduced = checkReducedMotion();

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8, scale: 0.985 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: MOTION_DURATIONS.CARD,
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
