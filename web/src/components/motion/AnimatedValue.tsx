'use client';

import React, { useEffect, useRef, useState } from 'react';
import { formatCurrency, cn } from '@/lib/utils';
import { MOTION_DURATIONS, checkReducedMotion } from '@/lib/motion';

export interface AnimatedValueProps {
  /**
   * The actual numeric value from API. If null/undefined, shows placeholder or doesn't animate.
   */
  value: number | null | undefined;
  /**
   * Formatting mode
   */
  type?: 'currency' | 'percentage' | 'number' | 'compact';
  /**
   * Currency code (default: INR)
   */
  currency?: string;
  /**
   * Decimal places to format (default: 2 for currency, 1 for percentage, 0 for integers)
   */
  decimals?: number;
  /**
   * Prefix string (e.g. "+", "-")
   */
  prefix?: string;
  /**
   * Suffix string (e.g. "%", " / mo", " days")
   */
  suffix?: string;
  /**
   * Animation duration in ms (default: 650ms)
   */
  duration?: number;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Fallback text when value is null/undefined
   */
  fallback?: string;
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
}) => {
  const [displayValue, setDisplayValue] = useState<string>(() => {
    if (value === null || value === undefined || isNaN(value)) return fallback;
    return formatFormattedValue(value, type, currency, decimals, prefix, suffix);
  });

  const prevValueRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // If value is not available, don't animate fake numbers
    if (value === null || value === undefined || isNaN(value)) {
      setDisplayValue(fallback);
      prevValueRef.current = null;
      return;
    }

    const isReduced = checkReducedMotion();
    const target = Number(value);

    // Instant display on reduced motion
    if (isReduced) {
      setDisplayValue(formatFormattedValue(target, type, currency, decimals, prefix, suffix));
      prevValueRef.current = target;
      return;
    }

    // Determine start value: 0 on first load, previous value on subsequent live updates
    const startValue = prevValueRef.current !== null ? prevValueRef.current : 0;
    
    // If no change, keep current formatted value
    if (startValue === target && prevValueRef.current !== null) {
      return;
    }

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / Math.max(1, duration), 1);

      // Fast easing (Cubic Out curve)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (target - startValue) * easeOut;

      setDisplayValue(formatFormattedValue(current, type, currency, decimals, prefix, suffix));

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure exact target value is rendered at the end
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
  }, [value, type, currency, decimals, prefix, suffix, duration, fallback]);

  return <span className={cn('tabular-nums transition-colors duration-150', className)}>{displayValue}</span>;
};

export const AnimatedNumber = AnimatedValue;

function formatFormattedValue(
  num: number,
  type: 'currency' | 'percentage' | 'number' | 'compact',
  currency: string,
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
    if (currency === 'INR') {
      formattedNumber = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
      }).format(absNum);
    } else {
      formattedNumber = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
      }).format(absNum);
    }
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
