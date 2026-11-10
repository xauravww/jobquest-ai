"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hoverEffect?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, children, hoverEffect = true, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative rounded-2xl p-6 overflow-hidden",
        "bg-[var(--bg-glass)] backdrop-blur-xl border border-[var(--border-glass)]",
        hoverEffect && "hover:border-[var(--border-glass-hover)] hover:bg-white/5 hover:-translate-y-1 transition-all duration-200",
        className
      )}
      {...props}
    >
        <div className="relative z-10">{children}</div>
    </div>
  );
    }
);

Card.displayName = "Card";

export default Card;
