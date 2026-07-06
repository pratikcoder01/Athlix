'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'glass' | 'ghost' | 'danger' | 'success' | 'premium';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const MotionButton = motion.button;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses: Record<string, string> = {
      sm: 'px-3 py-1.5 text-xs font-semibold rounded-full gap-1.5',
      md: 'px-4 py-2 text-sm font-semibold rounded-full gap-2',
      lg: 'px-6 py-2.5 text-base font-semibold rounded-full gap-2.5',
      xl: 'px-8 py-3.5 text-lg font-bold rounded-full gap-3',
    };

    const variantClasses: Record<string, string> = {
      primary:
        'bg-primary text-text-inverse hover:bg-primary-light border border-border shadow-sm',
      secondary:
        'bg-secondary text-text-primary hover:bg-surface-hover border border-border shadow-xs',
      outline:
        'bg-transparent text-text-primary border border-border hover:bg-surface-hover',
      glass:
        'glass-panel text-text-primary hover:bg-surface-hover/80 border border-border shadow-md',
      ghost:
        'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover',
      danger:
        'bg-danger text-white hover:bg-danger/90 shadow-sm shadow-danger/10',
      success:
        'bg-success text-white hover:bg-success/90 shadow-sm shadow-success/10',
      premium:
        'relative overflow-hidden bg-gradient-to-r from-accent via-accent-light to-accent-gold text-white font-bold shadow-lg shadow-accent/25 hover:shadow-accent/45 transition-all duration-300',
    };

    return (
      <MotionButton
        ref={ref}
        disabled={disabled || isLoading}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'inline-flex items-center justify-center font-sans tracking-tight transition-colors duration-200 outline-none select-none',
          'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...(props as React.ComponentProps<typeof MotionButton>)}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {!isLoading && leftIcon && (
          <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </MotionButton>
    );
  }
);

Button.displayName = 'Button';
