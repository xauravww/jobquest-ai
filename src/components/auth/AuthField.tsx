"use client";

import React from "react";
import { Input } from "antd";
import type { InputProps } from "antd";

interface AuthFieldProps extends Omit<InputProps, "prefix"> {
  label: string;
  icon?: React.ReactNode;
  /** Right-side slot next to the label, e.g. a "Forgot?" link */
  action?: React.ReactNode;
  error?: string;
}

/**
 * One labeled antd Input for the auth screens. allowClear on, leading icon,
 * optional right-aligned action next to the label. Themed via ConfigProvider.
 */
const AuthField: React.FC<AuthFieldProps> = ({ label, icon, action, error, id, ...props }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="text-sm font-medium text-[var(--text-main)]">
          {label}
        </label>
        {action}
      </div>
      <Input
        id={id}
        size="large"
        allowClear
        status={error ? "error" : undefined}
        prefix={icon ? <span className="text-[var(--text-dim)] mr-1">{icon}</span> : undefined}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
};

export default AuthField;
