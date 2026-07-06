'use client';

import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, containerClassName, id, ...props }, ref) => {
    const fallbackId = React.useId();
    const selectId = id || fallbackId;

    return (
      <div className={cn('flex flex-col gap-1.5 w-full relative', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-text-secondary tracking-tight select-none cursor-pointer"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'w-full px-4 py-2.5 pr-10 text-sm rounded-xl bg-surface border border-border text-text-primary transition-all duration-200 focus:outline-none focus:border-accent focus:bg-surface-elevated focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:pointer-events-none appearance-none cursor-pointer',
              error && 'border-danger focus:border-danger focus:ring-danger/30 focus:ring-1',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 text-text-tertiary pointer-events-none shrink-0 select-none">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && (
          <span className="text-xs text-danger font-medium tracking-tight animate-fade-in">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
