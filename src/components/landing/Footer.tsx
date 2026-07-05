"use client";

import React from "react";
import Link from "next/link";
import BrandMark from "@/components/ui/BrandMark";

const Footer = () => {
    return (
        <footer className="bg-[var(--bg-deep)] border-t border-[var(--border)] pt-16 pb-10">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-14">
                    <div>
                        <div className="mb-5">
                            <BrandMark />
                        </div>
                        <p className="text-[var(--text-muted)] text-sm leading-relaxed max-w-xs">
                            Applytron tailors your resume, applies for you, and follows up on time. You stay in control.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-[var(--text-main)] font-bold mb-5">Product</h4>
                        <ul className="space-y-3">
                            <li><Link href="#features" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors text-sm">Features</Link></li>
                            <li><Link href="#dashboard-preview" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors text-sm">Dashboard</Link></li>
                            <li><Link href="/auth/signup" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors text-sm">Get started</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[var(--text-main)] font-bold mb-5">Account</h4>
                        <ul className="space-y-3">
                            <li><Link href="/auth/signin" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors text-sm">Sign in</Link></li>
                            <li><Link href="/auth/signup" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors text-sm">Create account</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-[var(--border)] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[var(--text-dim)] text-sm">
                        © {new Date().getFullYear()} Applytron. All rights reserved.
                    </p>
                    <span className="flex items-center gap-2 text-[var(--text-dim)] text-sm">
                        <span className="w-2 h-2 rounded-full bg-[var(--live)] animate-pulse"></span>
                        Systems operational
                    </span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
