"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BrandMark from "@/components/ui/BrandMark";

interface AuthShellProps {
  /** Small heading above the form, e.g. "Welcome back" */
  title: string;
  /** One-line subtitle under the heading */
  subtitle: string;
  /** Left-panel pitch: bold line + supporting line */
  pitchTitle: string;
  pitchBody: string;
  /** Where the back button goes (default: home) */
  backHref?: string;
  children: React.ReactNode;
}

/**
 * Two-column auth layout for Applytron. Left is a quiet brand/pitch panel
 * (hidden on mobile); right holds the form card with a back button on top.
 * Flat, token-based, no gradients.
 */
const AuthShell: React.FC<AuthShellProps> = ({
  title,
  subtitle,
  pitchTitle,
  pitchBody,
  backHref = "/",
  children,
}) => {
  return (
    <div className="min-h-screen bg-[var(--bg-deep)] text-[var(--text-main)] flex">
      {/* Left: brand + pitch */}
      <div className="hidden lg:flex w-1/2 flex-col p-12 border-r border-[var(--border)] bg-[var(--bg-surface)]">
        <BrandMark />

        <div className="flex-1 flex flex-col justify-center max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight mb-4">
            {pitchTitle}
          </h2>
          <p className="text-lg text-[var(--text-muted)] leading-relaxed">{pitchBody}</p>
        </div>

        <p className="font-mono-ui text-xs text-[var(--text-dim)]">
          © {new Date().getFullYear()} Applytron
        </p>
      </div>

      {/* Right: form */}
      <div className="w-full lg:w-1/2 flex flex-col p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          {/* Mobile brand */}
          <div className="lg:hidden">
            <BrandMark size={26} textClass="text-lg" />
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-sm mt-auto lg:my-auto pb-6">
            <div className="mb-6">
              <h1 className="font-display text-3xl font-bold mb-1.5">{title}</h1>
              <p className="text-[var(--text-muted)]">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
