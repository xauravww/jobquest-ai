"use client";

import React from "react";
import { Input } from "antd";
import type { InputProps } from "antd";
import { Lock } from "lucide-react";

export const getPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[^a-zA-Z\d]/.test(password)) strength += 1;
  return Math.min(strength / 5, 1);
};

const strengthLabel = (s: number) => (s < 0.4 ? "Weak" : s < 0.7 ? "Okay" : "Strong");
const strengthColor = (s: number) =>
  s < 0.4 ? "var(--danger)" : s < 0.7 ? "var(--warning)" : "var(--live)";

interface PasswordFieldProps extends Omit<InputProps, "prefix" | "type"> {
  label: string;
  /** Show the strength meter + hint (use on sign-up) */
  showStrength?: boolean;
  /** Right-side slot next to the label, e.g. a "Forgot?" link */
  action?: React.ReactNode;
  error?: string;
}

/**
 * antd Input.Password with a built-in show/hide toggle and an optional strength
 * meter. Reused across sign-in, sign-up, and reset screens.
 */
const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  showStrength = false,
  action,
  value,
  error,
  id,
  ...props
}) => {
  const strength = showStrength ? getPasswordStrength(String(value ?? "")) : 0;
  const hasValue = String(value ?? "").length > 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="text-sm font-medium text-[var(--text-main)]">
          {label}
        </label>
        {action}
      </div>

      <Input.Password
        id={id}
        size="large"
        value={value}
        status={error ? "error" : undefined}
        prefix={<span className="text-[var(--text-dim)] mr-1"><Lock className="w-4 h-4" strokeWidth={1.5} /></span>}
        {...props}
      />

      {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}

      {showStrength && hasValue && (
        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1 h-1 rounded-full bg-[var(--bg-raised)] overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${strength * 100}%`, background: strengthColor(strength) }}
            />
          </div>
          <span className="text-xs text-[var(--text-muted)] w-12 shrink-0">
            {strengthLabel(strength)}
          </span>
        </div>
      )}
      {showStrength && hasValue && strength < 1 && (
        <p className="mt-1 text-xs text-[var(--text-dim)]">
          Use 8+ characters with a mix of cases, numbers, and symbols.
        </p>
      )}
    </div>
  );
};

export default PasswordField;
