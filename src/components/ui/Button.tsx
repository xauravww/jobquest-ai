"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "glass" | "danger" | "white";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary:
        "bg-[#f0f2f5] text-[#08090a] font-semibold border border-transparent hover:bg-[#d4d8e0]",
      secondary:
        "bg-[var(--bg-raised)] border border-[var(--border-strong)] text-[var(--text-main)] hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.25)]",
      ghost:
        "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-raised)]",
      glass:
        "bg-[var(--bg-glass)] backdrop-blur-md border border-[var(--border-glass)] text-[var(--text-main)] hover:border-[var(--border-glass-hover)]",
      danger:
        "bg-[var(--danger)] text-white border border-transparent hover:opacity-90",
      white:
        "bg-[#ffffff] text-[#08090a] border border-transparent hover:bg-[#eaeaea]",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden active:opacity-90",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <span className={cn("flex items-center gap-2", isLoading && "opacity-0")}>
          {leftIcon && <span>{leftIcon}</span>}
          {children}
          {rightIcon && <span>{rightIcon}</span>}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;