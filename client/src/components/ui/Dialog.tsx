'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}) => {
  // Prevent scrolling behind the modal
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            className={cn(
              'relative w-full max-w-lg glass-panel-strong rounded-2xl p-6 border border-border shadow-2xl z-10 focus:outline-none overflow-y-auto max-h-[90vh]',
              className
            )}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4.5 top-4.5 p-1.5 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-hover transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            {(title || description) && (
              <div className="flex flex-col gap-1 mb-5 pr-8 select-none">
                {title && (
                  <h2 className="text-lg font-bold font-display tracking-tight text-text-primary">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-sm text-text-secondary tracking-tight">
                    {description}
                  </p>
                )}
              </div>
            )}

            {/* Content */}
            <div className="w-full">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

Dialog.displayName = 'Dialog';
