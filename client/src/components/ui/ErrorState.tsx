'use client';

import React from 'react';
import { Button } from './Button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'An error occurred',
  message,
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 border border-danger/10 rounded-2xl bg-danger-bg/5 max-w-md mx-auto select-none',
        className
      )}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-danger-bg border border-danger/25 mb-4 shrink-0 shadow-sm shadow-danger/10">
        <AlertCircle className="w-8 h-8 text-danger" />
      </div>
      <h3 className="text-base font-bold font-display tracking-tight text-text-primary mb-1">
        {title}
      </h3>
      <p className="text-xs text-text-secondary tracking-tight max-w-xs mb-6 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};

ErrorState.displayName = 'ErrorState';
