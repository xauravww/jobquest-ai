import React from 'react';

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

interface FormDateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
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
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
          {label} {required && <span className="text-[var(--danger)] ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary)]">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl px-4 py-2.5 text-white placeholder-[var(--text-dim)] focus:border-[var(--primary)] focus:outline-none transition-all duration-200 ${icon ? 'pl-10' : ''
            } ${error ? 'border-[var(--danger)] focus:border-[var(--danger)]' : ''}`}
        />
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-[var(--danger)]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      {error && (
        <p className="text-[var(--danger)] text-xs mt-2 flex items-center gap-1">
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
          {label} {required && <span className="text-[var(--danger)] ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary)]">
            {icon}
          </div>
        )}
        <input
          type="number"
          {...props}
          className={`w-full bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl px-4 py-2.5 text-white placeholder-[var(--text-dim)] focus:border-[var(--primary)] focus:outline-none transition-all duration-200 ${icon ? 'pl-10' : ''
            } ${error ? 'border-[var(--danger)] focus:border-[var(--danger)]' : ''}`}
        />
      </div>
      {error && (
        <span className="text-[var(--danger)] text-xs mt-1">{error}</span>
      )}
    </div>
  );
};

export const FormDateInput: React.FC<FormDateInputProps> = ({
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
          {label} {required && <span className="text-[var(--danger)] ml-1">*</span>}
        </label>
      )}
      <input
        type="date"
        {...props}
        className={`w-full bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl px-4 py-2.5 text-white placeholder-[var(--text-dim)] focus:border-[var(--primary)] focus:outline-none transition-all duration-200 ${error ? 'border-[var(--danger)] focus:border-[var(--danger)]' : ''
          }`}
      />
      {error && (
        <p className="text-[var(--danger)] text-xs mt-2 flex items-center gap-1">
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
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
          {label} {required && <span className="text-[var(--danger)] ml-1">*</span>}
        </label>
      )}
      <select
        {...props}
        className={`w-full bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl px-4 py-2.5 text-white focus:border-[var(--primary)] focus:outline-none appearance-none transition-all duration-200 ${error ? 'border-[var(--danger)]' : ''
          }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-[var(--danger)] text-xs mt-1">{error}</span>
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
          {label} {required && <span className="text-[var(--danger)] ml-1">*</span>}
        </label>
      )}
      <textarea
        {...props}
        className={`w-full bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl px-4 py-2.5 text-white placeholder-[var(--text-dim)] focus:border-[var(--primary)] focus:outline-none transition-all duration-200 resize-none ${error ? 'border-[var(--danger)] focus:border-[var(--danger)]' : ''
          }`}
      />
      {error && (
        <span className="text-[var(--danger)] text-xs mt-1">{error}</span>
      )}
    </div>
  );
};