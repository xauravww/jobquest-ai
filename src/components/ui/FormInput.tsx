import React from 'react';
import { Select, DatePicker } from 'antd';
import dayjs from 'dayjs';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label?: string;
  error?: string;
  required?: boolean;
}

interface FormInputNumberProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label?: string;
  error?: string;
  required?: boolean;
}

interface FormDateInputProps {
  label?: string;
  error?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

interface FormSelectProps {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

const inputBase =
  'w-full bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg px-4 text-[var(--text-main)] placeholder-[var(--text-dim)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-200';

const errorBorder = 'border-[var(--accent-dim)] focus:border-[var(--accent-dim)]';

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
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
          {label} {required && <span className="text-[var(--accent)] ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent)]">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`${inputBase} h-8 ${icon ? 'pl-10' : ''} ${error ? errorBorder : ''}`}
        />
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-[var(--accent-dim)]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      {error && (
        <p className="text-[var(--accent-dim)] text-xs mt-2 flex items-center gap-1">
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
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
          {label} {required && <span className="text-[var(--accent)] ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent)]">
            {icon}
          </div>
        )}
        <input
          type="number"
          {...props}
          className={`${inputBase} h-8 ${icon ? 'pl-10' : ''} ${error ? errorBorder : ''}`}
        />
      </div>
      {error && (
        <span className="text-[var(--accent-dim)] text-xs mt-1">{error}</span>
      )}
    </div>
  );
};

export const FormDateInput: React.FC<FormDateInputProps> = ({
  label,
  error,
  className = '',
  required = false,
  value,
  onChange,
  disabled,
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
          {label} {required && <span className="text-[var(--accent)] ml-1">*</span>}
        </label>
      )}
      <DatePicker
        value={value ? dayjs(value) : null}
        onChange={(d) => onChange?.(d ? d.format('YYYY-MM-DD') : '')}
        disabled={disabled}
        status={error ? 'error' : undefined}
        className="w-full"
      />
      {error && (
        <p className="text-[var(--accent-dim)] text-xs mt-2 flex items-center gap-1">
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
  className = '',
  required = false,
  value,
  onChange,
  placeholder,
  disabled,
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
          {label} {required && <span className="text-[var(--accent)] ml-1">*</span>}
        </label>
      )}
      <Select
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
        status={error ? 'error' : undefined}
        className="w-full"
      />
      {error && (
        <span className="text-[var(--accent-dim)] text-xs mt-1">{error}</span>
      )}
    </div>
  );
};

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  error,
  className = '',
  required = false,
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
          {label} {required && <span className="text-[var(--accent)] ml-1">*</span>}
        </label>
      )}
      <textarea
        {...props}
        className={`${inputBase} resize-none py-2 ${error ? errorBorder : ''}`}
      />
      {error && (
        <span className="text-[var(--accent-dim)] text-xs mt-1">{error}</span>
      )}
    </div>
  );
};
