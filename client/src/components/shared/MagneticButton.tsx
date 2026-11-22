'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

interface MagneticButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'outline' | 'premium' | 'accent';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  as?: 'button' | 'span';
}

// Retain the public component API; interaction now uses native, fixed targets.
export const MagneticButton: React.FC<MagneticButtonProps> = ({ children, className, variant = 'premium', size = 'md', disabled = false, as = 'button', ...props }) => {
  const sizes = { sm: 'min-h-10 px-4 py-2 text-xs', md: 'min-h-11 px-6 py-3 text-sm', lg: 'min-h-12 px-7 py-3.5 text-sm', icon: 'h-11 w-11 p-3' };
  const primary = 'bg-accent text-[#09090B] hover:bg-[var(--accent-primary-hover)]';
  const variants = {
    premium: primary, primary, accent: primary,
    outline: 'border border-border-strong bg-transparent text-text-primary hover:bg-surface-hover',
    ghost: 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
  };
  const classes = cn('inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50', sizes[size], variants[variant], className);
  if (as === 'span') {
    // A Link owns focus and interaction; its visual child is never a second tab stop.
    return <span className={cn(classes, disabled && 'opacity-50')} aria-disabled={disabled || undefined}>{children}</span>;
  }
  return <motion.button {...props} className={classes} disabled={disabled} whileHover={undefined} whileTap={undefined}>{children}</motion.button>;
};

export default MagneticButton;
