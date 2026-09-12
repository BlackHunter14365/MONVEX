'use client';

import React, { useState, forwardRef, useId } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showForgotPassword?: boolean;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  (
    {
      id,
      label = 'Password',
      error,
      showForgotPassword = true,
      className = '',
      required = true,
      disabled,
      autoComplete,
      name,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const reactId = useId();
    const cleanReactId = reactId.replace(/:/g, '');
    const fieldName = name || 'password';
    const inputId = id || (fieldName ? `${fieldName}-${cleanReactId}` : `password-${cleanReactId}`);
    const errorId = `${inputId}-error`;
    const computedAutoComplete =
      autoComplete ||
      (fieldName.toLowerCase().includes('confirm') ? 'new-password' : 'current-password');

    return (
      <div className="space-y-1.5 text-left w-full">
        <div className="flex items-center justify-between">
          <label htmlFor={inputId} className="text-xs font-medium text-[#191522] block select-none">
            {label}
            {required && <span className="text-[#E11D48] ml-1">*</span>}
          </label>
          {showForgotPassword && (
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 rounded"
              tabIndex={0}
            >
              Forgot password?
            </Link>
          )}
        </div>

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            name={fieldName}
            type={showPassword ? 'text' : 'password'}
            required={required}
            disabled={disabled}
            autoComplete={computedAutoComplete}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : undefined}
            className={`w-full rounded-lg bg-white border ${
              error
                ? 'border-[#E11D48] focus:border-[#E11D48] focus:ring-1 focus:ring-[#E11D48]'
                : 'border-[#E4E2DC] hover:border-[#D6D4CD] focus:border-[#191522] focus:ring-1 focus:ring-[#191522]'
            } pl-3.5 pr-11 py-2.5 text-sm font-normal text-[#191522] placeholder:text-[#898390] focus:outline-none transition-colors duration-150 min-h-[46px] disabled:bg-[#F6F5F1] disabled:text-[#898390] disabled:cursor-not-allowed ${className}`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={0}
            disabled={disabled}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-[#898390] hover:text-[#191522] rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191522]/30 disabled:opacity-40"
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>

        {error && (
          <p id={errorId} className="text-[11px] font-medium text-[#E11D48] mt-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

PasswordField.displayName = 'PasswordField';
