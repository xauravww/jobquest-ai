"use client";

import React from "react";
import SectionHeading from "@/components/landing/SectionHeading";
import { ICONS } from "@/components/landing/icons";
import { features } from "@/components/landing/content";

const Features = () => {
  return (
    <section id="features" className="px-6 py-24 md:py-28">
      <div className="mx-auto w-full max-w-[1280px]">
        <SectionHeading heading={features.heading} intro={features.intro} />

        <div className="grid gap-4 md:grid-cols-3">
          {features.steps.map((step) => {
            const Icon = ICONS[step.icon];
            return (
              <div
                key={step.n}
                className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 flex flex-col gap-5 transition-all duration-200 hover:-translate-y-[2px] hover:border-[var(--border-strong)]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono-ui text-4xl font-medium text-[var(--accent)] leading-none">
                    {step.n}
                  </span>
                  <Icon className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-normal mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[var(--text-muted)] leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
