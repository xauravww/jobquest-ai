"use client";

import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
    {
        name: "Free",
        price: "$0",
        period: "/mo",
        description: "Perfect for getting started.",
        features: ["Basic AI Matching", "5 Resume Scans", "Email Support", "Job Tracking"],
        cta: "Get Started",
        variant: "white",
    },
    {
        name: "Pro",
        price: "$29",
        period: "/mo",
        description: "For serious job seekers.",
        features: [
            "Unlimited AI Matching",
            "Unlimited Resume Scans",
            "Priority Support",
            "Auto-Apply Bot",
            "Interview Coaching",
        ],
        cta: "Go Pro",
        variant: "primary",
        popular: true,
    },
    {
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "For recruitment agencies.",
        features: ["API Access", "White Labeling", "Dedicated Account Manager", "Custom Integrations"],
        cta: "Contact Sales",
        variant: "glass",
    },
];

const Pricing = () => {
    const [isAnnual, setIsAnnual] = useState(false);

    return (
        <section id="pricing" className="py-24 relative">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        Simple, Transparent <span className="text-gradient-primary">Pricing</span>
                    </h2>
                    <p className="text-lg text-[var(--text-muted)] mb-8">
                        Invest in your future without breaking the bank.
                    </p>

                    {/* Toggle */}
                    <div className="flex items-center justify-center gap-4">
                        <span className={`text-sm ${!isAnnual ? "text-white" : "text-[var(--text-muted)]"}`}>Monthly</span>
                        <button
                            onClick={() => setIsAnnual(!isAnnual)}
                            className="w-14 h-8 rounded-full bg-[var(--bg-surface)] border border-[var(--border-glass)] relative px-1 transition-colors"
                        >
                            <motion.div
                                animate={{ x: isAnnual ? 24 : 0 }}
                                className="w-6 h-6 rounded-full bg-[var(--primary)] shadow-lg"
                            />
                        </button>
                        <span className={`text-sm ${isAnnual ? "text-white" : "text-[var(--text-muted)]"}`}>
                            Annual <span className="text-[var(--success)] text-xs ml-1">(Save 20%)</span>
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <Card
                            key={index}
                            className={`flex flex-col ${plan.popular ? "border-[var(--primary)] bg-[var(--primary)]/5" : ""}`}
                            glow={plan.popular}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--primary)] text-black text-xs font-bold px-3 py-1 rounded-full shadow-[0_0_20px_rgba(0,242,255,0.5)]">
                                    MOST POPULAR
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                                <p className="text-[var(--text-muted)] text-sm mb-4">{plan.description}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                                    <span className="text-[var(--text-dim)]">{plan.period}</span>
                                </div>
                            </div>

                            <div className="flex-grow space-y-4 mb-8">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[var(--success)]/20 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-[var(--success)]" />
                                        </div>
                                        <span className="text-sm text-[var(--text-muted)]">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Button variant={plan.variant as any} className="w-full">
                                {plan.cta}
                            </Button>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Pricing;
