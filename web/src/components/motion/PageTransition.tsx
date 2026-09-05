'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MOTION_DURATIONS, MOTION_EASINGS } from '@/lib/motion';

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className,
}) => {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={cn('w-full flex-1', className)}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{
        duration: MOTION_DURATIONS.PAGE, // 200ms
        ease: MOTION_EASINGS.PRIMARY,
      }}
      className={cn('w-full flex-1', className)}
    >
      {children}
    </motion.div>
  );
};
