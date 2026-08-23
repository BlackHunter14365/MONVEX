'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MotionCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
}

export const MotionCard: React.FC<MotionCardProps> = ({
  children,
  className,
  hoverScale = 1.015,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, scale: hoverScale }}
      className={cn('ref-card', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};
