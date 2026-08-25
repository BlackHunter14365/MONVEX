import { useEffect, useRef } from 'react';
import { MOTION_DURATIONS, checkReducedMotion } from '@/lib/motion';

/**
 * Viewport-aware staggered card reveal hook using IntersectionObserver
 */
export function useStaggerEntrance(selector: string, dependencies: any[] = []) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReducedMotion = checkReducedMotion();
    if (prefersReducedMotion || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elements = entry.target.querySelectorAll(selector);
            elements.forEach((el, index) => {
              const htmlEl = el as HTMLElement;
              const delay = Math.min(index * (MOTION_DURATIONS.STAGGER_STEP * 1000), MOTION_DURATIONS.STAGGER_MAX * 1000);
              htmlEl.style.opacity = '0';
              htmlEl.style.transform = 'translateY(8px) scale(0.985)';
              htmlEl.style.transition = 'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)';
              setTimeout(() => {
                htmlEl.style.opacity = '1';
                htmlEl.style.transform = 'translateY(0) scale(1)';
              }, delay);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, dependencies);

  return containerRef;
}

/**
 * Data-aware requestAnimationFrame counter with delta smoothing
 */
export function useKpiCounter(
  targetValue: number | null | undefined,
  currency: string = 'INR',
  duration: number = MOTION_DURATIONS.COUNTER_MS
) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const prevValueRef = useRef<number | null>(null);

  useEffect(() => {
    if (!nodeRef.current || targetValue === null || targetValue === undefined || isNaN(targetValue)) return;
    const prefersReducedMotion = checkReducedMotion();

    const formatter = (val: number) => {
      const isNeg = val < 0;
      const absVal = Math.abs(val);
      const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹';
      return `${isNeg ? '-' : ''}${sym}${Math.round(absVal).toLocaleString('en-IN')}`;
    };

    if (prefersReducedMotion) {
      nodeRef.current.textContent = formatter(targetValue);
      prevValueRef.current = targetValue;
      return;
    }

    const start = prevValueRef.current !== null ? prevValueRef.current : 0;
    const target = Number(targetValue);
    
    if (start === target && prevValueRef.current !== null) {
      return;
    }

    const startTime = performance.now();
    let animationFrameId: number;

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * easeOut;

      if (nodeRef.current) {
        nodeRef.current.textContent = formatter(current);
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(update);
      } else {
        if (nodeRef.current) {
          nodeRef.current.textContent = formatter(target);
        }
        prevValueRef.current = target;
      }
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetValue, currency, duration]);

  return nodeRef;
}

export const useAnimatedNumber = useKpiCounter;

