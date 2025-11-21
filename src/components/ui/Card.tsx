"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hoverEffect?: boolean;
    glow?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, children, hoverEffect = true, glow = false, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative rounded-2xl p-6 overflow-hidden",
        "bg-[var(--bg-glass)] backdrop-blur-xl border border-[var(--border-glass)]",
        hoverEffect && "hover:border-[var(--border-glass-hover)] hover:bg-white/5 hover:-translate-y-1 transition-all duration-200",
        glow && "shadow-[0_0_40px_rgba(0,242,255,0.1)]",
        className
      )}
      {...props}
    >
                {/* Glass reflection effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="relative z-10">{children}</div>
    </div>
  );
    }
);

Card.displayName = "Card";

export default Card;
