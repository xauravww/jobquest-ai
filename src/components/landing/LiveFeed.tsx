"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, FileText, Send } from "lucide-react";

type Row = {
  time: string;
  action: "Applied" | "Tailored" | "Follow-up";
  company: string;
};

// Static reel: deterministic order, no Math.random (keeps SSR/CSR stable).
const REEL: Row[] = [
  { time: "14:22", action: "Applied", company: "Veyra" },
  { time: "14:19", action: "Tailored", company: "Halden" },
  { time: "14:17", action: "Applied", company: "Marcove" },
  { time: "14:14", action: "Follow-up", company: "Kinfolk" },
  { time: "14:11", action: "Applied", company: "Osprey" },
  { time: "14:07", action: "Tailored", company: "Rambolt" },
  { time: "14:03", action: "Applied", company: "Brightwell" },
  { time: "13:58", action: "Follow-up", company: "Far Point" },
];

const ACTION_META: Record<Row["action"], { icon: React.ElementType; cls: string }> = {
  Applied: { icon: CheckCircle2, cls: "text-[var(--live)]" },
  Tailored: { icon: FileText, cls: "text-[var(--text-main)]" },
  "Follow-up": { icon: Send, cls: "text-[var(--text-muted)]" },
};

export default function LiveFeed() {
  // Reveal rows one by one on mount. Reduced-motion users get them all at once.
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      setVisible(REEL.length);
      return;
    }

    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setVisible(i);
      if (i >= REEL.length) clearInterval(id);
    }, 260);
    return () => clearInterval(id);
  }, []);

  const applied = 87;
  const queue = 42;
  const progress = Math.round((applied / (applied + queue)) * 100);

  return (
    <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl shadow-black/40 overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center justify-between h-11 px-4 border-b border-[var(--border)] bg-[var(--bg-raised)]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[var(--border-strong)]" />
            <span className="w-3 h-3 rounded-full bg-[var(--border-strong)]" />
            <span className="w-3 h-3 rounded-full bg-[var(--border-strong)]" />
          </div>
          <span className="font-mono-ui text-xs tracking-widest text-[var(--text-muted)] uppercase">
            applytron / activity
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--live)] animate-pulse" />
          <span className="font-mono-ui text-[11px] tracking-widest text-[var(--live)] uppercase">
            Live
          </span>
        </div>
      </div>

      {/* Feed rows */}
      <div className="divide-y divide-[var(--border)]">
        {REEL.map((row, i) => {
          const { icon: Icon, cls } = ACTION_META[row.action];
          const shown = i < visible;
          return (
            <div
              key={`${row.time}-${row.company}`}
              className="flex items-center gap-4 px-4 py-3 transition-all duration-300"
              style={{
                opacity: shown ? 1 : 0,
                transform: shown ? "translateY(0)" : "translateY(6px)",
              }}
            >
              <span className="font-mono-ui text-xs text-[var(--text-dim)] w-12 shrink-0">
                {row.time}
              </span>
              <Icon className={`w-4 h-4 shrink-0 ${cls}`} />
              <span className="font-mono-ui text-sm text-[var(--text-muted)] w-20 shrink-0">
                {row.action}
              </span>
              <span className="text-sm font-medium text-[var(--text-main)] truncate">
                {row.company}
              </span>
            </div>
          );
        })}
      </div>

      {/* Queue footer */}
      <div className="px-4 py-4 border-t border-[var(--border)] bg-[var(--bg-raised)]">
        <div className="flex items-center justify-between mb-2 font-mono-ui text-xs">
          <span className="text-[var(--text-muted)] uppercase tracking-widest">
            Queue
          </span>
          <span className="text-[var(--text-main)]">
            {applied} sent · {queue} pending
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[var(--bg-deep)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
