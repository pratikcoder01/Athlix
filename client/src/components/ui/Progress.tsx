'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressProps {
  value: number; // 0 to 100
  max?: number;
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  variant = 'primary',
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const bgClasses = {
    primary: 'bg-primary',
    accent: 'bg-accent',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  };

  return (
    <div className={cn('h-2 w-full bg-surface-hover rounded-full overflow-hidden border border-border/20 shadow-inner', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500 ease-out', bgClasses[variant])}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export interface ProgressRingProps {
  value: number; // 0 to 100
  size?: number; // size of the svg container (in px)
  strokeWidth?: number;
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 64,
  strokeWidth = 6,
  variant = 'primary',
  showLabel = false,
  className,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;

  const colorMap = {
    primary: 'text-primary',
    accent: 'text-accent',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center select-none', className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track Ring */}
        <circle
          className="text-surface-hover border border-border/10"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress Ring */}
        <circle
          className={cn('transition-all duration-500 ease-out', colorMap[variant])}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-xs font-bold font-numbers text-text-primary">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
};

Progress.displayName = 'Progress';
ProgressRing.displayName = 'ProgressRing';
