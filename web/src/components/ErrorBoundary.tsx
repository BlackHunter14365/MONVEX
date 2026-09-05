'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught component error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="min-h-[380px] flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-white border border-[#FECDD3] m-4 shadow-card text-[#191522]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FDECEF] text-[#E11D48] border border-[#FECDD3] mb-3.5 shadow-2xs">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-[#191522] tracking-tight">Something went wrong</h2>
          <p className="text-xs text-[#625D69] max-w-md mt-1 mb-5 leading-relaxed font-medium">
            A temporary component rendering error occurred. Your financial records and calculations are safe.
          </p>
          <Button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            variant="primary"
            size="sm"
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            Reload Component
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
