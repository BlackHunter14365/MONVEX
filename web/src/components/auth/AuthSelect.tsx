'use client';

import React, { forwardRef, useId } from 'react';

export interface AuthSelectOption {
  value: string;
  label: string;
}

export interface AuthSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: AuthSelectOption[];
  error?: string;
  helperText?: string;
}

export const AuthSelect = forwardRef<HTMLSelectElement, AuthSelectProps>(
  ({ id, label, options, error, helperText, className = '', required, name, ...props }, ref) => {
    const autoId = useId();
    const cleanAutoId = autoId.replace(/:/g, '');
    const fieldName = name;
    const selectId =
      id ||
      (fieldName
        ? `${fieldName}-${cleanAutoId}`
        : `auth-select-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${cleanAutoId}`);
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    return (
      <div className="space-y-1.5 text-left w-full">
        <label
          htmlFor={selectId}
          className="text-xs font-medium text-[#191522] block select-none"
        >
          {label}
          {required && <span className="text-[#E11D48] ml-1">*</span>}
        </label>

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            name={fieldName}
            required={required}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`w-full rounded-lg bg-white border ${
              error
                ? 'border-[#E11D48] focus:border-[#E11D48] focus:ring-1 focus:ring-[#E11D48]'
                : 'border-[#E4E2DC] hover:border-[#D6D4CD] focus:border-[#191522] focus:ring-1 focus:ring-[#191522]'
            } px-3.5 py-2.5 text-sm font-normal text-[#191522] focus:outline-none transition-colors duration-150 min-h-[46px] cursor-pointer ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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

AuthSelect.displayName = 'AuthSelect';
