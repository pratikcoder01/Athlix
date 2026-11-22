'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface AnimatedBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'gold';
  className?: string;
  glow?: boolean;
}

export const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({
  children,
  variant = 'default',
  className,
}) => {
  const dot = { default: 'bg-text-secondary', success: 'bg-[var(--status-active)]', warning: 'bg-[var(--status-experimental)]', danger: 'bg-danger', accent: 'bg-text-secondary', gold: 'bg-[var(--status-experimental)]' };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border bg-surface-hover px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-text-secondary',
        className
      )}
    >
      <span aria-hidden="true" className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dot[variant])} />
      {children}
    </span>
  );
};
