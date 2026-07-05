"use client";

import React from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

interface BrandMarkProps {
  /** Icon box size in px */
  size?: number;
  /** Text size class for the wordmark; pass "" to hide the word */
  textClass?: string;
  /** Wrap in a link to a destination (default "/"); pass null for no link */
  href?: string | null;
  className?: string;
}

/**
 * Applytron brand mark: a flat coral tile with a bolt, plus the wordmark in the
 * display face. One source of truth so every surface uses the same logo instead
 * of the old off-palette raster image.
 */
const BrandMark: React.FC<BrandMarkProps> = ({
  size = 32,
  textClass = "text-xl",
  href = "/",
  className = "",
}) => {
  const inner = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] text-[#0e1116] shrink-0"
        style={{ width: size, height: size }}
      >
        <Zap style={{ width: size * 0.55, height: size * 0.55 }} fill="currentColor" strokeWidth={0} />
      </span>
      {textClass && (
        <span className={`font-display font-bold text-[var(--text-main)] ${textClass}`}>
          Applytron
        </span>
      )}
    </span>
  );

  if (href === null) return inner;
  return (
    <Link href={href} className="w-fit">
      {inner}
    </Link>
  );
};

export default BrandMark;
