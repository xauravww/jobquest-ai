import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '', text }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-border border-t-primary ${sizeClasses[size]}`} />
      {text && (
        <p className={`text-text-muted ${textSizeClasses[size]} animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );
};

// Skeleton component for better loading states
export const Skeleton: React.FC<{ className?: string; children?: React.ReactNode }> = ({ 
  className = '', 
  children 
}) => (
  <div className={`animate-pulse bg-bg-light rounded ${className}`}>
    {children}
  </div>
);

// Card skeleton for consistent loading states
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-bg-card rounded-xl border border-border p-6 ${className}`}>
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-bg-light rounded-lg"></div>
        <div className="h-4 bg-bg-light rounded w-24"></div>
      </div>
      <div className="h-8 bg-bg-light rounded w-16"></div>
      <div className="space-y-2">
        <div className="h-3 bg-bg-light rounded w-full"></div>
        <div className="h-3 bg-bg-light rounded w-3/4"></div>
      </div>
    </div>
  </div>
);

export default LoadingSpinner;