'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  glowColor,
  ...props
}) => {
  // Retain the legacy option for callers without forwarding it to the DOM.
  void glowColor;

  return (
    <div
      {...props}
      className={cn('relative overflow-hidden rounded-sm border border-border bg-surface p-6', className)}
    >
      {children}
    </div>
  );
};
export default SpotlightCard;
