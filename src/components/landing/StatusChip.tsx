import React from "react";
import { cn } from "@/lib/utils";

export type AppStatus = "t" | "a" | "f";

const STATUS_META: Record<AppStatus, { label: string; cls: string }> = {
  t: { label: "Tailored", cls: "text-[var(--text-muted)] border-[var(--border-strong)] bg-[rgba(255,255,255,0.02)]" },
  a: { label: "Applied", cls: "text-[var(--live)] border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.08)]" },
  f: { label: "Follow-up", cls: "text-[var(--text-main)] border-[var(--border-strong)] bg-[rgba(255,255,255,0.04)]" },
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
