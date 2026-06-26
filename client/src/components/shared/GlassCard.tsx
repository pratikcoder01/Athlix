'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  variant?: 'default' | 'glow' | 'interactive';
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
    default: 'bg-surface/60 backdrop-blur-2xl border border-border',
    glow: 'bg-surface/80 backdrop-blur-3xl border border-border-strong shadow-glow',
    interactive: 'bg-surface/60 backdrop-blur-2xl border border-border hover:border-accent hover:bg-surface/80 cursor-pointer transition-all duration-300',
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        'relative overflow-hidden rounded-2xl md:rounded-3xl',
        paddingStyles[padding],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {/* Subtle top inner highlight for depth */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
});

GlassCard.displayName = 'GlassCard';
