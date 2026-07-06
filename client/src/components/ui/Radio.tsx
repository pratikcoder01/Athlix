'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface RadioOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  options: RadioOption[];
  value?: string | number;
  onValueChange?: (value: string | number) => void;
  containerClassName?: string;
  error?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, options, value, onValueChange, containerClassName, error, name, ...props }, ref) => {
    const fallbackId = React.useId();
    const radioGroupName = name || fallbackId;

    return (
      <div className={cn('flex flex-col gap-2 w-full', containerClassName, className)}>
        {label && <span className="text-xs font-semibold text-text-secondary tracking-tight select-none">{label}</span>}
        <div className="flex flex-col gap-2">
          {options.map((opt) => {
            const optionId = `${radioGroupName}-${opt.value}`;
            const isChecked = value === opt.value;

            return (
              <label
                key={opt.value}
                htmlFor={optionId}
                className={cn(
                  'inline-flex items-center gap-2.5 cursor-pointer select-none group text-sm text-text-primary',
                  opt.disabled && 'opacity-50 pointer-events-none'
                )}
              >
                <div className="relative flex items-center justify-center shrink-0">
                  <input
                    type="radio"
                    id={optionId}
                    name={radioGroupName}
                    value={opt.value}
                    checked={isChecked}
                    disabled={opt.disabled}
                    onChange={() => onValueChange?.(opt.value)}
                    className="sr-only"
                    ref={ref}
                    {...props}
                  />
                  <motion.div
                    initial={false}
                    animate={{
                      borderColor: isChecked ? 'var(--brand-accent)' : 'var(--color-border)',
                    }}
                    transition={{ duration: 0.15 }}
                    className="w-5 h-5 rounded-full border flex items-center justify-center bg-surface group-hover:border-accent/70 transition-colors"
                  >
                    {isChecked && (
                      <motion.div
                        layoutId={`radio-dot-${radioGroupName}`}
                        className="w-2.5 h-2.5 rounded-full bg-accent"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </div>
                <span className="font-medium tracking-tight text-text-secondary group-hover:text-text-primary transition-colors">
                  {opt.label}
                </span>
              </label>
            );
          })}
        </div>
        {error && <span className="text-xs text-danger font-medium tracking-tight mt-1">{error}</span>}
      </div>
    );
  }
);

Radio.displayName = 'Radio';
