'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, containerClassName, id, rows = 4, ...props }, ref) => {
    const fallbackId = React.useId();
    const textareaId = id || fallbackId;

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-semibold text-text-secondary tracking-tight select-none cursor-pointer"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={cn(
            'w-full px-4 py-2.5 text-sm rounded-xl bg-surface border border-border text-text-primary transition-all duration-200 placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:bg-surface-elevated focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:pointer-events-none resize-y min-h-[80px]',
            error && 'border-danger focus:border-danger focus:ring-danger/30 focus:ring-1',
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-xs text-danger font-medium tracking-tight animate-fade-in">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
