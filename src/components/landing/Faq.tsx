"use client";

import React from "react";
import { faq } from "@/components/landing/content";

const Faq = () => {
  return (
    <section id="questions" className="px-6 py-24 md:py-28">
      <div className="mx-auto w-full max-w-[820px]">
        <h2 className="font-display font-medium text-4xl md:text-5xl tracking-[-0.03em] leading-[1.02] mb-12">
          {faq.heading}
        </h2>
        <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {faq.items.map((item) => (
            <div key={item.q} className="py-6">
              <h3 className="text-xl font-medium text-[var(--text-main)] mb-2">
                {item.q}
              </h3>
              <p className="text-[var(--text-muted)] leading-relaxed max-w-xl">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Faq;
