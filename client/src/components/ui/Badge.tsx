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
    primary: 'bg-surface-hover text-text-secondary border border-border',
    secondary: 'bg-surface-hover text-text-secondary border border-border',
    success: 'bg-surface-hover text-text-secondary border border-border',
    warning: 'bg-surface-hover text-text-secondary border border-border',
    danger: 'bg-surface-hover text-text-secondary border border-border',
    info: 'bg-surface-hover text-text-secondary border border-border',
    accent: 'bg-surface-hover text-text-secondary border border-border',
    outline: 'bg-transparent text-text-secondary border border-border',
  };

  const pulseColors = {
    primary: 'bg-text-secondary',
    secondary: 'bg-text-secondary',
    success: 'bg-[var(--status-active)]',
    warning: 'bg-[var(--status-experimental)]',
    danger: 'bg-danger',
    info: 'bg-info',
    accent: 'bg-text-secondary',
    outline: 'bg-text-tertiary',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-mono select-none shrink-0',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {(pulse || ['success', 'warning', 'danger'].includes(variant)) && <span aria-hidden="true" className={cn('inline-flex h-1.5 w-1.5 shrink-0 rounded-full', pulseColors[variant])} />}
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';
