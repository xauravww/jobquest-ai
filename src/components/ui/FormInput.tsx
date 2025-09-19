import React from 'react';
import { Input, InputNumber, Select } from 'antd';
import type { InputProps, InputNumberProps, SelectProps } from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface FormInputProps extends Omit<InputProps, 'onChange' | 'prefix'> {
  icon?: React.ReactNode;
  label?: string;
  error?: string;
  required?: boolean;
  onChange?: (value: string) => void;
}

interface FormInputNumberProps extends Omit<InputNumberProps, 'prefix'> {
  icon?: React.ReactNode;
  label?: string;
  error?: string;
  required?: boolean;
}

interface FormDateInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  required?: boolean;
}

interface FormSelectProps extends Omit<SelectProps, 'onChange'> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  onChange?: (value: string) => void;
  required?: boolean;
}

interface FormTextareaProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  rows?: number;
  required?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({ 
  icon, 
  label, 
  error, 
  className = '',
  required = false,
  value = '',
  onChange,
  ...props 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label} {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <Input
          {...props}
          value={value}
          allowClear
          prefix={icon && <span className="text-primary mr-1">{icon}</span>}
          className={`bg-bg-card border-border hover:border-primary focus:border-primary transition-all duration-200 ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'focus:ring-2 focus:ring-primary/20'
          }`}
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: error ? '#ef4444' : 'var(--border)',
            color: 'var(--text)',
            height: '44px',
          }}
          onChange={handleChange}
        />
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export const FormInputNumber: React.FC<FormInputNumberProps> = ({ 
  icon, 
  label, 
  error, 
  className = '',
  required = false,
  ...props 
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <InputNumber
        {...props}
        prefix={icon && <span className="text-primary">{icon}</span>}
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
  className = '',
  required = false
}) => {
  // Check if value is a valid date string
  const dateValue = value && value !== '' && !isNaN(Date.parse(value)) ? value : '';

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label} {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="date"
          value={dateValue}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={`bg-bg-card border border-border hover:border-primary focus:border-primary rounded-lg px-4 py-3 text-text w-full transition-all duration-200 focus:outline-none focus:ring-2 ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:ring-primary/20'
          }`}
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: error ? '#ef4444' : 'var(--border)',
            color: 'var(--text)',
            height: '44px',
          }}
          required={required}
        />
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export const FormSelect: React.FC<FormSelectProps> = ({ 
  label, 
  error, 
  options, 
  onChange, 
  className = '',
  required = false,
  ...props 
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <Select
        {...props}
        onChange={onChange}
        options={options}
        className={`w-full ant-select-dark ${error ? 'border-red-500' : ''}`}
        popupClassName="ant-select-dropdown-dark"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: error ? '#ef4444' : 'var(--border)',
        }}
        dropdownStyle={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
        }}
      />
      {error && (
        <span className="text-red-500 text-xs mt-1">{error}</span>
      )}
    </div>
  );
};

export const FormTextarea: React.FC<FormTextareaProps> = ({ 
  value, 
  onChange, 
  placeholder, 
  label, 
  error, 
  className = '',
  rows = 3,
  required = false
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <TextArea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`bg-bg-card border-border hover:border-primary focus:border-primary ${error ? 'border-red-500' : ''}`}
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