"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Send, TrendingUp, Clock } from "lucide-react";

const stats = [
    {
        number: "50K+",
        label: "Active users",
        description: "Professionals accelerating their careers",
        icon: Users,
    },
    {
        number: "2M+",
        label: "Applications sent",
        description: "Automated applications delivered",
        icon: Send,
    },
    {
        number: "87%",
        label: "Success rate",
        description: "Higher interview conversion",
        icon: TrendingUp,
    },
    {
        number: "14 days",
        label: "Avg. time to offer",
        description: "From search to job offer",
        icon: Clock,
    },
];

const Stats = () => {
    return (
        <section className="px-6 py-24 border-t border-[var(--border)]">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="text-center max-w-2xl mx-auto mb-14"
                >
                    <span className="font-mono-ui text-xs tracking-[0.2em] uppercase text-[var(--text-muted)]">
                        By the numbers
                    </span>
                    <h2 className="font-display text-3xl md:text-4xl font-bold mt-3">
                        Proven results
                    </h2>
                </motion.div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="p-6 md:p-8 bg-[var(--bg-surface)]"
                        >
                            <stat.icon className="w-5 h-5 text-[var(--accent)] mb-5" />
                            <div className="font-mono-ui text-4xl md:text-5xl font-bold text-[var(--text-main)] mb-2">
                                {stat.number}
                            </div>
                            <h3 className="text-base font-semibold mb-1">{stat.label}</h3>
                            <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                                {stat.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Stats;
