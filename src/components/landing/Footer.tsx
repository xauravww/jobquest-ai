"use client";

import React from "react";
import Link from "next/link";
import BrandMark from "@/components/ui/BrandMark";
import PrimaryCta from "@/components/landing/PrimaryCta";
import { footer } from "@/components/landing/content";

const Footer = () => {
  return (
    <footer className="px-6 pt-24 pb-10 md:pt-28 border-t border-[var(--border)]">
      <div className="mx-auto w-full max-w-[1280px]">
        {/* Close (row 1) */}
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 items-end pb-16">
          <div>
            <h2 className="font-display font-medium text-4xl md:text-6xl tracking-[-0.045em] leading-[0.98] mb-5">
              {footer.closeHeading}
            </h2>
            <p className="text-lg text-[var(--text-muted)] max-w-xl">
              {footer.closeIntro}
            </p>
          </div>
          <div className="flex lg:justify-end">
            <PrimaryCta size="lg" className="w-full lg:w-auto px-10" />
          </div>
        </div>

        {/* Columns (row 2) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-14 border-t border-[var(--border)] pt-12">
          <div className="col-span-2 md:col-span-1">
            <BrandMark />
            <p className="mt-5 text-sm text-[var(--text-muted)] leading-relaxed max-w-xs">
              {footer.blurb}
            </p>
          </div>

          {footer.columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-medium text-[var(--text-main)] mb-4">
                {col.title}
              </h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Legal */}
        <div className="border-t border-[var(--border)] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-dim)]">
            {footer.legal(new Date().getFullYear())}
          </p>
          <p className="text-sm text-[var(--text-dim)]">
            {footer.disclaimer}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
