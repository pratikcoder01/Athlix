'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Section: React.FC<SectionProps> = ({
  className,
  size = 'md',
  children,
  ...props
}) => {
  const paddingClasses = {
    sm: 'py-8 md:py-12',
    md: 'py-12 md:py-20',
    lg: 'py-16 md:py-28',
    xl: 'py-20 md:py-36',
  };

  return (
    <section
      className={cn(
        'relative w-full overflow-hidden',
        paddingClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
};

Section.displayName = 'Section';
