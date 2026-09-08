'use client';

import React, { forwardRef } from 'react';

export interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  actionElement?: React.ReactNode;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ id, label, error, helperText, actionElement, className = '', required, ...props }, ref) => {
    const inputId = id || props.name || label.toLowerCase().replace(/\s+/g, '-');
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="space-y-1.5 text-left w-full">
        <div className="flex items-center justify-between">
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[#191522] block select-none"
          >
            {label}
            {required && <span className="text-[#E11D48] ml-1">*</span>}
          </label>
          {actionElement}
        </div>

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`w-full rounded-lg bg-white border ${
              error
                ? 'border-[#E11D48] focus:border-[#E11D48] focus:ring-1 focus:ring-[#E11D48]'
                : 'border-[#E4E2DC] hover:border-[#D6D4CD] focus:border-[#191522] focus:ring-1 focus:ring-[#191522]'
            } px-3.5 py-2.5 text-sm font-normal text-[#191522] placeholder:text-[#898390] focus:outline-none transition-colors duration-150 min-h-[46px] ${className}`}
            {...props}
          />
        </div>

        {error ? (
          <p id={errorId} className="text-[11px] font-medium text-[#E11D48] mt-1">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-[11px] text-[#898390] mt-1">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';
