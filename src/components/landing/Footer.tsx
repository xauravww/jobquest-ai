"use client";

import React from "react";
import { Twitter, Github, Linkedin, Instagram } from "lucide-react";
import Link from "next/link";
import BrandMark from "@/components/ui/BrandMark";

const Footer = () => {
    return (
        <footer className="bg-[var(--bg-deep)] border-t border-[var(--border)] pt-20 pb-10">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1">
                        <div className="mb-6">
                            <BrandMark />
                        </div>
                        <p className="text-[var(--text-muted)] mb-6">
                            The next-generation job search platform powered by advanced AI.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors"><Twitter className="w-5 h-5" /></a>
                            <a href="#" className="text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors"><Github className="w-5 h-5" /></a>
                            <a href="#" className="text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors"><Linkedin className="w-5 h-5" /></a>
                            <a href="#" className="text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors"><Instagram className="w-5 h-5" /></a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-[var(--text-main)] font-bold mb-6">Product</h4>
                        <ul className="space-y-4">
                            <li><Link href="#features" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">Features</Link></li>
                            <li><Link href="#pricing" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">Pricing</Link></li>
                            <li><Link href="#testimonials" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">Testimonials</Link></li>
                            <li><Link href="#" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">Integration</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[var(--text-main)] font-bold mb-6">Resources</h4>
                        <ul className="space-y-4">
                            <li><Link href="#" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">Blog</Link></li>
                            <li><Link href="#" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">Community</Link></li>
                            <li><Link href="#" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">Help Center</Link></li>
                            <li><Link href="#" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">API Docs</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[var(--text-main)] font-bold mb-6">Legal</h4>
                        <ul className="space-y-4">
                            <li><Link href="#" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">Terms of Service</Link></li>
                            <li><Link href="#" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="text-center mt-12 mb-8">
                    <p className="text-[var(--text-muted)] text-lg">
                        Join thousands of professionals who have accelerated their careers with Applytron
                    </p>
                </div>

                <div className="border-t border-[var(--border)] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[var(--text-dim)] text-sm">
                        © {new Date().getFullYear()} Applytron. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <span className="flex items-center gap-2 text-[var(--text-dim)] text-sm">
                            <span className="w-2 h-2 rounded-full bg-[var(--live)] animate-pulse"></span>
                            Systems Operational
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
