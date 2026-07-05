"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
    {
        name: "Aarav Sharma",
        role: "Product Designer",
        content: "Applytron helped me land 3 interviews in my first week. The resume tailoring is incredible.",
        highlight: "3 interviews, week one",
    },
    {
        name: "Priya Patel",
        role: "Software Engineer",
        content: "I went from zero responses to multiple offers. This is a genuine game-changer for job seekers.",
        highlight: "0 to multiple offers",
    },
    {
        name: "Rohan Gupta",
        role: "Marketing Manager",
        content: "The automated follow-ups kept me organized and professional without any extra effort.",
        highlight: "Follow-ups on autopilot",
    },
    {
        name: "Ananya Singh",
        role: "Data Analyst",
        content: "Best investment in my career. The AI actually understands what recruiters want to see.",
        highlight: "It gets recruiters",
    },
];

const Testimonials = () => {
    return (
        <section id="testimonials" className="px-6 py-24 border-t border-[var(--border)]">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="text-center max-w-2xl mx-auto mb-14"
                >
                    <span className="font-mono-ui text-xs tracking-[0.2em] uppercase text-[var(--text-muted)]">
                        Field reports
                    </span>
                    <h2 className="font-display text-3xl md:text-4xl font-bold mt-3">
                        Real stories, real offers
                    </h2>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-4">
                    {testimonials.map((t, index) => (
                        <motion.div
                            key={t.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.08 }}
                            viewport={{ once: true }}
                            className="p-7 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]"
                        >
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-mono-ui text-xs mb-5">
                                {t.highlight}
                            </div>

                            <blockquote className="text-lg text-[var(--text-main)] leading-relaxed mb-6">
                                &ldquo;{t.content}&rdquo;
                            </blockquote>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center font-semibold text-[var(--text-main)]">
                                        {t.name.split(" ").map((n) => n[0]).join("")}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold">{t.name}</h4>
                                        <p className="text-xs text-[var(--text-muted)]">{t.role}</p>
                                    </div>
                                </div>
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-3.5 h-3.5 text-[var(--accent)] fill-[var(--accent)]" />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
