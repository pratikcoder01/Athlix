'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, disabled = false, className }) => {
  const toggleId = React.useId();

  return (
    <label
      htmlFor={toggleId}
      className={cn(
        'inline-flex items-center gap-3 cursor-pointer select-none group text-sm',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      <div className="relative">
        <input
          type="checkbox"
          id={toggleId}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <motion.div
          animate={{
            backgroundColor: checked ? 'var(--brand-accent)' : 'var(--color-surface-hover)',
            borderColor: checked ? 'var(--brand-accent)' : 'var(--color-border)',
          }}
          transition={{ duration: 0.2 }}
          className="w-10 h-6 rounded-full border flex items-center p-0.5 transition-colors shadow-inner"
        >
          <motion.div
            layout
            animate={{
              x: checked ? 16 : 0,
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="w-4.5 h-4.5 rounded-full bg-white shadow-md"
          />
        </motion.div>
      </div>
      {label && (
        <span className="font-semibold text-text-secondary group-hover:text-text-primary transition-colors tracking-tight">
          {label}
        </span>
      )}
    </label>
  );
};

Switch.displayName = 'Switch';
