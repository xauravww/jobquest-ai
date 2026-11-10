"use client";

import React from "react";
import SectionHeading from "@/components/landing/SectionHeading";
import StatusChip, { type AppStatus } from "@/components/landing/StatusChip";
import TimelineStep from "@/components/landing/TimelineStep";
import { ICONS } from "@/components/landing/icons";
import { appFrame } from "@/components/landing/content";

const AppFrame = () => {
  return (
    <section id="app-frame" className="px-6 py-24 md:py-28">
      <div className="mx-auto w-full max-w-[1280px]">
        <SectionHeading
          side
          heading={appFrame.heading}
          intro={appFrame.intro}
        />

        <div
          role="img"
          aria-label={appFrame.windowLabel}
          className="rounded-2xl border border-[var(--border)] overflow-hidden shadow-2xl shadow-black/40 bg-[var(--bg-surface)] grid lg:grid-cols-[5fr_7fr]"
        >
          {/* List pane */}
          <div className="border-b lg:border-b-0 lg:border-r border-[var(--border)] min-h-[320px] lg:min-h-[520px]">
            <div className="px-5 py-3.5 border-b border-[var(--border)] bg-[var(--bg-raised)]">
              <span className="font-mono-ui text-xs tracking-widest text-[var(--text-muted)] uppercase">
                {appFrame.listLabel}
              </span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {appFrame.rows.map((row) => (
                <div
                  key={row.co}
                  className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-[var(--bg-raised)] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 shrink-0 rounded-lg bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center font-semibold text-[var(--text-muted)]">
                      {row.co[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--text-main)] truncate">
                        {row.role}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] truncate">
                        {row.co} · {row.sub}
                      </div>
                    </div>
                  </div>
                  <StatusChip status={row.status as AppStatus} />
                </div>
              ))}
            </div>
          </div>

          {/* Open pane */}
          <div className="flex flex-col min-h-[320px] lg:min-h-[520px]">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-raised)] flex items-center justify-between">
              <div>
                <div className="text-[15px] font-medium text-[var(--text-main)]">
                  {appFrame.openRole}
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {appFrame.openCompany}
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full border border-[var(--accent)] text-[var(--accent)] font-medium">
                {appFrame.openStatus}
              </span>
            </div>
            <div className="p-6 flex-1">
              <ul className="space-y-1">
                {appFrame.timeline.map((step) => (
                  <TimelineStep
                    key={step.label}
                    icon={ICONS[step.icon]}
                    label={step.label}
                    done={step.done}
                  />
                ))}
              </ul>
            </div>
            <div className="px-6 py-3.5 border-t border-[var(--border)] bg-[var(--bg-raised)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--live)]" />
              <span className="font-mono-ui text-xs text-[var(--text-muted)]">
                {appFrame.queue}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppFrame;
