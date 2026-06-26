'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface AnimatedBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent';
  className?: string;
  glow?: boolean;
}

export const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({
  children,
  variant = 'default',
  className,
  glow = false,
}) => {
  const variantStyles = {
    default: 'bg-surface border-border text-text-secondary',
    success: 'bg-success/10 border-success/20 text-success',
    warning: 'bg-warning/10 border-warning/20 text-warning',
    danger: 'bg-danger/10 border-danger/20 text-danger',
    accent: 'bg-accent/10 border-accent/20 text-accent',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'relative inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border',
        variantStyles[variant],
        className
      )}
    >
      {glow && (
        <span className="absolute inset-0 rounded-full bg-inherit blur-md opacity-50 -z-10 animate-pulse" />
      )}
      {children}
    </motion.div>
  );
};
