'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  anchor?: 'left' | 'right' | 'top' | 'bottom';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  anchor = 'right',
  title,
  children,
  className,
}) => {
  // Prevent background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const slideVariants = {
    left: {
      initial: { x: '-100%' },
      animate: { x: 0 },
      exit: { x: '-100%' },
    },
    right: {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' },
    },
    top: {
      initial: { y: '-100%' },
      animate: { y: 0 },
      exit: { y: '-100%' },
    },
    bottom: {
      initial: { y: '100%' },
      animate: { y: 0 },
      exit: { y: '100%' },
    },
  };

  const containerClasses = {
    left: 'left-0 inset-y-0 h-full w-full max-w-sm border-r',
    right: 'right-0 inset-y-0 h-full w-full max-w-sm border-l',
    top: 'top-0 inset-x-0 w-full max-h-[80vh] border-b',
    bottom: 'bottom-0 inset-x-0 w-full max-h-[80vh] border-t',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Drawer Body */}
          <motion.div
            initial={slideVariants[anchor].initial}
            animate={slideVariants[anchor].animate}
            exit={slideVariants[anchor].exit}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className={cn(
              'absolute bg-surface-elevated border-border shadow-2xl flex flex-col',
              containerClasses[anchor],
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border select-none">
              {title ? (
                <h3 className="text-base font-bold font-display tracking-tight text-text-primary">
                  {title}
                </h3>
              ) : (
                <div />
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-hover transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

Drawer.displayName = 'Drawer';
