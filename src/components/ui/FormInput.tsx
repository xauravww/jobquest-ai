import React from 'react';
import { Input, InputNumber, DatePicker } from 'antd';
import type { InputProps, InputNumberProps } from 'antd';
import dayjs from 'dayjs';

interface FormInputProps extends Omit<InputProps, 'prefix'> {
  icon?: React.ReactNode;
  label?: string;
  error?: string;
}

interface FormInputNumberProps extends Omit<InputNumberProps, 'prefix'> {
  icon?: React.ReactNode;
  label?: string;
  error?: string;
}

interface FormDateInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
}

export const FormInput: React.FC<FormInputProps> = ({ 
  icon, 
  label, 
  error, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-text-muted mb-2">
          {label}
        </label>
      )}
      <Input
        {...props}
        prefix={icon}
        className={`bg-bg-card border-border hover:border-primary focus:border-primary ${error ? 'border-red-500' : ''}`}
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: error ? '#ef4444' : 'var(--border)',
          color: 'var(--text)',
        }}
        styles={{
          input: {
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text)',
          }
        }}
      />
      {error && (
        <span className="text-red-500 text-xs mt-1">{error}</span>
      )}
    </div>
  );
};

export const FormInputNumber: React.FC<FormInputNumberProps> = ({ 
  icon, 
  label, 
  error, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-text-muted mb-2">
          {label}
        </label>
      )}
      <InputNumber
        {...props}
        prefix={icon}
        className={`w-full bg-bg-card border-border hover:border-primary focus:border-primary ${error ? 'border-red-500' : ''}`}
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: error ? '#ef4444' : 'var(--border)',
          color: 'var(--text)',
          width: '100%'
        }}
      />
      {error && (
        <span className="text-red-500 text-xs mt-1">{error}</span>
      )}
    </div>
  );
};

export const FormDateInput: React.FC<FormDateInputProps> = ({ 
  value, 
  onChange, 
  placeholder, 
  label, 
  error, 
  className = '' 
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-text-muted mb-2">
          {label}
        </label>
      )}
      <DatePicker
        value={value ? dayjs(value) : null}
        onChange={(date) => onChange?.(date ? date.format('YYYY-MM-DD') : '')}
        placeholder={placeholder}
        className={`w-full bg-bg-card border-border hover:border-primary focus:border-primary ${error ? 'border-red-500' : ''}`}
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: error ? '#ef4444' : 'var(--border)',
          color: 'var(--text)',
        }}
      />
      {error && (
        <span className="text-red-500 text-xs mt-1">{error}</span>
      )}
    </div>
  );
};