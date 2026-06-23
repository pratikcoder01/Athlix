'use client';

import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'ghost';
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = '',
  onClick,
  type = 'button',
  variant,
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const shouldReduce = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || shouldReduce) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    setPosition({ x: (clientX - centerX) * 0.25, y: (clientY - centerY) * 0.25 });
  };

  const handleMouseLeave = () => setPosition({ x: 0, y: 0 });

  const variantClass = variant === 'ghost'
    ? 'border border-border text-text-primary hover:border-border-strong hover:bg-secondary'
    : variant === 'primary'
    ? 'bg-primary text-white shadow-sm hover:brightness-105'
    : '';

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={shouldReduce ? {} : { x: position.x, y: position.y }}
      whileHover={shouldReduce ? {} : { scale: 1.01 }}
      whileTap={shouldReduce ? {} : { scale: 0.98 }}
      transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
      onClick={onClick}
      type={type}
      className={`cursor-pointer inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${variantClass} ${className}`}
    >
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};
export default MagneticButton;
