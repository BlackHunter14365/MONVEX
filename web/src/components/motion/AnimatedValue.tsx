'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MOTION_DURATIONS } from '@/lib/motion';

export interface AnimatedValueProps {
  /** The numeric value from API or state. If null/undefined, displays fallback. */
  value: number | null | undefined;
  /** Formatting mode (default: 'currency') */
  type?: 'currency' | 'percentage' | 'number' | 'compact';
  /** Currency code (default: 'INR') */
  currency?: string;
  /** Decimal places (default: 2 for currency, 1 for percentage, 0 for integers) */
  decimals?: number;
  /** Prefix string (e.g. "+", "-") */
  prefix?: string;
  /** Suffix string (e.g. "%", " / mo", " days") */
  suffix?: string;
  /** Animation duration in ms (default: 650ms) */
  duration?: number;
  /** Custom className */
  className?: string;
  /** Fallback text when value is null/undefined */
  fallback?: string;
  /** Force count-up from 0 on initial mount (useful for hero/demo KPI reveals) */
  startFromZero?: boolean;
}

export const AnimatedValue: React.FC<AnimatedValueProps> = ({
  value,
  type = 'currency',
  currency = 'INR',
  decimals,
  prefix = '',
  suffix = '',
  duration = MOTION_DURATIONS.COUNTER_MS,
  className,
  fallback = '--',
  startFromZero = false,
}) => {
  const prefersReduced = useReducedMotion();
  const prevValueRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [displayValue, setDisplayValue] = useState<string>(() => {
    if (value === null || value === undefined || isNaN(value)) return fallback;
    const initialTarget = Number(value);
    if (startFromZero) {
      return formatFormattedValue(0, type, currency, decimals, prefix, suffix);
    }
    return formatFormattedValue(initialTarget, type, currency, decimals, prefix, suffix);
  });

  useEffect(() => {
    if (value === null || value === undefined || isNaN(value)) {
      setDisplayValue(fallback);
      prevValueRef.current = null;
      return;
    }

    const target = Number(value);

    // Instant display on reduced motion
    if (prefersReduced) {
      setDisplayValue(formatFormattedValue(target, type, currency, decimals, prefix, suffix));
      prevValueRef.current = target;
      return;
    }

    // Determine start value:
    // If startFromZero on first run -> 0.
    // If subsequent change -> prevValueRef.current.
    // If not startFromZero on first run -> target (already rendered, no jump).
    let startValue: number;
    if (prevValueRef.current !== null) {
      startValue = prevValueRef.current;
    } else if (startFromZero) {
      startValue = 0;
    } else {
      // First mount without startFromZero: display target directly and record ref
      setDisplayValue(formatFormattedValue(target, type, currency, decimals, prefix, suffix));
      prevValueRef.current = target;
      return;
    }

    if (startValue === target) {
      setDisplayValue(formatFormattedValue(target, type, currency, decimals, prefix, suffix));
      prevValueRef.current = target;
      return;
    }

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / Math.max(1, duration), 1);

      // Deceleration curve (Cubic Out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (target - startValue) * easeOut;

      setDisplayValue(formatFormattedValue(current, type, currency, decimals, prefix, suffix));

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Guaranteed exact match with API target value on completion
        setDisplayValue(formatFormattedValue(target, type, currency, decimals, prefix, suffix));
        prevValueRef.current = target;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, type, currency, decimals, prefix, suffix, duration, fallback, prefersReduced, startFromZero]);

  return (
    <span className={cn('tabular-nums font-feature-tnum transition-colors duration-150', className)}>
      {displayValue}
    </span>
  );
};

export const AnimatedNumber = AnimatedValue;

export function formatFormattedValue(
  num: number,
  type: 'currency' | 'percentage' | 'number' | 'compact',
  currency: string = 'INR',
  decimals?: number,
  prefix: string = '',
  suffix: string = ''
): string {
  if (isNaN(num)) return '--';

  const isNeg = num < 0;
  const absNum = Math.abs(num);
  let formattedNumber = '';

  if (type === 'currency') {
    const dec = decimals !== undefined ? decimals : 2;
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    formattedNumber = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    }).format(absNum);

    return `${isNeg ? '-' : prefix}${formattedNumber}${suffix}`;
  }

  if (type === 'percentage') {
    const dec = decimals !== undefined ? decimals : 1;
    formattedNumber = `${absNum.toFixed(dec)}%`;
    return `${isNeg ? '-' : prefix}${formattedNumber}${suffix}`;
  }

  if (type === 'compact') {
    if (absNum >= 10000000) {
      formattedNumber = `₹${(absNum / 10000000).toFixed(2)} Cr`;
    } else if (absNum >= 100000) {
      formattedNumber = `₹${(absNum / 100000).toFixed(2)} L`;
    } else if (absNum >= 1000) {
      formattedNumber = `₹${(absNum / 1000).toFixed(1)} k`;
    } else {
      formattedNumber = `₹${absNum.toFixed(0)}`;
    }
    return `${isNeg ? '-' : prefix}${formattedNumber}${suffix}`;
  }

  // Raw number formatting
  const dec = decimals !== undefined ? decimals : 0;
  formattedNumber = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  }).format(absNum);

  return `${isNeg ? '-' : prefix}${formattedNumber}${suffix}`;
}
