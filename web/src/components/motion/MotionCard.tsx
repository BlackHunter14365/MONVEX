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
  | 'mint'
  | 'aurora-glass'
  | 'dark-brand'
  | 'dark-indigo'
  | 'dark-plum'
  | 'positive'
  | 'warning'
  | 'negative';

const surfaceVariantStyles: Record<MotionCardSurfaceVariant, string> = {
  default: '',
  white: 'bg-white border border-[#E7E6F0] shadow-card hover:border-[#D5D3E3]',
  lavender: 'bg-[#EEEDF8] border border-[#6865E8]/20 shadow-subtle',
  indigo: 'bg-[#EDEBFB] border border-[#6865E8]/25 shadow-subtle',
  cyan: 'bg-[#E6F9F5] border border-[#75DCC0]/30 shadow-subtle',
  mint: 'bg-[#E6F9F5] border border-[#75DCC0]/35 text-[#16745C] shadow-subtle',
  'aurora-glass': 'aurora-glass shadow-card',
  'dark-brand': 'bg-[#20212B] border border-[#42415E] text-white shadow-elevated',
  'dark-indigo': 'bg-[#252438] border border-[#6865E8]/40 text-white shadow-elevated',
  'dark-plum': 'bg-[#28273D] border border-[#6865E8]/30 text-white shadow-elevated',
  positive: 'bg-[#E6F9F5] border border-[#75DCC0] text-[#16745C] shadow-subtle',
  warning: 'bg-[#FEF6EB] border border-[#FCD89E] text-[#E8A54B] shadow-subtle',
  negative: 'bg-[#FDEEF0] border border-[#F8B4BD] text-[#E76D7A] shadow-subtle',
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
