"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <main className="flex-grow bg-gradient-to-b from-bg-dark via-bg-dark/90 to-bg-dark bg-opacity-90 text-text flex flex-col relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="mt-5 absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] animate-pulse z-5"></div>

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

      <section className="hero-bg-effect flex flex-col items-center justify-center px-6 py-24 pt-32 text-center relative z-10 bg-bg-dark shadow-lg mt-5">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] animate-pulse z-5"></div>

        <div className="relative z-10">
          <h1 className="text-8xl md:text-9xl font-extrabold leading-tight tracking-tight mb-6 text-cyan-400">
            404
          </h1>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-6">
            Page Not Found
          </h2>
          <p className="text-lg md:text-xl max-w-2xl text-gray-300 mb-10">
            Oops! The page you&apos;re looking for doesn&apos;t exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/')}
              className="button-primary"
            >
              Go Back Home
            </button>
            <button
              onClick={() => router.back()}
              className="button-secondary text-text"
            >
              Go Back
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
