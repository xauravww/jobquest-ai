import React from "react";
import { cn } from "@/lib/utils";

type TimelineStepProps = {
  icon: React.ElementType;
  label: string;
  done: boolean;
};

const TimelineStep = ({ icon: Icon, label, done }: TimelineStepProps) => (
  <li className="flex items-center gap-3 py-2.5">
    <span
      className={cn(
        "w-9 h-9 shrink-0 rounded-lg border flex items-center justify-center",
        done
          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
          : "border-[var(--border-strong)] text-[var(--text-dim)]"
      )}
    >
      <Icon className="w-4 h-4" />
    </span>
    <span
      className={cn(
        "text-sm",
        done ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"
      )}
    >
      {label}
    </span>
  </li>
);

export default TimelineStep;
