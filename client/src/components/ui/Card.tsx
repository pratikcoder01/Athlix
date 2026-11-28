'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'glass-strong' | 'glow' | 'accent' | 'flat';
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'default',
  hoverable = false,
  children,
  ...props
}) => {
  const variantClasses: Record<string, string> = {
    default: 'bg-surface border border-border',
    glass: 'bg-surface border border-border',
    'glass-strong': 'bg-surface border border-border-strong',
    glow: 'bg-surface border border-border-strong',
    accent: 'bg-surface border border-border-strong',
    flat: 'bg-surface/50 border border-transparent ',
  };

  const baseClass = cn(
    'rounded-lg overflow-hidden p-6 transition-colors duration-150',
    variantClasses[variant],
    className
  );

  return (
    <div className={cn(baseClass, hoverable && 'hover:border-border-strong hover:bg-surface-hover')} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('flex flex-col gap-1.5 mb-4', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3
    className={cn(
      'text-lg font-bold font-display tracking-tight text-text-primary',
      className
    )}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<
  React.HTMLAttributes<HTMLParagraphElement>
> = ({ className, children, ...props }) => (
  <p
    className={cn(
      'text-sm text-text-secondary tracking-tight leading-relaxed',
      className
    )}
    {...props}
  >
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('w-full', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn(
      'flex items-center gap-4 mt-6 pt-4 border-t border-border/60',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardTitle.displayName = 'CardTitle';
CardDescription.displayName = 'CardDescription';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';
