"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Send, TrendingUp, Clock } from "lucide-react";

const stats = [
    {
        number: "50K+",
        label: "Active Users",
        description: "Professionals accelerating their careers",
        icon: Users,
        color: "from-teal-500 to-cyan-500",
        delay: 0,
    },
    {
        number: "2M+",
        label: "Applications Sent",
        description: "Automated applications delivered",
        icon: Send,
        color: "from-indigo-500 to-blue-500",
        delay: 0.1,
    },
    {
        number: "87%",
        label: "Success Rate",
        description: "Higher interview conversion",
        icon: TrendingUp,
        color: "from-emerald-500 to-green-500",
        delay: 0.2,
    },
    {
        number: "14 Days",
        label: "Avg. Time to Offer",
        description: "From search to job offer",
        icon: Clock,
        color: "from-orange-500 to-red-500",
        delay: 0.3,
    },
];

const Stats = () => {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-white/10 to-transparent rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        Proven <span className="text-gradient-primary">Results</span>
                    </h2>
                    <p className="text-lg text-[var(--text-muted)]">
                        Real impact for real job seekers. Our AI doesn't just promise— it delivers.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.6, delay: stat.delay }}
                            viewport={{ once: true }}
                            className="group relative"
                        >
                            <div className="relative p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/10">
                                {/* Icon with gradient background */}
                                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${stat.color} p-4 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <stat.icon className="w-8 h-8 text-white" />
                                </div>

                                {/* Number with animation */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    transition={{ duration: 0.5, delay: stat.delay + 0.2, type: "spring" }}
                                    viewport={{ once: true }}
                                    className="mb-2"
                                >
                                    <span className="text-4xl md:text-5xl font-black text-white group-hover:text-gradient-primary transition-all duration-300">
                                        {stat.number}
                                    </span>
                                </motion.div>

                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors duration-300">
                                    {stat.label}
                                </h3>
                                <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                                    {stat.description}
                                </p>

                                {/* Subtle glow effect */}
                                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Call to action */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    viewport={{ once: true }}
                    className="text-center mt-16"
                >
                    <p className="text-[var(--text-dim)] text-lg">
                        Join the ranks of successful job seekers
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

export default Stats;