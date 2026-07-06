'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, containerClassName, id, checked, onChange, ...props }, ref) => {
    const fallbackId = React.useId();
    const checkboxId = id || fallbackId;

    return (
      <div className={cn('flex flex-col gap-1', containerClassName, className)}>
        <label
          htmlFor={checkboxId}
          className="inline-flex items-center gap-2.5 cursor-pointer select-none group text-sm text-text-primary"
        >
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              id={checkboxId}
              ref={ref}
              checked={checked}
              onChange={onChange}
              className="sr-only"
              {...props}
            />
            <motion.div
              initial={false}
              animate={{
                backgroundColor: checked ? 'var(--brand-accent)' : 'var(--color-surface)',
                borderColor: checked ? 'var(--brand-accent)' : 'var(--color-border)',
              }}
              transition={{ duration: 0.15 }}
              className={cn(
                'w-5 h-5 rounded-md border flex items-center justify-center text-white transition-shadow focus-within:ring-2 focus-within:ring-accent/50 group-hover:border-accent/70',
                error && 'border-danger group-hover:border-danger'
              )}
            >
              {checked && (
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3px]" />
                </motion.span>
              )}
            </motion.div>
          </div>
          {label && <span className="font-medium tracking-tight text-text-secondary group-hover:text-text-primary transition-colors">{label}</span>}
        </label>
        {error && <span className="text-xs text-danger font-medium tracking-tight pl-7.5">{error}</span>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
