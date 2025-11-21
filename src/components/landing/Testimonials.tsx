"use client";

import React from "react";
import Card from "@/components/ui/Card";
import { Star } from "lucide-react";
import Image from "next/image";

const testimonials = [
    {
        name: "Sarah Chen",
        role: "Product Designer",
        company: "TechFlow",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        content: "JobQuest AI completely transformed my job search. I went from 0 interviews to 5 offers in two weeks!",
    },
    {
        name: "Michael Ross",
        role: "Frontend Dev",
        company: "StartUp Inc",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
        content: "The AI matchmaker is scary good. It found roles I didn't even know existed but were perfect for me.",
    },
    {
        name: "Jessica Wu",
        role: "Data Scientist",
        company: "DataCo",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica",
        content: "Finally, a tool that understands context. No more irrelevant spam in my inbox.",
    },
    {
        name: "David Miller",
        role: "UX Researcher",
        company: "CreativeLabs",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
        content: "The resume optimization feature is a game changer. My response rate tripled overnight.",
    },
];

const Testimonials = () => {
    return (
        <section id="testimonials" className="py-24 overflow-hidden bg-[var(--bg-surface)]/30">
            <div className="container mx-auto px-6 mb-16 text-center">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                    Loved by <span className="text-gradient-secondary">Thousands</span>
                </h2>
                <p className="text-lg text-[var(--text-muted)]">
                    Join the community of professionals who accelerated their careers.
                </p>
            </div>

            <div className="relative flex overflow-x-hidden group">
                <div className="animate-marquee flex gap-6 whitespace-nowrap py-4">
                    {[...testimonials, ...testimonials].map((testimonial, index) => (
                        <Card
                            key={index}
                            className="w-[350px] flex-shrink-0 whitespace-normal"
                            hoverEffect={false}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10">
                                    <Image
                                        src={testimonial.image}
                                        alt={testimonial.name}
                                        width={48}
                                        height={48}
                                    />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{testimonial.name}</h4>
                                    <p className="text-sm text-[var(--text-muted)]">
                                        {testimonial.role} at {testimonial.company}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-1 mb-3">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                ))}
                            </div>
                            <p className="text-[var(--text-dim)] italic">"{testimonial.content}"</p>
                        </Card>
                    ))}
                </div>

                <div className="absolute top-0 animate-marquee2 flex gap-6 whitespace-nowrap py-4">
                    {/* Duplicate for seamless loop if needed, but CSS animation handles it usually with one long strip. 
               Actually, the above map doubles the array, so one strip is enough if animation is correct.
           */}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
