'use client';

import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Avatar: React.FC<AvatarProps> = ({
  className,
  src,
  alt = 'Avatar',
  fallback = 'U',
  size = 'md',
  ...props
}) => {
  const [error, setError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px] font-bold',
    sm: 'w-8 h-8 text-xs font-bold',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-12 h-12 text-base font-semibold',
    xl: 'w-16 h-16 text-xl font-bold',
    '2xl': 'w-24 h-24 text-3xl font-extrabold',
  };

  const getInitials = (text: string) => {
    return text
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full overflow-hidden bg-surface-hover border border-border select-none shrink-0 text-text-secondary font-display font-medium',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && !error ? (
        <img
          src={src}
          alt={alt}
          onError={() => setError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <span>{getInitials(fallback)}</span>
      )}
    </div>
  );
};

Avatar.displayName = 'Avatar';
