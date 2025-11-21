"use client";

import React from "react";
import { Twitter, Github, Linkedin, Instagram } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const Footer = () => {
    return (
        <footer className="bg-[#020010] border-t border-white/10 pt-20 pb-10">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg overflow-hidden">
                                <Image src="/logo.png" alt="Applytron Logo" width={32} height={32} className="object-contain" />
                            </div>
                            <span className="text-xl font-bold text-white">Applytron</span>
                        </Link>
                        <p className="text-gray-400 mb-6">
                            The next-generation job search platform powered by advanced AI.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-gray-500 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                            <a href="#" className="text-gray-500 hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
                            <a href="#" className="text-gray-500 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
                            <a href="#" className="text-gray-500 hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6">Product</h4>
                        <ul className="space-y-4">
                            <li><Link href="#features" className="text-gray-400 hover:text-indigo-400 transition-colors">Features</Link></li>
                            <li><Link href="#pricing" className="text-gray-400 hover:text-indigo-400 transition-colors">Pricing</Link></li>
                            <li><Link href="#testimonials" className="text-gray-400 hover:text-indigo-400 transition-colors">Testimonials</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">Integration</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6">Resources</h4>
                        <ul className="space-y-4">
                            <li><Link href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">Blog</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">Community</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">Help Center</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">API Docs</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6">Legal</h4>
                        <ul className="space-y-4">
                            <li><Link href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">Terms of Service</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="text-center mt-12 mb-8">
                    <p className="text-gray-300 text-lg">
                        Join thousands of professionals who have accelerated their careers with Applytron
                    </p>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} Applytron. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <span className="flex items-center gap-2 text-gray-500 text-sm">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Systems Operational
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
