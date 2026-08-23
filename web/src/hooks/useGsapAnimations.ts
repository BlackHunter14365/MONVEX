'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function useStaggerEntrance(selector: string, dependencies: any[] = []) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        selector,
        {
          opacity: 0,
          y: 12,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.35,
          stagger: 0.05,
          ease: 'power2.out',
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, dependencies);

  return containerRef;
}

export function useKpiCounter(targetValue: number, currency: string = 'INR', duration: number = 0.6) {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!nodeRef.current || isNaN(targetValue)) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const formatter = (val: number) => {
      const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹';
      return `${sym}${Math.round(val).toLocaleString('en-IN')}`;
    };

    if (prefersReducedMotion) {
      nodeRef.current.textContent = formatter(targetValue);
      return;
    }

    const obj = { val: 0 };
    const tween = gsap.to(obj, {
      val: targetValue,
      duration,
      ease: 'power3.out',
      onUpdate: () => {
        if (nodeRef.current) {
          nodeRef.current.textContent = formatter(obj.val);
        }
      },
    });

    return () => {
      tween.kill();
    };
  }, [targetValue, currency, duration]);

  return nodeRef;
}
