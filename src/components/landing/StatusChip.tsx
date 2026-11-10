import React from "react";
import { cn } from "@/lib/utils";

export type AppStatus = "t" | "a" | "f";

const STATUS_META: Record<AppStatus, { label: string; cls: string }> = {
  t: { label: "Tailored", cls: "text-[var(--text-muted)] border-[var(--border-strong)]" },
  a: { label: "Applied", cls: "text-[var(--accent)] border-[var(--accent)]" },
  f: { label: "Follow-up", cls: "text-[var(--text-main)] border-[var(--border-strong)]" },
};

const StatusChip = ({ status }: { status: AppStatus }) => {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "shrink-0 text-xs px-2.5 py-1 rounded-full border font-medium",
        meta.cls
      )}
    >
      {meta.label}
    </span>
  );
};

export default StatusChip;
