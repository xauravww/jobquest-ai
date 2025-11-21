"use client";

import React from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { ArrowRight, Sparkles, Search, Zap } from "lucide-react";
import Image from "next/image";

const Hero = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-[var(--primary)] opacity-10 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-[var(--secondary)] opacity-10 blur-[100px] rounded-full" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm"
                    >
                        <span className="flex h-2 w-2 rounded-full bg-[var(--success)] animate-pulse" />
                        <span className="text-sm font-medium text-[var(--text-muted)]">
                            AI-Powered Job Search 2.0
                        </span>
                    </motion.div>

                    {/* Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
                    >
                        Find Your <span className="text-gradient-primary">Dream Job</span>
                        <br />
                        at <span className="text-gradient-secondary">Warp Speed</span>
                    </motion.h1>

                    {/* Subheading */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg md:text-xl text-[var(--text-muted)] mb-10 max-w-2xl"
                    >
                        Stop scrolling through endless listings. Our AI analyzes your profile and matches you with opportunities that actually fit your career goals.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
                    >
                        <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                            Start Your Quest
                        </Button>
                        <Button variant="white" size="lg" leftIcon={<Zap className="w-5 h-5" />}>
                            View Demo
                        </Button>
                    </motion.div>

                    {/* Dashboard Preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 40, rotateX: 20 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="mt-20 relative w-full max-w-6xl perspective-1000"
                    >
                        <div className="relative rounded-xl border border-[var(--border-glass)] bg-[var(--bg-glass)] backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-2">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-xl pointer-events-none" />
                            <Image
                                src="/make-data-drive-analytics.png"
                                alt="JobQuest Dashboard"
                                width={1200}
                                height={675}
                                className="rounded-lg w-full h-auto"
                                priority
                            />

                            {/* Floating Elements */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -top-10 -left-10 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-glass)] shadow-xl hidden md:block"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">98% Match</div>
                                        <div className="text-xs text-[var(--text-muted)]">Senior Developer</div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute -bottom-10 -right-10 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-glass)] shadow-xl hidden md:block"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <Search className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">Auto-Applied</div>
                                        <div className="text-xs text-[var(--text-muted)]">Just now</div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
