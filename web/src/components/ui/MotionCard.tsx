'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MOTION_DURATIONS, MOTION_EASINGS, checkReducedMotion } from '@/lib/motion';

interface MotionCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
  index?: number;
}

export const MotionCard: React.FC<MotionCardProps> = ({
  children,
  className,
  hoverScale = 1.008,
  index = 0,
  ...props
}) => {
  const isReduced = checkReducedMotion();
  const delay = Math.min(index * MOTION_DURATIONS.STAGGER_STEP, MOTION_DURATIONS.STAGGER_MAX);

  return (
    <motion.div
      initial={isReduced ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.985 }}
      animate={isReduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={isReduced ? { opacity: 1 } : { opacity: 0, y: 6, scale: 0.985 }}
      transition={{
        duration: MOTION_DURATIONS.CARD,
        ease: MOTION_EASINGS.PRIMARY,
        delay: isReduced ? 0 : delay,
      }}
      whileHover={isReduced ? undefined : { y: -2, scale: hoverScale }}
      whileTap={isReduced ? undefined : { scale: 0.99 }}
      className={cn('ref-card transform-gpu', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};
