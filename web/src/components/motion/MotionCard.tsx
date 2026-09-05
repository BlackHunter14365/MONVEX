'use client';

import React from 'react';
import { motion, HTMLMotionProps, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MOTION_DURATIONS, MOTION_EASINGS } from '@/lib/motion';

export type MotionCardSurfaceVariant =
  | 'default'
  | 'white'
  | 'lavender'
  | 'indigo'
  | 'cyan'
  | 'dark-brand'
  | 'dark-indigo'
  | 'dark-plum'
  | 'positive'
  | 'warning'
  | 'negative';

const surfaceVariantStyles: Record<MotionCardSurfaceVariant, string> = {
  default: '',
  white: 'bg-white border border-[#E4E2DC] shadow-card hover:border-[#D6D4CD]',
  lavender: 'bg-[#EEEAF7] border border-[#625477]/20 shadow-subtle',
  indigo: 'bg-[#E9EDFA] border border-[#7184C4]/25 shadow-subtle',
  cyan: 'bg-[#DDF7FA] border border-[#06B6D4]/25 shadow-subtle',
  'dark-brand': 'bg-[#2A1F3D] border border-[#4A3A68] text-white shadow-elevated',
  'dark-indigo': 'bg-[#26335F] border border-[#4056A1]/40 text-white shadow-elevated',
  'dark-plum': 'bg-[#33264A] border border-[#625477]/40 text-white shadow-elevated',
  positive: 'bg-[#E8F7F1] border border-[#A7F3D0] text-[#059669] shadow-subtle',
  warning: 'bg-[#FFF4DF] border border-[#FDE68A] text-[#D97706] shadow-subtle',
  negative: 'bg-[#FDECEF] border border-[#FECDD3] text-[#E11D48] shadow-subtle',
};

export interface MotionCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  /** Surface variant adhering to MONVEX multi-surface color hierarchy */
  surfaceVariant?: MotionCardSurfaceVariant;
  /** Stagger index (0-indexed) for automatic delay calculation */
  index?: number;
  /** Explicit delay override in seconds */
  delay?: number;
  /** Duration override in seconds */
  duration?: number;
  /** Enable hover elevation & lift (default: true) */
  hoverEffect?: boolean;
  /** Vertical lift on hover in pixels, negative value (default: -3) */
  hoverLift?: number;
  /** Subtle scale on hover (default: 1.008) */
  hoverScale?: number;
  /** Enable press/tap micro-feedback (default: true) */
  tapEffect?: boolean;
  /** Scale on press/tap (default: 0.985) */
  tapScale?: number;
  /** Trigger animation once when entering viewport (default: true) */
  viewportOnce?: boolean;
  /** Explicitly disable all animations */
  disabled?: boolean;
}

export const MotionCard: React.FC<MotionCardProps> = ({
  children,
  className,
  surfaceVariant = 'default',
  index = 0,
  delay,
  duration = MOTION_DURATIONS.CARD,
  hoverEffect = true,
  hoverLift = -3,
  hoverScale = 1.008,
  tapEffect = true,
  tapScale = 0.985,
  viewportOnce = true,
  disabled = false,
  ...props
}) => {
  const prefersReduced = useReducedMotion();
  const shouldReduce = Boolean(prefersReduced) || disabled;

  const calculatedDelay =
    delay !== undefined
      ? delay
      : Math.min(index * MOTION_DURATIONS.STAGGER_STEP, MOTION_DURATIONS.STAGGER_MAX);

  const initialVariant = shouldReduce
    ? { opacity: 1, y: 0, scale: 1 }
    : { opacity: 0, y: 12, scale: 0.985 };

  const inViewVariant = {
    opacity: 1,
    y: 0,
    scale: 1,
  };

  const hoverVariant =
    !shouldReduce && hoverEffect
      ? {
          y: hoverLift,
          scale: hoverScale,
          transition: {
            duration: MOTION_DURATIONS.FAST,
            ease: MOTION_EASINGS.PRIMARY,
          },
        }
      : undefined;

  const tapVariant =
    !shouldReduce && tapEffect
      ? {
          scale: tapScale,
          transition: {
            duration: 0.1,
            ease: MOTION_EASINGS.PRIMARY,
          },
        }
      : undefined;

  return (
    <motion.div
      initial={initialVariant}
      whileInView={inViewVariant}
      viewport={{ once: viewportOnce, margin: '0px 0px -20px 0px' }}
      transition={{
        duration: shouldReduce ? 0 : duration,
        ease: MOTION_EASINGS.PRIMARY,
        delay: shouldReduce ? 0 : calculatedDelay,
      }}
      whileHover={hoverVariant}
      whileTap={tapVariant}
      className={cn('transform-gpu', surfaceVariantStyles[surfaceVariant], className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};
