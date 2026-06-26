'use client';

import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'outline' | 'premium';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  as?: 'button' | 'span';
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className,
  variant = 'premium',
  size = 'md',
  disabled = false,
  as = 'button',
  ...restProps
}) => {
  // Extract standard button attributes and omit any custom/conflicting motion handler names if necessary.
  // In React 19/Framer Motion, spreading HTMLButtonElement attributes directly onto motion.button can cause type clashes with properties like onDrag or others.
  // Let's filter out custom props or explicitly cast if needed, or simply map known safe attributes.
  const { type, onClick, id, title, style } = restProps as any;
  const props = { type, onClick, id, title, style };
  const ref = useRef<HTMLElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const shouldReduce = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || shouldReduce || disabled) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    // Stronger magnetic pull
    setPosition({ x: (clientX - centerX) * 0.3, y: (clientY - centerY) * 0.3 });
  };

  const handleMouseLeave = () => setPosition({ x: 0, y: 0 });

  const sizeStyles = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
    icon: 'p-3',
  };

  const variantStyles = {
    premium: 'bg-primary text-black bg-white dark:bg-white dark:text-black font-semibold shadow-glow hover:shadow-xl hover:scale-105',
    primary: 'bg-accent text-black font-bold shadow-lg hover:shadow-xl hover:shadow-accent/20',
    outline: 'border border-border-strong text-text-primary hover:bg-surface hover:border-text-secondary',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface',
  };

  const classes = cn(
    'relative inline-flex items-center justify-center rounded-full transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden',
    sizeStyles[size],
    variantStyles[variant],
    className
  );

  const innerElement = (
    <>
      <span className="relative z-10">{children}</span>
      {variant === 'premium' && (
        <motion.div
          className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
          initial={{ x: '-100%' }}
          whileHover={{ x: '200%' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      )}
    </>
  );

  const animationProps = {
    animate: shouldReduce ? {} : { x: position.x, y: position.y },
    whileHover: shouldReduce || disabled ? {} : { scale: 1.02 },
    whileTap: shouldReduce || disabled ? {} : { scale: 0.95 },
    transition: { type: 'spring' as const, stiffness: 400, damping: 25, mass: 0.5 },
  };

  if (as === 'span') {
    return (
      <motion.span
        ref={ref as React.Ref<HTMLSpanElement>}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(classes, 'cursor-pointer inline-flex')}
        aria-disabled={disabled}
        {...animationProps}
      >
        {innerElement}
      </motion.span>
    );
  }

  return (
    <motion.button
      ref={ref as React.Ref<HTMLButtonElement>}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={classes}
      disabled={disabled}
      {...props}
      {...animationProps}
    >
      {innerElement}
    </motion.button>
  );
};

export default MagneticButton;
