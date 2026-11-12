'use client';

import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md';
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  size = 'md',
}) => {
  const isSm = size === 'sm';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label || (checked ? 'Enabled' : 'Disabled')}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex shrink-0 items-center transition-colors duration-200 ease-in-out rounded-full border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-deep)] ${
        isSm ? 'w-9 h-5' : 'w-11 h-6'
      } ${
        checked
          ? 'bg-[var(--accent)] border-[var(--accent)]'
          : 'bg-[var(--bg-raised)] border-[var(--border-strong)]'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-[rgba(255,255,255,0.3)]'}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block transform rounded-full transition duration-200 ease-in-out ${
          isSm ? 'w-4 h-4' : 'w-5 h-5'
        } ${
          checked
            ? `${isSm ? 'translate-x-4' : 'translate-x-5'} bg-[#08090a] shadow-sm`
            : 'translate-x-0.5 bg-[var(--text-muted)]'
        }`}
      />
    </button>
  );
};

export default Toggle;
