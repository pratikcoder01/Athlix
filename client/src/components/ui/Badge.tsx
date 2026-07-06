'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  pulse = false,
  children,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] font-bold rounded-full gap-1 tracking-wider uppercase',
    md: 'px-2.5 py-1 text-xs font-semibold rounded-full gap-1.5 tracking-tight',
    lg: 'px-3.5 py-1.5 text-sm font-semibold rounded-full gap-2 tracking-tight',
  };

  const variantClasses = {
    primary: 'bg-primary/10 text-primary border border-primary/20',
    secondary: 'bg-secondary text-text-primary border border-border',
    success: 'bg-success-bg text-success border border-success/20',
    warning: 'bg-warning-bg text-warning border border-warning/20',
    danger: 'bg-danger-bg text-danger border border-danger/20',
    info: 'bg-info-bg text-info border border-info/20',
    accent: 'bg-accent/15 text-accent border border-accent/25',
    outline: 'bg-transparent text-text-secondary border border-border',
  };

  const pulseColors = {
    primary: 'bg-primary',
    secondary: 'bg-text-secondary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
    accent: 'bg-accent',
    outline: 'bg-text-tertiary',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-sans select-none shrink-0',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', pulseColors[variant])} />
          <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', pulseColors[variant])} />
        </span>
      )}
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';
