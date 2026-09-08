'use client';

import React from 'react';

interface AuthHeaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title = 'Welcome back.',
  subtitle = 'Sign in to continue to your financial workspace.',
  className = '',
}) => {
  return (
    <div className={`space-y-2 text-left ${className}`}>
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#191522] leading-tight">
        {title}
      </h1>
      <p className="text-sm text-[#625D69] font-normal leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
};
