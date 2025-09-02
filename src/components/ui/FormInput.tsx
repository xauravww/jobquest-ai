import React from 'react';
import { Input, InputNumber, DatePicker, Select } from 'antd';
import type { InputProps, InputNumberProps, SelectProps } from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface FormInputProps extends Omit<InputProps, 'prefix'> {
  icon?: React.ReactNode;
  label?: string;
  error?: string;
  required?: boolean;
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
  ...props 
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <Input
        {...props}
        prefix={icon && <span className="text-primary">{icon}</span>}
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
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label} {required && <span className="text-red-500">*</span>}
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