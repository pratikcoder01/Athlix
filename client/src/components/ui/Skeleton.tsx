'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'avatar' | 'rectangular' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  ...props
}) => {
  const variantClasses = {
    text: 'h-4 w-full rounded-md',
    avatar: 'h-10 w-10 rounded-full',
    circle: 'rounded-full',
    rectangular: 'rounded-2xl',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-surface-hover/80 border border-border/10',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
};

Skeleton.displayName = 'Skeleton';
