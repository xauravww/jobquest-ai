// src/app/page.tsx

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import { ArrowRight, CheckCircle, BrainCircuit, BarChart3, Briefcase, CalendarCheck, FileText } from "lucide-react";

// --- START: Reusable UI Components for the Landing Page ---

// A card for showcasing a specific feature with a visual mockup
const FeatureCard = ({ title, description, icon: Icon, visual, reverse = false }: {
  title: string;
  description: string;
  icon: React.ElementType;
  visual: React.ReactNode;
  reverse?: boolean;
}) => (
  <div className="grid md:grid-cols-2 gap-12 items-center">
    <div className={`rounded-lg bg-bg-light p-4 border border-border shadow-2xl ${reverse ? 'md:order-2' : 'md:order-1'}`}>
      {visual}
    </div>
    <div className={reverse ? 'md:order-1' : 'md:order-2'}>
      <div className="inline-flex items-center gap-3 mb-4">
        <Icon className="w-7 h-7 text-primary" />
        <h3 className="text-2xl font-bold text-white">{title}</h3>
      </div>
      <p className="text-lg text-gray-300 leading-relaxed">
        {description}
      </p>
    </div>
  </div>
);

// A card for displaying user testimonials
const TestimonialCard = ({ quote, name, role }: { quote: string; name: string; role: string; }) => (
  <figure className="rounded-2xl bg-gradient-card shadow-lg ring-1 ring-white/10 p-8 h-full flex flex-col">
    <blockquote className="text-gray-200 flex-grow">
      <p>{`“${quote}”`}</p>
    </blockquote>
    <figcaption className="mt-6 flex items-center gap-x-4">
      <div className="font-semibold text-white">{name}</div>
      <div className="text-gray-400">| {role}</div>
    </figcaption>
  </figure>
);


// --- START: Section Components ---

const HeroSection = () => (
  <section className="relative bg-gradient-hero text-center px-6 py-32 pt-40 z-10">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] animate-pulse z-0"></div>
    <div className="relative z-10 max-w-4xl mx-auto">
      <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6 bg-gradient-to-r from-white via-gray-200 to-emerald-300 bg-clip-text text-transparent">
        Stop Searching, Start Interviewing
      </h1>
      <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-300 mb-12 leading-relaxed">
        Jobquest AI is your career co-pilot. We use intelligent automation to find your perfect job, optimize your resume, and manage your applications—so you can focus on acing the interview.
      </p>
      <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
        <a href="/auth/signup" className="button-primary text-lg px-8 py-4 flex items-center gap-2">
          Get Started for Free <ArrowRight className="w-5 h-5" />
        </a>
        <a href="#features" className="button-secondary text-lg px-8 py-4">
          See Features
        </a>
      </div>
    </div>
  </section>
);

const ProblemSolutionSection = () => (
  <section className="bg-bg py-24 sm:py-32">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div className="max-w-3xl mx-auto lg:mx-0 text-center lg:text-left">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          The modern job hunt is overwhelming.
        </h2>
        <p className="mt-6 text-lg leading-8 text-gray-300">
          You're tired of endlessly scrolling, customizing resumes for ATS bots, and tracking applications in spreadsheets. There's a smarter way.
        </p>
      </div>
      <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-2">
        <TestimonialCard 
          quote="The AI filtering saved me hours scrolling through irrelevant jobs. I found my current role in less than a week!" 
          name="Alex Johnson" 
          role="Software Engineer" 
        />
        <TestimonialCard 
          quote="Finally, all my applications, reminders, and interview notes in one place. Jobquest AI brought order to my chaotic job search." 
          name="Maria Garcia" 
          role="Product Manager" 
        />
      </div>
    </div>
  </section>
);

const FeatureShowcase = () => (
  <section id="features" className="bg-bg-dark py-24 sm:py-32">
    <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-24">
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
          Your All-in-One Career Command Center
        </h2>
        <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-400">
          Everything you need to accelerate your job search, powered by AI.
        </p>
      </div>

      <FeatureCard
        title="Intelligent Job Filtering"
        description="Our AI doesn't just match keywords; it understands context. It scans thousands of listings to eliminate spam and find genuine hiring posts, scored for relevance to your unique profile."
        icon={BrainCircuit}
        visual={
          <div className="w-full h-64 bg-bg-card flex items-center justify-center overflow-hidden rounded-lg border border-border shadow-lg">
            <img
              src="/ai-filtered-job-results.png"
              alt="AI Filtered Job Results"
              className="object-cover w-full h-full"
              loading="lazy"
            />
          </div>
        }
      />
      <FeatureCard
        title="Unified Application Tracking"
        description="From 'Saved' to 'Offer Received,' manage every application's lifecycle in one place. Add notes, link reminders, and see your entire pipeline at a glance, just like a professional project manager."
        icon={Briefcase}
        visual={
          <div className="w-full h-64 bg-bg-card flex items-center justify-center overflow-hidden rounded-lg border border-border shadow-lg">
            <img
              src="/unified-application-tracking.png"
              alt="Unified Application Tracking"
              className="object-cover w-full h-full"
              loading="lazy"
            />
          </div>
        }
        reverse
      />
      <FeatureCard
        title="Resume & ATS Optimization"
        description="Manage multiple resume versions and see how they stack up. Our platform can analyze your resume's effectiveness with an ATS score, helping you tailor it for each application."
        icon={FileText}
        visual={
          <div className="w-full h-64 bg-bg-card flex items-center justify-center overflow-hidden rounded-lg border border-border shadow-lg">
            <img
              src="/resume-and-ats-optimization.png"
              alt="Resume and ATS Optimization"
              className="object-cover w-full h-full"
              loading="lazy"
            />
          </div>
        }
      />
      <FeatureCard
        title="Automated Calendar & Reminders"
        description="Never miss a deadline or a follow-up. Automatically create reminders for applications and schedule interviews directly into your calendar. Your personal assistant for the job search."
        icon={CalendarCheck}
        visual={
          <div className="w-full h-64 bg-bg-card flex items-center justify-center overflow-hidden rounded-lg border border-border shadow-lg">
            <img
              src="/automated-calendar-and-reminders.png"
              alt="Automated Calendar and Reminders"
              className="object-cover w-full h-full"
              loading="lazy"
            />
          </div>
        }
        reverse
      />
    </div>
  </section>
);

const SkillsMarquee = () => {
  const logos = ["amazon.svg", "apple.svg", "google.svg", "meta.svg", "microsoft.svg", "netflix.svg", "telegram.svg"];
  // Duplicate the array for a seamless loop effect
  const marqueeLogos = [...logos, ...logos];

  return (
    <section className="bg-bg py-24">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white">Powering Careers at Top Tech Companies</h2>
        <p className="mt-4 text-lg text-gray-300 max-w-3xl mx-auto">Our AI is trusted by professionals at leading companies worldwide, helping them find their next opportunity.</p>
        <div className="mt-12 marquee-container overflow-hidden relative w-full">
          <div className="marquee-content flex animate-marquee">
            {marqueeLogos.map((logo, index) => (
              <div key={index} className="mx-4 px-6 py-3 bg-bg-light border border-border rounded-full shrink-0 flex items-center justify-center">
                <img src={`/${logo}`} alt={logo.replace('.svg', '')} className="w-8 h-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const DataDrivenSection = () => (
  <section className="bg-bg-dark py-24 sm:py-32">
    <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
      <div className="md:order-2">
        <div className="inline-flex items-center gap-3 mb-4">
          <BarChart3 className="w-7 h-7 text-primary" />
          <h2 className="text-3xl font-bold text-white">Make Data-Driven Decisions</h2>
        </div>
        <p className="text-lg text-gray-300 mb-6 leading-relaxed">
          Stop guessing what works. Jobquest AI provides clear analytics on your job search performance, helping you refine your strategy and land a job faster. This is a feature already supported by your dashboard's API.
        </p>
        <ul className="space-y-4">
          <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" /><span className="text-gray-200">Track your application response rate over time to see what's working.</span></li>
          <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" /><span className="text-gray-200">Identify which of your skills are most in-demand based on job descriptions.</span></li>
          <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" /><span className="text-gray-200">Visualize your application pipeline from submitted to offer.</span></li>
        </ul>
      </div>
      <div className="md:order-1">
        <div className="rounded-lg bg-bg-card p-4 border border-border shadow-2xl">
          <div className="w-full h-80 bg-bg flex items-center justify-center overflow-hidden rounded-lg">
            <img
              src="/make-data-drive-analytics.png"
              alt="Make Data Drive Analytics"
              className="object-cover w-full h-full"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
);

const FinalCTA = () => {
  const router = useRouter();
  return (
    <section className="bg-bg text-text py-24">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold mb-6 text-white">Take Control of Your Career Journey</h2>
        <p className="mb-12 max-w-2xl mx-auto text-gray-300 text-lg">
          Sign up for free and let your AI co-pilot do the heavy lifting. Your dream job is closer than you think.
        </p>
        <button
          onClick={() => router.push("/auth/signup")}
          className="button-primary text-xl px-10 py-5"
        >
          Start Winning Your Job Search
        </button>
      </div>
    </section>
  );
};


// --- Main Page Component ---

export default function RedesignedLandingPage() {
  return (
    <>
      <main className="min-h-screen bg-bg-dark text-text flex flex-col overflow-hidden">
        <HeroSection />
        <ProblemSolutionSection />
        <FeatureShowcase />
        <SkillsMarquee />
        <DataDrivenSection />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}