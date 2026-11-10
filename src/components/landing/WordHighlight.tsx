"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { moment } from "@/components/landing/content";

const Line = ({ children }: { children: React.ReactNode }) => (
  <span className="block">{children}</span>
);

const WordHighlight = () => {
  const reduce = useReducedMotion();

  const word = (delay: number) => ({
    initial: reduce ? { color: "var(--accent)" } : { color: "var(--text-dim)" },
    whileInView: { color: "var(--accent)" },
    viewport: { once: true },
    transition: { duration: 0.5, delay, ease: "easeOut" as const },
  });

  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto w-full max-w-[900px] text-center">
        <h2 className="font-display font-medium text-4xl md:text-5xl tracking-[-0.03em] leading-[1.02] mb-8">
          {moment.heading}
        </h2>
        <p className="font-display font-medium text-3xl md:text-5xl leading-tight tracking-[-0.02em] text-[var(--text-main)]">
          <Line>
            {moment.lead}{" "}
            <motion.span {...word(0)}>{moment.highlightA}</motion.span>
            {moment.mid}
            <motion.span {...word(0.4)}>{moment.highlightB}</motion.span>
            {moment.close}
          </Line>
        </p>
        <p className="mt-8 text-lg text-[var(--text-muted)] max-w-xl mx-auto">
          {moment.sub}
        </p>
      </div>
    </section>
  );
};

export default WordHighlight;
