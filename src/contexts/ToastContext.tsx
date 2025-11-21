'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastData } from '@/components/ui/Toast';

interface ToastContextType {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastData = {
      id,
      ...toast,
    };

    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string, title?: string, duration?: number) => {
    addToast({
      type: 'success',
      message,
      title,
      duration,
    });
  }, [addToast]);

  const error = useCallback((message: string, title?: string, duration?: number) => {
    addToast({
      type: 'error',
      message,
      title,
      duration,
    });
  }, [addToast]);

  const warning = useCallback((message: string, title?: string, duration?: number) => {
    addToast({
      type: 'warning',
      message,
      title,
      duration,
    });
  }, [addToast]);

  const info = useCallback((message: string, title?: string, duration?: number) => {
    addToast({
      type: 'info',
      message,
      title,
      duration,
    });
  }, [addToast]);

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};