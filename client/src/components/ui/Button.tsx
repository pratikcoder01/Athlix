'use client';

import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'glass' | 'ghost' | 'danger' | 'success' | 'premium';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

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
      sm: 'min-h-9 px-3 py-1.5 text-xs font-semibold rounded-md gap-1.5',
      md: 'min-h-10 px-4 py-2 text-sm font-semibold rounded-md gap-2',
      lg: 'min-h-11 px-6 py-2.5 text-sm font-semibold rounded-md gap-2.5',
      xl: 'min-h-12 px-7 py-3.5 text-base font-semibold rounded-md gap-3',
    };

    const variantClasses: Record<string, string> = {
      primary:
        'bg-accent text-[#09090B] hover:bg-[var(--accent-primary-hover)] border border-transparent',
      secondary:
        'bg-surface text-text-primary hover:bg-surface-hover border border-border-strong',
      outline:
        'bg-transparent text-text-primary border border-border hover:bg-surface-hover',
      glass:
        'bg-surface text-text-primary hover:bg-surface-hover border border-border-strong',
      ghost:
        'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover',
      danger:
        'bg-surface text-danger hover:bg-danger-bg border border-danger/40',
      success:
        'bg-surface text-text-primary hover:bg-surface-hover border border-border-strong',
      premium:
        'bg-accent text-[#09090B] hover:bg-[var(--accent-primary-hover)] border border-transparent',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={cn(
          'inline-flex items-center justify-center font-sans tracking-tight transition-colors duration-200 outline-none select-none',
          'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin shrink-0 motion-reduce:animate-none" />}
        {!isLoading && leftIcon && (
          <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
