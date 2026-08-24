'use client';

import { useEffect, useRef } from 'react';

export function useStaggerEntrance(selector: string, dependencies: any[] = []) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !containerRef.current) return;

    const elements = containerRef.current.querySelectorAll(selector);
    elements.forEach((el, index) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.opacity = '0';
      htmlEl.style.transform = 'translateY(12px)';
      htmlEl.style.transition = 'opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(() => {
        htmlEl.style.opacity = '1';
        htmlEl.style.transform = 'translateY(0)';
      }, index * 40);
    });
  }, dependencies);

  return containerRef;
}

export function useKpiCounter(targetValue: number, currency: string = 'INR', duration: number = 600) {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!nodeRef.current || isNaN(targetValue)) return;
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const formatter = (val: number) => {
      const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹';
      return `${sym}${Math.round(val).toLocaleString('en-IN')}`;
    };

    if (prefersReducedMotion) {
      nodeRef.current.textContent = formatter(targetValue);
      return;
    }

    let start = 0;
    const startTime = performance.now();
    let animationFrameId: number;

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = start + (targetValue - start) * easeOut;

      if (nodeRef.current) {
        nodeRef.current.textContent = formatter(current);
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(update);
      }
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetValue, currency, duration]);

  return nodeRef;
}
