'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

// Global emitter pattern for toast notifications
type Listener = (toast: ToastItem) => void;
const listeners = new Set<Listener>();

export const toast = (message: string, options?: { type?: ToastType; duration?: number }) => {
  const id = Math.random().toString(36).substring(2, 9);
  const toastItem: ToastItem = {
    id,
    message,
    type: options?.type || 'info',
    duration: options?.duration || 4000,
  };
  listeners.forEach((listener) => listener(toastItem));
  return id;
};

toast.success = (msg: string, duration?: number) => toast(msg, { type: 'success', duration });
toast.warning = (msg: string, duration?: number) => toast(msg, { type: 'warning', duration });
toast.error = (msg: string, duration?: number) => toast(msg, { type: 'error', duration });
toast.info = (msg: string, duration?: number) => toast(msg, { type: 'info', duration });

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleNewToast = (newToast: ToastItem) => {
      setToasts((prev) => [...prev, newToast]);
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(newToast.id);
        }, newToast.duration);
      }
    };

    listeners.add(handleNewToast);
    return () => {
      listeners.delete(handleNewToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-success shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-warning shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-danger shrink-0" />,
    info: <Info className="w-5 h-5 text-info shrink-0" />,
  };

  const borderColors = {
    success: 'border-l-success',
    warning: 'border-l-warning',
    error: 'border-l-danger',
    info: 'border-l-info',
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none">
      <AnimatePresence>
        {toasts.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 bg-surface-elevated border border-border border-l-4 rounded-xl shadow-xl w-full',
              item.type && borderColors[item.type]
            )}
          >
            {item.type && icons[item.type]}
            <div className="flex-1 text-sm font-semibold tracking-tight text-text-primary mt-0.5 leading-relaxed break-words">
              {item.message}
            </div>
            <button
              onClick={() => removeToast(item.id)}
              className="p-0.5 text-text-tertiary hover:text-text-primary rounded-full hover:bg-surface-hover transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
