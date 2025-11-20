"use client";

import React, { memo, useEffect, useState, Suspense, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import { ArrowRight } from "lucide-react";

// Skip link for accessibility
const SkipLink = memo(() => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-emerald-500 text-white px-4 py-2 rounded-md transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white"
  >
    Skip to main content
  </a>
));

SkipLink.displayName = 'SkipLink';

// SectionLoader for dynamic loading
const SectionLoader = memo(({ children, threshold = 0.1 }: { children: React.ReactNode; threshold?: number; }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref} className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      {children}
    </div>
  );
});

SectionLoader.displayName = 'SectionLoader';

// Header Component
const Header = memo(() => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1c]/80 backdrop-blur-sm border-b border-slate-800/50" role="banner">
    <div className="container mx-auto px-6 py-4">
      <div className="flex items-center justify-between">
        <a href="#" className="text-xl font-bold tracking-tight text-white" aria-label="Jobquest AI homepage">
          JOBQUEST
        </a>
        <nav className="hidden md:flex items-center space-x-6" role="navigation" aria-label="Main navigation">
          <a 
            href="#features" 
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#0a0f1c] rounded-md px-2 py-1"
          >
            Features
          </a>
          <a 
            href="#testimonials" 
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#0a0f1c] rounded-md px-2 py-1"
          >
            Testimonials
          </a>
          <a 
            href="#pricing" 
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#0a0f1c] rounded-md px-2 py-1"
          >
            Pricing
          </a>
        </nav>
        <div className="flex items-center space-x-4">
          <a 
            href="#signin" 
            className="hidden sm:inline-block text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#0a0f1c] rounded-md px-2 py-1"
          >
            Sign In
          </a>
          <a 
            href="#get-started" 
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-all duration-200 shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#0a0f1c] rounded-md"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
    <div className="h-px bg-slate-800"></div>
  </header>
));

Header.displayName = 'Header';


// Hero Section
const HeroSection = memo(() => (
  <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden" aria-labelledby="hero-heading">
    <div className="absolute inset-x-0 top-0 h-[500px] z-0 bg-gradient-to-b from-emerald-500/5 to-transparent"></div>
    <div className="container mx-auto px-6 relative z-10 text-center">
      <h1
        id="hero-heading"
        className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight max-w-4xl mx-auto"
      >
        Stop Searching, Start Interviewing
      </h1>

      <div className="mt-8 flex items-center justify-center gap-3 md:gap-5">
        <div className="flex items-center gap-2 text-gray-300">
          <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center border border-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <span className="text-xs font-medium">AI Search</span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
          <path d="M5 12h14"/>
          <path d="m12 5 7 7-7 7"/>
        </svg>
        <div className="flex items-center gap-2 text-emerald-400">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10c0-4.42-2.87-8.15-6.84-9.58"/>
              <path d="M12 2v4"/>
              <path d="m16.24 7.76 2.83 2.83"/>
              <path d="M22 12h-4"/>
              <path d="m16.24 16.24 2.83 2.83"/>
              <path d="M12 22v-4"/>
              <path d="m4.93 19.07 2.83-2.83"/>
              <path d="M2 12h4"/>
              <path d="m4.93 4.93 2.83 2.83"/>
            </svg>
          </div>
          <span className="text-sm font-semibold">Smart Filters</span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
          <path d="M5 12h14"/>
          <path d="m12 5 7 7-7 7"/>
        </svg>
        <div className="flex items-center gap-2 text-gray-300">
          <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center border border-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
              <line x1="16" x2="16" y1="2" y2="6"/>
              <line x1="8" x2="8" y1="2" y2="6"/>
              <line x1="3" x2="21" y1="10" y2="10"/>
            </svg>
          </div>
          <span className="text-xs font-medium">Auto Apply</span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
          <path d="M5 12h14"/>
          <path d="m12 5 7 7-7 7"/>
        </svg>
        <div className="flex items-center gap-2 text-gray-300">
          <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center border border-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 6.1H3"/>
              <path d="M21 12.1H3"/>
              <path d="M15.1 18H3"/>
            </svg>
          </div>
          <span className="text-xs font-medium">Ace Interviews</span>
        </div>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
        <a
          href="#get-started"
          className="inline-flex items-center justify-center w-full sm:w-auto px-10 py-4 text-lg font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-all hover:scale-105 shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#0a0f1c]"
        >
          Get Started for Free
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 ml-2" aria-hidden="true">
            <path d="M5 12h14"/>
            <path d="m12 5 7 7-7 7"/>
          </svg>
        </a>
        <a
          href="#features"
          className="inline-flex items-center justify-center w-full sm:w-auto px-10 py-4 text-lg font-semibold text-gray-300 border border-slate-600 rounded-lg hover:bg-slate-700 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-[#0a0f1c]"
        >
          See Features
        </a>
      </div>
      <div className="mt-16 md:mt-20 max-w-6xl mx-auto">
        <div className="rounded-xl border border-slate-700 shadow-2xl p-3">
          <Suspense fallback={<div className="w-full h-80 bg-slate-700 rounded-lg animate-pulse"></div>}>
            <div className="relative w-full h-80 rounded-lg">
              <Image
                src="/make-data-drive-analytics.png"
                alt="Jobquest AI Dashboard"
                fill
                className="rounded-lg object-cover"
                priority
                sizes="100vw"
                onLoad={() => console.log('Hero image loaded successfully')}
                onError={(e) => console.error('Hero image failed to load', e)}
              />
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  </section>
));

HeroSection.displayName = 'HeroSection';

const CompaniesMarquee = memo(() => {
  const companyLogos = [
    { src: "/amazon.svg", alt: "Amazon" },
    { src: "/apple.svg", alt: "Apple" },
    { src: "/google.svg", alt: "Google" },
    { src: "/meta.svg", alt: "Meta" },
    { src: "/microsoft.svg", alt: "Microsoft" },
    { src: "/netflix.svg", alt: "Netflix" },
  ];

  const [imagesLoaded, setImagesLoaded] = useState(0);
  const duplicates = 8;
  const totalImages = companyLogos.length * duplicates;
  const marqueeRef = useRef<HTMLDivElement>(null);

  const handleImageLoad = (alt: string) => {
    console.log('Company logo loaded:', alt);
    setImagesLoaded(prev => prev + 1);
  };

  const handleImageError = (alt: string, e: any) => {
    console.error('Company logo failed:', alt, e);
  };

  useEffect(() => {
    if (imagesLoaded === totalImages && marqueeRef.current) {
      const containerWidth = marqueeRef.current.offsetWidth;
      const contentWidth = marqueeRef.current.scrollWidth;
      const animationDuration = 20; // seconds
      const speed = contentWidth / (animationDuration * 1000); // pixels per ms
      const startTime = performance.now();
      console.log('All images loaded, container width:', containerWidth);
      console.log('Total content width:', contentWidth);
      console.log('Ratio:', contentWidth / containerWidth);
      console.log('Animation speed (px/ms):', speed);
      console.log('Marquee animation started at:', new Date().toISOString());

      // Periodic logging for position tracking (every 1 second for 10 seconds)
      let logInterval: NodeJS.Timeout;
      const logPosition = () => {
        if (marqueeRef.current) {
          const currentTransform = getComputedStyle(marqueeRef.current).transform;
          const translateX = currentTransform ? parseFloat(currentTransform.split(',')[4]) || 0 : 0;
          const elapsed = (performance.now() - startTime) / 1000;
          console.log(`Marquee position after ${elapsed.toFixed(2)}s: translateX(${translateX.toFixed(2)}px), expected: ~${(elapsed * speed * -1000).toFixed(2)}px`);
        }
        logInterval = setTimeout(logPosition, 1000);
      };
      logPosition();

      // Clear interval after a few cycles to avoid spam
      setTimeout(() => clearTimeout(logInterval), 20000);
    }
  }, [imagesLoaded, totalImages]);

  const duplicatedLogos = Array(duplicates).fill(companyLogos).flat();

  // Add animation iteration listener for loop continuity
  useEffect(() => {
    if (imagesLoaded === totalImages && marqueeRef.current) {
      const marqueeElement = marqueeRef.current;
      const handleIteration = (e: AnimationEvent) => {
        console.log('Animation iteration completed:', e.elapsedTime);
        const currentTransform = getComputedStyle(marqueeElement).transform;
        const translateX = currentTransform ? parseFloat(currentTransform.split(',')[4]) || 0 : 0;
        console.log('Transform at iteration end:', translateX);
        // Check for jerk: if not close to expected reset position
        const expectedEnd = - (marqueeElement.scrollWidth / duplicates);
        const jerkThreshold = 5; // px
        if (Math.abs(translateX - expectedEnd) > jerkThreshold) {
          console.warn('Potential jerk detected: translateX deviation', Math.abs(translateX - expectedEnd));
        } else {
          console.log('Smooth loop confirmed');
        }
      };

      marqueeElement.addEventListener('animationiteration', handleIteration);
      return () => marqueeElement.removeEventListener('animationiteration', handleIteration);
    }
  }, [imagesLoaded, totalImages, duplicates]);

  return (
    <section className="py-8 bg-[#0a0f1c] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 relative">
        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0a0f1c] to-transparent pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#0a0f1c] to-transparent pointer-events-none"></div>

        <div ref={marqueeRef} className={`flex whitespace-nowrap ${imagesLoaded === totalImages ? 'animate-marquee' : ''}`}>
          {duplicatedLogos.map((logo, index) => (
            <div key={`${logo.src}-${index}`} className="flex-shrink-0 mx-2 sm:mx-4">
              <Image
                src={logo.src}
                alt={logo.alt}
                width={32}
                height={32}
                className="sm:w-12 sm:h-12 filter grayscale hover:grayscale-0 transition-all duration-300"
                onLoad={() => handleImageLoad(logo.alt)}
                onError={(e) => handleImageError(logo.alt, e)}
              />
            </div>
          ))}
        </div>

        <style jsx>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(-100% / ${duplicates})); }
          }
          .animate-marquee {
            animation: marquee 20s linear infinite;
          }
        `}</style>
      </div>
    </section>
  );
});

CompaniesMarquee.displayName = 'CompaniesMarquee';


// Feature Card Component
const FeatureCard = memo(({
  icon: Icon,
  title,
  description,
  imageSrc,
  imageAlt,
  reverse = false
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
}) => (
  <div className={`grid gap-8 md:grid-cols-2 lg:gap-12 items-center ${reverse ? 'flex-col-reverse md:flex-row-reverse' : 'flex-col md:flex-row'}`}>
    <div className={`space-y-2 text-center ${reverse ? 'md:order-2' : 'md:order-1'}`}>
       <div className="inline-flex items-center gap-3 py-2 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-0">
         <Icon className="w-5 h-5 text-emerald-400" />
         <h3 className="text-xl md:text-2xl font-semibold text-white mb-0">{title}</h3>
       </div>
      <p className="text-gray-400 leading-relaxed mt-2">{description}</p>
    </div>
    <div className={`bg-slate-800/50 p-3 rounded-lg border border-slate-700 shadow-xl ${reverse ? 'md:order-1' : 'md:order-2'}`}>
      <Suspense fallback={<div className="w-full h-48 bg-slate-700 rounded-md animate-pulse"></div>}>
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={800}
          height={400}
          className="rounded-md w-full h-48 object-cover md:h-64"
          sizes="(max-width: 768px) 100vw, 50vw"
          onLoad={() => console.log('Feature image loaded successfully:', imageSrc)}
          onError={(e) => console.error('Feature image failed to load:', imageSrc, e)}
        />
      </Suspense>
    </div>
  </div>
));

FeatureCard.displayName = 'FeatureCard';

// Features Section
const FeaturesSection = memo(() => (
  <section id="features" className="py-20 sm:py-32 bg-[#111827]" aria-labelledby="features-heading">
    <div className="container mx-auto px-6">
      <div className="text-center max-w-3xl mx-auto mb-20">
        <h2
          id="features-heading"
          className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white"
        >
          Your All-in-One Career Command Center
        </h2>
        <p className="mt-4 text-lg text-gray-400">Everything you need to accelerate your job search, powered by AI.</p>
      </div>

       <div className="space-y-20 lg:space-y-24">
        <FeatureCard
          icon={() => (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-emerald-400">
              <path d="M12 2a10 10 0 1 0 10 10c0-4.42-2.87-8.15-6.84-9.58"/>
              <path d="M12 2v4"/>
              <path d="m16.24 7.76 2.83 2.83"/>
              <path d="M22 12h-4"/>
              <path d="m16.24 16.24 2.83 2.83"/>
              <path d="M12 22v-4"/>
              <path d="m4.93 19.07 2.83-2.83"/>
              <path d="M2 12h4"/>
              <path d="m4.93 4.93 2.83 2.83"/>
            </svg>
          )}
          title="Intelligent Job Filtering"
          description="Our AI doesn't just match keywords; it understands context. It scans thousands of listings to eliminate spam and find genuine hiring posts, scored for relevance to your unique profile."
          imageSrc="/ai-filtered-job-results.png"
          imageAlt="Analytics Dashboard"
        />
        <FeatureCard
          icon={() => (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-emerald-400">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
              <line x1="16" x2="16" y1="2" y2="6"/>
              <line x1="8" x2="8" y1="2" y2="6"/>
              <line x1="3" x2="21" y1="10" y2="10"/>
            </svg>
          )}
          title="Unified Application Tracking"
          description="From 'Saved' to 'Offer Received,' manage every application's lifecycle in one place. Add notes, link reminders, and see your entire pipeline at a glance, just like a professional project manager."
          imageSrc="/unified-application-tracking.png"
          imageAlt="Kanban board"
          reverse
        />
        <FeatureCard
          icon={() => (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-emerald-400">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          )}
          title="Resume & ATS Optimization"
          description="Manage multiple resume versions and see how they stack up. Our platform can analyze your resume's effectiveness with an ATS score, helping you tailor it for each application."
          imageSrc="/resume-and-ats-optimization.png"
          imageAlt="Document editor"
        />
      </div>
    </div>
  </section>
));

FeaturesSection.displayName = 'FeaturesSection';

// Testimonial Card
const TestimonialCard = memo(({ quote, name, role }: { quote: string; name: string; role: string; }) => (
  <div className="bg-gradient-to-br from-[#1f2937] to-[#111827] p-8 rounded-xl border border-slate-800 shadow-lg">
    <blockquote className="text-gray-300">
      <p>{`"${quote}"`}</p>
    </blockquote>
    <figcaption className="mt-6 flex items-center gap-x-4">
      <div className="font-semibold text-white">{name}</div>
      <div className="text-gray-500 text-sm">{role}</div>
    </figcaption>
  </div>
));

TestimonialCard.displayName = 'TestimonialCard';

// Testimonials Section
const TestimonialsSection = memo(() => (
  <section id="testimonials" className="py-20 sm:py-32 bg-[#0a0f1c]" aria-labelledby="testimonials-heading">
    <div className="container mx-auto px-6">
      <div className="text-center max-w-3xl mx-auto mb-20">
        <h2
          id="testimonials-heading"
          className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white"
        >
          The modern job hunt is overwhelming. We fixed it.
        </h2>
        <p className="mt-6 text-lg text-gray-400">You're tired of endlessly scrolling and tracking applications in spreadsheets. There's a smarter way.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
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
));

TestimonialsSection.displayName = 'TestimonialsSection';

// Final CTA Section
const FinalCTA = memo(() => (
  <section className="py-20 sm:py-32 bg-[#111827]" aria-labelledby="cta-heading">
    <div className="container mx-auto px-6 text-center">
      <div className="relative max-w-4xl mx-auto py-16 px-8 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-2xl overflow-hidden border border-slate-800">
        <div className="absolute -top-1/2 -left-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl opacity-50"></div>
        <div className="relative">
          <h2 
            id="cta-heading"
            className="text-3xl md:text-5xl font-bold tracking-tight text-white"
          >
            Take Control of Your Career Journey
          </h2>
          <p className="mt-6 max-w-xl mx-auto text-lg text-gray-400">
            Sign up for free and let your AI co-pilot do the heavy lifting. Your dream job is closer than you think.
          </p>
          <a 
            href="#get-started"
            className="mt-10 inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-transform hover:scale-105 shadow-2xl shadow-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-transparent"
          >
            Start Winning Your Job Search
            <ArrowRight className="w-5 h-5 ml-2" />
          </a>
        </div>
      </div>
    </div>
  </section>
));

FinalCTA.displayName = 'FinalCTA';

// Main Page Component
export default function HomePage() {
  const router = useRouter();

  return (
    <>
      <SkipLink />
      <main id="main-content" className="flex-grow bg-[#0a0f1c] text-[#e5e7eb]" role="main">
        <SectionLoader>
          <HeroSection />
        </SectionLoader>
        <SectionLoader>
          <CompaniesMarquee />
        </SectionLoader>
        <SectionLoader>
          <FeaturesSection />
        </SectionLoader>
        <SectionLoader>
          <TestimonialsSection />
        </SectionLoader>
        <SectionLoader>
          <FinalCTA />
        </SectionLoader>
      </main>
      <Footer />
    </>
  );
}