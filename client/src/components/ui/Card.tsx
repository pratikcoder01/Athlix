'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'glass-strong' | 'glow' | 'accent' | 'flat';
  hoverable?: boolean;
}

const MotionDiv = motion.div;

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'default',
  hoverable = false,
  children,
  ...props
}) => {
  const variantClasses: Record<string, string> = {
    default: 'bg-surface border border-border shadow-xs',
    glass: 'glass-panel border border-border shadow-md',
    'glass-strong': 'glass-panel-strong border border-border-strong shadow-xl',
    glow: 'glass-panel border border-border/80 shadow-glow',
    accent: 'bg-surface border-l-4 border-l-accent border-r border-t border-b border-border shadow-sm',
    flat: 'bg-surface/50 border border-transparent shadow-none',
  };

  const baseClass = cn(
    'rounded-2xl overflow-hidden p-6 transition-all duration-300',
    variantClasses[variant],
    className
  );

  if (hoverable) {
    return (
      <MotionDiv
        whileHover={{ y: -4, scale: 1.005 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={baseClass}
        {...(props as React.ComponentProps<typeof MotionDiv>)}
      >
        {children}
      </MotionDiv>
    );
  }

  return (
    <div className={baseClass} {...props}>
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
