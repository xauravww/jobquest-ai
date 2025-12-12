"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, Users } from "lucide-react";

const testimonials = [
    {
        name: "Aarav Sharma",
        role: "Product Designer",
        content: "Applytron helped me land 3 interviews in my first week. The resume tailoring is incredible!",
        highlight: "3 interviews in my first week",
        color: "from-teal-500 to-cyan-500",
    },
    {
        name: "Priya Patel",
        role: "Software Engineer",
        content: "I went from 0 responses to multiple offers. This tool is a game-changer for job seekers.",
        highlight: "0 to multiple offers",
        color: "from-indigo-500 to-blue-500",
    },
    {
        name: "Rohan Gupta",
        role: "Marketing Manager",
        content: "The automated follow-ups kept me organized and professional. Highly recommend!",
        highlight: "automated follow-ups",
        color: "from-emerald-500 to-green-500",
    },
    {
        name: "Ananya Singh",
        role: "Data Analyst",
        content: "Best investment in my career. The AI actually understands what recruiters want to see.",
        highlight: "AI understands recruiters",
        color: "from-amber-500 to-orange-500",
    },
];

const Testimonials = () => {
    return (
        <section id="testimonials" className="py-24 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 via-primary/10 to-transparent" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center max-w-3xl mx-auto mb-20"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        Real Stories, <span className="text-gradient-primary">Real Success</span>
                    </h2>
                    <p className="text-lg text-[var(--text-muted)]">
                        Hear from professionals who've transformed their careers with our AI.
                    </p>
                </motion.div>

                <div className="space-y-8">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: index * 0.2 }}
                            viewport={{ once: true }}
                            className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                        >
                            <div className="w-full md:w-1/2">
                            {/* Quote Card */}
                            <div className="relative p-8 lg:p-12 rounded-3xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-sm">
                                {/* Highlighted Phrase */}
                                <div className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${testimonial.color} text-white font-bold text-sm mb-6`}>
                                    {testimonial.highlight}
                                </div>

                                {/* Main Quote */}
                                <blockquote className="text-xl lg:text-2xl text-white font-medium leading-relaxed mb-8">
                                    "{testimonial.content}"
                                </blockquote>

                                {/* Rating */}
                                <div className="flex gap-1 mb-6">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                    ))}
                                </div>

                                {/* Author */}
                                <div className="flex items-center gap-4">
                                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold text-lg ring-2 ring-white/20`}>
                                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-white">{testimonial.name}</h4>
                                        <p className="text-[var(--text-muted)]">{testimonial.role}</p>
                                    </div>
                                </div>

                                {/* Decorative Element */}
                                <div className={`absolute bottom-4 right-4 w-20 h-20 rounded-full bg-gradient-to-br ${testimonial.color} opacity-10 blur-xl`} />
                            </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="text-center mt-20"
                >
                    <p className="text-[var(--text-dim)] text-lg mb-8">
                        Ready to write your success story?
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(249, 115, 22, 0.3)" }}
                        whileTap={{ scale: 0.95 }}
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <Users className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                        <span className="relative z-10">Join the Community</span>
                        <div className="absolute inset-0 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors duration-300"></div>
                    </motion.button>
                </motion.div>
            </div>
        </section>
    );
};

export default Testimonials;
