"use client";

import React from "react";
import SectionHeading from "@/components/landing/SectionHeading";
import { ICONS } from "@/components/landing/icons";
import { pipeline } from "@/components/landing/content";

const PipelineDiagram = () => {
  return (
    <section className="px-6 py-24 md:py-28">
      <div className="mx-auto w-full max-w-[1280px]">
        <SectionHeading heading={pipeline.heading} intro={pipeline.intro} />

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 md:p-10">
          {/* Hub row */}
          <div className="grid md:grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-6 mb-10">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)]">
                <span className="w-2 h-2 rounded-full bg-[var(--live)]" />
                <span className="text-sm font-medium text-[var(--text-main)]">
                  {pipeline.input}
                </span>
              </div>
            </div>

            <div className="hidden md:block pulse-line group w-16">
              <span className="pulse-dot" />
            </div>

            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent)] text-[#0e1116] font-semibold">
                <span className="text-sm">{pipeline.hub}</span>
              </div>
            </div>

            <div className="hidden md:block pulse-line group w-16">
              <span className="pulse-dot" />
            </div>

            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)]">
                <span className="w-2 h-2 rounded-full bg-[var(--live)]" />
                <span className="text-sm font-medium text-[var(--text-main)]">
                  {pipeline.tracker}
                </span>
              </div>
            </div>
          </div>

          {/* Three parallel lanes */}
          <div className="grid gap-3 md:grid-cols-3">
            {pipeline.lanes.map((lane) => {
              const Icon = ICONS[lane.icon];
              return (
                <div
                  key={lane.label}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] p-5 flex items-start gap-4 group"
                >
                  <span className="w-10 h-10 shrink-0 rounded-lg border border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="text-[15px] font-medium text-[var(--text-main)]">
                      {lane.label}
                    </div>
                    <div className="text-sm text-[var(--text-muted)]">
                      {lane.sub}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PipelineDiagram;
