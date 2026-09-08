'use client';

import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthFeedbackProps {
  type?: 'error' | 'success' | 'info';
  message: string;
  className?: string;
}

export const AuthFeedback: React.FC<AuthFeedbackProps> = ({
  type = 'error',
  message,
  className = '',
}) => {
  if (!message) return null;

  const isError = type === 'error';
  const isSuccess = type === 'success';

  return (
    <div
      role="alert"
      className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 transition-all duration-200 ${
        isError
          ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]'
          : isSuccess
          ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
          : 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]'
      } ${className}`}
    >
      {isError ? (
        <AlertCircle className="h-4 w-4 text-[#E11D48] shrink-0 mt-0.5" aria-hidden="true" />
      ) : isSuccess ? (
        <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0 mt-0.5" aria-hidden="true" />
      ) : (
        <AlertCircle className="h-4 w-4 text-[#2563EB] shrink-0 mt-0.5" aria-hidden="true" />
      )}
      <span className="font-medium leading-relaxed">{message}</span>
    </div>
  );
};
