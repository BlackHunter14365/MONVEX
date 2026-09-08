'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface AIIdentityIconProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  glow?: boolean;
  animated?: boolean;
}

export const AIIdentityIcon: React.FC<AIIdentityIconProps> = ({
  size = 'md',
  className,
  glow = false,
  animated = false,
}) => {
  const pixelSize =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 16
      : size === 'md'
      ? 22
      : size === 'lg'
      ? 32
      : size === 'xl'
      ? 44
      : 22;

  const gradientId = React.useId();

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center shrink-0 select-none',
        glow && 'drop-shadow-[0_0_8px_rgba(14,165,233,0.35)]',
        className
      )}
      style={{ width: pixelSize, height: pixelSize }}
      aria-label="MONVEX Financial Intelligence Core"
      role="img"
    >
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('w-full h-full', animated && 'transition-transform duration-500')}
      >
        <defs>
          <linearGradient id={`grad-primary-${gradientId}`} x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0EA5E9" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          <linearGradient id={`grad-accent-${gradientId}`} x1="7" y1="16" x2="17" y2="5" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38EF7D" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>

          <radialGradient id={`glow-${gradientId}`} cx="12" cy="11" r="5" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38EF7D" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#38EF7D" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient telemetry core glow */}
        {animated && (
          <circle cx="12" cy="11" r="5" fill={`url(#glow-${gradientId})`} className="animate-pulse" />
        )}

        {/* Outer Isometric Ledger Prism */}
        <path
          d="M12 2.5L20 7.2V16.8L12 21.5L4 16.8V7.2L12 2.5Z"
          stroke={`url(#grad-primary-${gradientId})`}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Internal Multi-Tenant Facet Planes */}
        <path
          d="M12 2.5V11.5L20 16.8"
          stroke={`url(#grad-primary-${gradientId})`}
          strokeWidth="1.2"
          strokeOpacity="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 11.5L4 16.8"
          stroke={`url(#grad-primary-${gradientId})`}
          strokeWidth="1.2"
          strokeOpacity="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Upward Capital Velocity Vector (Runway Arrow) */}
        <path
          d="M7 16L12 11L17 5"
          stroke={`url(#grad-accent-${gradientId})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12.5 5H17V9.5"
          stroke={`url(#grad-accent-${gradientId})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interconnected Ledger Telemetry Nodes */}
        <circle cx="7" cy="16" r="1.3" fill="#0EA5E9" />
        <circle cx="12" cy="11" r="1.7" fill="#38EF7D" className={cn(animated && 'animate-ping origin-center opacity-75')} />
        <circle cx="12" cy="11" r="1.5" fill="#10B981" />
        <circle cx="17" cy="5" r="1.4" fill="#60A5FA" />
      </svg>
    </div>
  );
};
