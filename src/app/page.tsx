"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ContactUsForm from "../components/ContactUsForm";
import { CardCarousel } from "@/components/ui/card-carousel";

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-b from-bg-dark via-bg-dark/90 to-bg-dark bg-opacity-90 text-text flex flex-col relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] animate-pulse z-0"></div>

      {/* Animated Dots */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full opacity-70 animate-ping"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-orange-400 rounded-full opacity-50 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-pink-400 rounded-full opacity-60 animate-bounce"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-cyan-300 rounded-full opacity-80 animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-orange-300 rounded-full opacity-60 animate-ping"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 border border-cyan-400/30 rounded-full animate-spin-slow z-0"></div>
      <div className="absolute top-40 right-20 w-16 h-16 border border-orange-400/30 rounded-full animate-reverse-spin z-0"></div>
      <div className="absolute bottom-40 left-20 w-12 h-12 border border-pink-400/30 rounded-full animate-spin-slow z-0"></div>
      <section className="hero-bg-effect flex flex-col items-center justify-center flex-grow px-6 py-24 pt-32 text-center relative z-10 bg-bg-dark rounded-b-3xl shadow-lg">
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6">
          Jobquest <span className="text-cyan-400">AI</span>
        </h1>
        <p className="text-lg md:text-2xl max-w-2xl text-gray-300 mb-10">
          Find your dream job faster with AI-powered job matching, automated
          applications, and personalized career insights.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="/auth/signup"
            className="button-primary"
          >
            Get Started
          </a>
          <a
            href="/auth/signin"
            className="button-secondary text-text"
          >
            Sign In
          </a>
        </div>
      </section>

      <section className="bg-bg text-text py-24 mt-16 rounded-t-3xl shadow-inner relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-10 text-center">
            Why Choose Jobquest AI?
          </h2>
          <CardCarousel autoplayDelay={2000} showPagination={true} showNavigation={true}>
            <div className="p-6 rounded-lg shadow-lg bg-gradient-card hover:bg-highlight transition cursor-pointer flex flex-col items-center text-center">
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-3 text-text">AI-Powered Matching</h3>
              <p className="text-text-muted">
                Our advanced AI algorithms match you with the best job opportunities tailored to your skills and preferences.
              </p>
            </div>
            <div className="p-6 rounded-lg shadow-lg bg-gradient-card hover:bg-highlight transition cursor-pointer flex flex-col items-center text-center">
              <div className="text-5xl mb-4">⚙️</div>
              <h3 className="text-xl font-semibold mb-3 text-text">Automated Applications</h3>
              <p className="text-text-muted">
                Save time by automating your job applications with our seamless integration and smart tracking.
              </p>
            </div>
            <div className="p-6 rounded-lg shadow-lg bg-gradient-card hover:bg-highlight transition cursor-pointer flex flex-col items-center text-center">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-3 text-text">Personalized Insights</h3>
              <p className="text-text-muted">
                Get personalized career advice and salary negotiation tips powered by AI.
              </p>
            </div>
          </CardCarousel>
        </div>
      </section>

      

      <section className="bg-bg-dark bg-opacity-90 text-text py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-8">Trusted by Thousands</h2>
          <p className="mb-12 max-w-3xl mx-auto text-gray-300">
            Join thousands of job seekers who have found success with Jobquest AI.
          </p>
          <div className="marquee-container overflow-hidden relative bg-white/10 rounded-lg p-4">
            <div className="marquee-content flex animate-marquee">
              <img
                src="/google.svg"
                alt="Google"
                className="h-14 mx-8"
              />
              <img
                src="/microsoft.svg"
                alt="Microsoft"
                className="h-14 mx-8"
              />
              <img
                src="/amazon.svg"
                alt="Amazon"
                className="h-14 mx-8"
              />
              <img
                src="/meta.svg"
                alt="Meta"
                className="h-14 mx-8"
              />
              <img
                src="/apple.svg"
                alt="Apple"
                className="h-14 mx-8"
              />
              <img
                src="/netflix.svg"
                alt="Netflix"
                className="h-14 mx-8"
              />
              <img
                src="/telegram.svg"
                alt="Telegram"
                className="h-14 mx-8"
              />
              {/* Duplicate for seamless loop */}
              <img
                src="/google.svg"
                alt="Google"
                className="h-14 mx-8"
              />
              <img
                src="/microsoft.svg"
                alt="Microsoft"
                className="h-14 mx-8"
              />
              <img
                src="/amazon.svg"
                alt="Amazon"
                className="h-14 mx-8"
              />
              <img
                src="/meta.svg"
                alt="Meta"
                className="h-14 mx-8"
              />
              <img
                src="/apple.svg"
                alt="Apple"
                className="h-14 mx-8"
              />
              <img
                src="/netflix.svg"
                alt="Netflix"
                className="h-14 mx-8"
              />
              <img
                src="/telegram.svg"
                alt="Telegram"
                className="h-14 mx-8"
              />
              <img
                src="/next.svg"
                alt="Next.js"
                className="h-14 mx-8"
              />
            </div>
          </div>
        </div>
      </section>
      <section className="bg-bg-dark bg-opacity-90 text-text py-24 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <ContactUsForm />
        </div>
      </section>

      <section className="bg-bg text-text py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-8">Get Started Today</h2>
          <p className="mb-12 max-w-3xl mx-auto text-gray-300">
            Sign up now and take the first step towards your dream career with Jobquest AI.
          </p>
          <button
            onClick={() => router.push('/auth/signup')}
            className="button-primary"
          >
            Explore Jobs
          </button>
        </div>
      </section>
    </main>
  );
}
