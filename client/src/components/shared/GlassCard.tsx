'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  variant?: 'default' | 'glow' | 'interactive' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(({
  children,
  className,
  variant = 'default',
  padding = 'md',
  ...props
}, ref) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6 lg:p-8',
    lg: 'p-10 lg:p-12',
  };

  const variantStyles = {
    default: 'bg-surface border border-border',
    glow: 'bg-surface border border-border-strong',
    interactive: 'bg-surface border border-border hover:border-border-strong transition-colors duration-200',
    elevated: 'bg-surface-subtle border border-border-strong',
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        'relative overflow-hidden rounded-xl',
        paddingStyles[padding],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
});

GlassCard.displayName = 'GlassCard';
