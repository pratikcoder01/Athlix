'use client';

import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  glowColor = 'rgba(255, 90, 61, 0.15)',
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isFocused, setIsFocused] = useState(false);
  const shouldReduce = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={(e) => {
        setIsFocused(true);
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsFocused(false);
        props.onMouseLeave?.(e);
      }}
      whileHover={shouldReduce ? {} : { y: -2 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-xl border border-border bg-secondary p-6 shadow-sm transition-colors duration-200 cursor-pointer ${className}`}
      style={{ borderColor: isFocused ? glowColor.replace('0.15', '0.35') : undefined }}
      tabIndex={0}
      role="article"
    >
      {isFocused && !shouldReduce && (
        <div
          className="pointer-events-none absolute -inset-px transition duration-300"
          style={{
            background: `radial-gradient(400px circle at ${coords.x}px ${coords.y}px, ${glowColor}, transparent 80%)`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
export default SpotlightCard;
