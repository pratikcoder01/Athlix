'use client';

import React from 'react';
import { Button } from './Button';
import { Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Inbox className="w-10 h-10 text-text-tertiary" />,
  title,
  description,
  actionText,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-2xl bg-surface/30 max-w-md mx-auto select-none',
        className
      )}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-surface-hover border border-border mb-4 shrink-0 shadow-inner">
        {icon}
      </div>
      <h3 className="text-base font-bold font-display tracking-tight text-text-primary mb-1">
        {title}
      </h3>
      <p className="text-xs text-text-secondary tracking-tight max-w-xs mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

EmptyState.displayName = 'EmptyState';
