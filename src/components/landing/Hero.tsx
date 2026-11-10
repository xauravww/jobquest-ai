"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import Button from "@/components/ui/Button";
import PrimaryCta from "@/components/landing/PrimaryCta";
import LiveFeed from "@/components/landing/LiveFeed";
import { hero } from "@/components/landing/content";

const Hero = () => {
  const reduce = useReducedMotion();

  const up = (delay: number, distance = 12) => ({
    initial: reduce ? { opacity: 1 } : { opacity: 0, y: distance },
    animate: reduce ? { opacity: 1 } : { opacity: 1, y: 0 },
    transition: {
      duration: 0.52,
      delay,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  });

  return (
    <section
      id="top"
      data-enter
      className="relative px-6 pt-40 pb-24 md:pt-44 md:pb-28 min-h-[100svh] flex items-center"
    >
      <div className="mx-auto w-full max-w-[1280px] grid lg:grid-cols-2 gap-14 lg:gap-16 items-center">
        <div>
          <motion.h1
            {...up(0.05)}
            className="font-display font-medium tracking-[-0.045em] text-5xl sm:text-6xl md:text-[68px] leading-[0.98] mb-6"
          >
            {hero.h1}
          </motion.h1>

          <motion.p
            {...up(0.14)}
            className="text-lg sm:text-xl text-[var(--text-muted)] leading-relaxed max-w-xl mb-10"
          >
            {hero.sub}
          </motion.p>

          <motion.div
            {...up(0.22)}
            className="flex flex-col sm:flex-row gap-4"
          >
            <PrimaryCta size="lg" className="w-full sm:w-auto" />
            <Link href={hero.secondaryHref}>
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                {hero.secondaryCta}
              </Button>
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="lg:pl-4"
        >
          <LiveFeed />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
