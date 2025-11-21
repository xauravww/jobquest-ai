"use client";

import React from "react";
import Card from "@/components/ui/Card";
import { Bot, Target, FileText, Zap, Shield, Globe } from "lucide-react";

const features = [
    {
        title: "AI Matchmaker",
        description: "Our advanced algorithms analyze thousands of data points to find jobs that perfectly align with your skills and career goals.",
        icon: Bot,
        color: "text-cyan-400",
        colSpan: "md:col-span-2",
    },
    {
        title: "Smart Resume",
        description: "Automatically tailor your resume for each application to beat ATS systems.",
        icon: FileText,
        color: "text-purple-400",
        colSpan: "md:col-span-1",
    },
    {
        title: "Auto-Apply",
        description: "Let our bot handle the tedious application forms while you focus on interview prep.",
        icon: Zap,
        color: "text-yellow-400",
        colSpan: "md:col-span-1",
    },
    {
        title: "Global Search",
        description: "Access remote opportunities from top companies around the world.",
        icon: Globe,
        color: "text-green-400",
        colSpan: "md:col-span-2",
    },
    {
        title: "Privacy First",
        description: "Your data is encrypted and never shared with recruiters without your permission.",
        icon: Shield,
        color: "text-red-400",
        colSpan: "md:col-span-3",
    },
];

const Features = () => {
    return (
        <section id="features" className="py-24 relative">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        Supercharge Your <span className="text-gradient-cosmic">Job Search</span>
                    </h2>
                    <p className="text-lg text-[var(--text-muted)]">
                        Equip yourself with the most advanced tools in the galaxy to land your dream role.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <Card
                            key={index}
                            className={`${feature.colSpan} flex flex-col justify-between min-h-[240px]`}
                            glow={index === 0}
                        >
                            <div className={`w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-6 ${feature.color}`}>
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-[var(--text-muted)]">{feature.description}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
