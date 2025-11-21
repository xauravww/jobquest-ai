'use client';

import React, { useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  Zap,
  PlayCircle,
  Briefcase,
  FileText,
  Send,
  LayoutDashboard,
  Bell,
  TrendingUp,
  Eye,
  MessageSquare,
  CheckCircle2,
  Clock,
  Bot,
  ChevronDown,
  Infinity
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically load GSAP
    const loadGSAP = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');

      gsap.registerPlugin(ScrollTrigger);

      // Hero animation sequence
      gsap.from('.gsap-hero-elem', {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'power3.out'
      });

      // Reveal animations on scroll
      gsap.utils.toArray('.glass-panel').forEach((panel: any) => {
        gsap.from(panel, {
          scrollTrigger: {
            trigger: panel,
            start: 'top 85%',
          },
          y: 30,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out'
        });
      });
    };

    loadGSAP();

    // Dashboard 3D tilt effect
    const dashboard = dashboardRef.current;
    const section = dashboard?.parentElement;

    if (dashboard && section) {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = section.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;

        dashboard.style.transform = `perspective(2000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      };

      const handleMouseLeave = () => {
        dashboard.style.transform = `perspective(2000px) rotateX(6deg) rotateY(0deg)`;
      };

      section.addEventListener('mousemove', handleMouseMove);
      section.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        section.removeEventListener('mousemove', handleMouseMove);
        section.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, []);

  return (
    <div className="antialiased selection:bg-indigo-500 selection:text-white">
      {/* Background Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-40"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] animate-blob mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-screen"></div>
        <Image
          src="/ai-network.png"
          alt="AI Network Background"
          fill
          className="object-cover opacity-5 mix-blend-overlay"
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 border-b border-white/5 bg-[var(--bg-deep)]/80 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden">
              <Image src="/logo.png" alt="Applytron Logo" width={40} height={40} className="object-contain" />
            </div>
            <span className="font-display font-bold text-lg sm:text-xl tracking-tight">Applytron</span>
          </div>

          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#dashboard-preview" className="text-sm text-gray-400 hover:text-white transition-colors">Demo</a>
            <a href="#testimonials" className="text-sm text-gray-400 hover:text-white transition-colors">Stories</a>
            <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/auth/signin" className="text-xs sm:text-sm text-gray-400 hover:text-white hidden sm:block">
              Sign In
            </Link>
            <Link href="/auth/signup">
              <button className="relative inline-flex h-9 sm:h-10 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]"></span>
                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-4 sm:px-6 py-1 text-xs sm:text-sm font-medium text-white backdrop-blur-3xl hover:bg-slate-900 transition-colors">
                  Get Started
                </span>
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-20 sm:pt-32">
        {/* Hero Section */}
        <section ref={heroRef} className="relative min-h-[80vh] sm:min-h-[90vh] flex flex-col items-center justify-center px-4 sm:px-6 text-center max-w-5xl mx-auto mb-12 sm:mb-20">
          {/* Announcement Pill */}
          <div className="gsap-hero-elem mb-6 sm:mb-8 inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-sm text-indigo-300 text-xs sm:text-sm hover:bg-indigo-500/20 transition-colors cursor-pointer">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="hidden sm:inline">AI-Powered Job Search • Automated Applications</span>
            <span className="sm:hidden">AI-Powered • Automated</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </div>

          {/* Headline */}
          <h1 className="gsap-hero-elem font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.1] tracking-tight mb-6 sm:mb-8">
            Career Growth,<br />
            <span className="text-gradient-primary">On Autopilot.</span>
          </h1>

          {/* Subheadline */}
          <p className="gsap-hero-elem text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mb-8 sm:mb-10 leading-relaxed px-4">
            The AI agent that tailors your resume for every application, tracks opportunities, and manages follow-ups while you focus on interviews.
          </p>

          {/* CTA Buttons */}
          <div className="gsap-hero-elem flex flex-col sm:flex-row gap-3 sm:gap-4 items-center w-full sm:w-auto px-4">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-black rounded-full font-bold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 [text-shadow:_0_0_1px_rgb(0_0_0_/_40%)]">
                Start Free Trial
                <Zap className="w-4 h-4 fill-black stroke-black" />
              </button>
            </Link>
            <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-white font-medium">
              <PlayCircle className="w-5 h-5" />
              Watch Demo
            </button>
          </div>

          {/* Social Proof Strip */}
          <div className="gsap-hero-elem mt-20 pt-10 border-t border-white/5 w-full">
            <p className="text-sm text-gray-500 mb-6">TRUSTED BY JOB SEEKERS AT</p>
            <div className="flex justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 flex-wrap">
              <span className="font-display font-bold text-xl">Google</span>
              <span className="font-display font-bold text-xl">Meta</span>
              <span className="font-display font-bold text-xl">Amazon</span>
              <span className="font-display font-bold text-xl">Microsoft</span>
              <span className="font-display font-bold text-xl">Apple</span>
            </div>
          </div>
        </section>

        {/* Dashboard Preview */}
        <section id="dashboard-preview" className="relative py-12 sm:py-16 md:py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-3 sm:mb-4">Mission Control for Your Career</h2>
              <p className="text-sm sm:text-base text-gray-400">A real-time view of your automated job hunt.</p>
            </div>

            {/* Dashboard Container with 3D Tilt */}
            <div
              ref={dashboardRef}
              className="glass-panel rounded-xl sm:rounded-2xl border border-white/10 overflow-hidden shadow-2xl transition-transform duration-500 hover:shadow-[0_0_50px_rgba(79,70,229,0.15)]"
              style={{ transform: 'perspective(2000px) rotateX(6deg)' }}
            >
              {/* Window Controls */}
              <div className="h-10 sm:h-12 bg-[#0a0a0a]/50 border-b border-white/5 flex items-center px-3 sm:px-4 gap-2">
                <div className="flex gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500/50"></div>
                </div>
                <div className="flex-1 text-center text-[10px] sm:text-xs font-mono text-gray-600">app.applytron.ai/dashboard</div>
                <div className="w-12 sm:w-20"></div>
              </div>

              {/* Dashboard Body */}
              <div className="flex h-[500px] sm:h-[600px] md:h-[700px] bg-[#050505]">
                {/* Sidebar */}
                <div className="w-64 flex-1 border-r border-white/5 bg-[#0a0a0a]/30 p-4 hidden md:flex flex-col overflow-y-auto">
                  <div className="space-y-1">
                    <a href="#" className="dashboard-sidebar-link active">
                      <LayoutDashboard className="w-4 h-4 mr-3" /> Overview
                    </a>
                    <a href="#" className="dashboard-sidebar-link">
                      <Briefcase className="w-4 h-4 mr-3" /> Applications
                      <span className="ml-auto bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded">24</span>
                    </a>
                    <a href="#" className="dashboard-sidebar-link">
                      <FileText className="w-4 h-4 mr-3" /> Resumes
                    </a>
                    <a href="#" className="dashboard-sidebar-link">
                      <Send className="w-4 h-4 mr-3" /> Follow-ups
                    </a>
                  </div>

                  <div className="mt-auto p-4 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-bold text-sm">Pro Plan</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">87/200 Applications</p>
                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-[43%]"></div>
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-8 overflow-y-auto relative">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-2xl font-bold">Welcome back, Alex 👋</h3>
                      <p className="text-sm text-gray-400">Applytron found 8 new opportunities for you.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Bell className="w-5 h-5 text-gray-400" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-700 to-gray-600 border border-white/20"></div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="glass-panel p-5 rounded-xl relative overflow-hidden group">
                      <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Send className="w-16 h-16 text-white" />
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Applications Sent</p>
                      <p className="text-3xl font-mono font-bold">87</p>
                      <div className="flex items-center mt-2 text-xs text-green-400">
                        <TrendingUp className="w-3 h-3 mr-1" /> +18% this week
                      </div>
                    </div>

                    <div className="glass-panel p-5 rounded-xl relative overflow-hidden group">
                      <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Eye className="w-16 h-16 text-white" />
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Profile Views</p>
                      <p className="text-3xl font-mono font-bold">342</p>
                      <div className="flex items-center mt-2 text-xs text-green-400">
                        <TrendingUp className="w-3 h-3 mr-1" /> High visibility
                      </div>
                    </div>

                    <div className="glass-panel p-5 rounded-xl relative overflow-hidden group">
                      <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <MessageSquare className="w-16 h-16 text-white" />
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Interviews</p>
                      <p className="text-3xl font-mono font-bold">5</p>
                      <div className="flex items-center mt-2 text-xs text-indigo-400">
                        <span className="w-2 h-2 bg-indigo-400 rounded-full mr-2 animate-pulse"></span> 2 Scheduled
                      </div>
                    </div>
                  </div>

                  {/* Split View */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Applications Table */}
                    <div className="lg:col-span-2 glass-panel rounded-xl p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="font-semibold">Recent Applications</h4>
                        <button className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1 rounded border border-white/5">View All</button>
                      </div>
                      <div className="space-y-4">
                        {[
                          { company: 'G', name: 'Senior Product Designer', location: 'Google • Remote', time: '2h ago', status: 'Interview' },
                          { company: 'M', name: 'UX Engineer', location: 'Meta • Menlo Park', time: '5h ago', status: 'Applied' },
                          { company: 'A', name: 'Design Lead', location: 'Amazon • Seattle', time: '1d ago', status: 'Applied' }
                        ].map((app, i) => (
                          <div key={i} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors group cursor-pointer">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center text-xl font-bold">{app.company}</div>
                              <div>
                                <div className="font-medium text-sm">{app.name}</div>
                                <div className="text-xs text-gray-400">{app.location}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-xs text-gray-500 font-mono">{app.time}</div>
                              <span className={`status-badge ${app.status === 'Interview' ? 'status-interview' : 'status-applied'}`}>
                                {app.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Activity Feed */}
                    <div className="glass-panel rounded-xl p-6 bg-gradient-to-b from-indigo-900/10 to-transparent">
                      <h4 className="font-semibold mb-6 flex items-center gap-2">
                        <Bot className="w-4 h-4 text-indigo-400" /> AI Agent Activity
                      </h4>
                      <div className="relative pl-4 border-l border-white/10 space-y-8">
                        <div className="relative">
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-green-500 rounded-full ring-4 ring-[#0a0a0a]"></div>
                          <p className="text-xs text-gray-400 mb-1 font-mono">Just now</p>
                          <p className="text-sm">Found 3 new matches for "Product Designer".</p>
                        </div>
                        <div className="relative">
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-indigo-500 rounded-full ring-4 ring-[#0a0a0a]"></div>
                          <p className="text-xs text-gray-400 mb-1 font-mono">15m ago</p>
                          <p className="text-sm">Customized resume for Google application.</p>
                        </div>
                        <div className="relative">
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-gray-500 rounded-full ring-4 ring-[#0a0a0a]"></div>
                          <p className="text-xs text-gray-400 mb-1 font-mono">1h ago</p>
                          <p className="text-sm">Analyzing job market trends...</p>
                        </div>
                      </div>

                      <div className="mt-6 p-3 bg-black/30 rounded border border-white/5 text-xs font-mono text-indigo-300">
                        <span className="animate-pulse">_</span> Processing LinkedIn data...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 sm:py-24 md:py-32 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-12 sm:mb-16 md:mb-20 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-4 sm:mb-6">AI-Powered Career Acceleration</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-400">Three steps to complete automation.</p>
          </div>

          <div className="space-y-16 sm:space-y-24 md:space-y-32">
            {/* Feature 1 */}
            <div className="flex flex-col md:flex-row items-center gap-8 sm:gap-12 md:gap-16">
              <div className="flex-1 space-y-4 sm:space-y-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 mb-3 sm:mb-4">
                  <span className="font-mono font-bold text-base sm:text-lg">01</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold">Smart Resume Tailoring</h3>
                <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
                  Upload your base resume. Our AI analyzes each job description and automatically customizes your resume to match keywords, skills, and requirements—increasing your ATS pass rate dramatically.
                </p>
                <ul className="space-y-3 mt-4">
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Context-aware rewriting
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Keyword optimization
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" /> ATS-friendly formatting
                  </li>
                </ul>
              </div>
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-indigo-600/20 blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="glass-panel rounded-2xl p-4 sm:p-6 md:p-8 relative overflow-hidden">
                  <div className="relative w-full flex items-center justify-center rounded-lg overflow-hidden bg-white/5 py-4">
                    <img
                      src="/ai-resume.png"
                      alt="AI Resume Scanner"
                      className="w-full max-w-full h-auto rounded-lg"
                      style={{ maxHeight: '400px', objectFit: 'contain' }}
                    />
                  </div>
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent animate-scan pointer-events-none"></div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-16">
              <div className="flex-1 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/20 flex items-center justify-center text-purple-400 mb-4">
                  <span className="font-mono font-bold text-lg">02</span>
                </div>
                <h3 className="text-3xl font-bold">Automated Follow-ups</h3>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Never miss a follow-up again. Applytron tracks all your applications and automatically sends personalized follow-up emails at the optimal time to keep you top of mind.
                </p>
                <ul className="space-y-3 mt-4">
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" /> Smart timing algorithms
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" /> Personalized templates
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" /> Multi-channel outreach
                  </li>
                </ul>
              </div>
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-purple-600/20 blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="glass-panel rounded-2xl p-4 sm:p-6 md:p-8 relative overflow-hidden border-purple-500/20">
                  <div className="relative w-full flex items-center justify-center rounded-lg overflow-hidden bg-white/5 py-4">
                    <img
                      src="/dashboard-preview.png"
                      alt="Dashboard Preview"
                      className="w-full max-w-full h-auto rounded-lg"
                      style={{ maxHeight: '400px', objectFit: 'contain' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 flex items-center justify-center text-cyan-400 mb-4">
                  <span className="font-mono font-bold text-lg">03</span>
                </div>
                <h3 className="text-3xl font-bold">Real-Time Analytics</h3>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Track your job search performance with detailed analytics. See which applications get responses, optimize your approach, and land more interviews faster.
                </p>
                <ul className="space-y-3 mt-4">
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Response rate tracking
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Interview conversion metrics
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Performance insights
                  </li>
                </ul>
              </div>
              <div className="flex-1">
                <div className="glass-panel rounded-2xl p-8 relative overflow-hidden border-cyan-500/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-6 rounded-lg text-center">
                      <TrendingUp className="w-10 h-10 mx-auto mb-3 text-cyan-400" />
                      <div className="text-3xl font-bold">87%</div>
                      <div className="text-xs text-gray-500 mt-1">Response Rate</div>
                    </div>
                    <div className="bg-white/5 p-6 rounded-lg text-center border border-cyan-500/30 bg-cyan-500/5">
                      <MessageSquare className="w-10 h-10 mx-auto mb-3 text-cyan-400" />
                      <div className="text-3xl font-bold">3.2x</div>
                      <div className="text-xs text-gray-500 mt-1">More Interviews</div>
                    </div>
                    <div className="bg-white/5 p-6 rounded-lg text-center col-span-2">
                      <Eye className="w-10 h-10 mx-auto mb-3 text-cyan-400" />
                      <div className="text-3xl font-bold">10k+</div>
                      <div className="text-xs text-gray-500 mt-1">Profile Views</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 sm:py-24 md:py-32 bg-gradient-to-b from-transparent via-indigo-900/10 to-transparent">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16 md:mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-4 sm:mb-6">How It Works</h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-400">Get started in minutes, land your dream job in weeks</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
              <div className="glass-panel p-6 sm:p-8 rounded-2xl text-center relative group hover:scale-105 transition-transform">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  1
                </div>
                <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-indigo-400 mt-4" />
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Upload Your Resume</h3>
                <p className="text-sm sm:text-base text-gray-400">Simply upload your base resume. Our AI will analyze your experience, skills, and achievements.</p>
              </div>

              <div className="glass-panel p-6 sm:p-8 rounded-2xl text-center relative group hover:scale-105 transition-transform">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  2
                </div>
                <Bot className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-purple-400 mt-4" />
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">AI Does the Work</h3>
                <p className="text-sm sm:text-base text-gray-400">Our AI finds matching jobs, customizes your resume for each, and submits applications automatically.</p>
              </div>

              <div className="glass-panel p-6 sm:p-8 rounded-2xl text-center relative group hover:scale-105 transition-transform">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-pink-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  3
                </div>
                <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-pink-400 mt-4" />
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Get Interviews</h3>
                <p className="text-sm sm:text-base text-gray-400">Receive interview requests, track your progress, and land your dream job faster than ever.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 sm:py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="glass-panel rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-gradient-primary mb-2">50K+</div>
                <div className="text-gray-400 text-sm">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-gradient-primary mb-2">2M+</div>
                <div className="text-gray-400 text-sm">Applications Sent</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-gradient-primary mb-2">87%</div>
                <div className="text-gray-400 text-sm">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-gradient-primary mb-2">14 Days</div>
                <div className="text-gray-400 text-sm">Avg. Time to Offer</div>
              </div>
            </div>
          </div>
        </section>

        {/* Integration Partners */}
        <section className="py-20 max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Seamless Integrations</h2>
            <p className="text-gray-400">Connect with your favorite job platforms</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['LinkedIn', 'Indeed', 'Glassdoor', 'ZipRecruiter', 'Monster', 'CareerBuilder', 'AngelList', 'Wellfound'].map((platform, i) => (
              <div key={i} className="glass-panel p-6 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer group">
                <span className="font-bold text-gray-400 group-hover:text-white transition-colors">{platform}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-20 border-y border-white/5 bg-white/[0.01] overflow-hidden">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-white">Loved by Job Seekers Worldwide</h3>
          </div>

          <div className="relative w-full overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[var(--bg-deep)] to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[var(--bg-deep)] to-transparent z-10"></div>

            <div className="flex gap-6 animate-scroll w-max">
              {[
                { quote: "Applytron helped me land 3 interviews in my first week. The resume tailoring is incredible!", author: "Sarah Chen", role: "Product Designer" },
                { quote: "I went from 0 responses to multiple offers. This tool is a game-changer for job seekers.", author: "Michael Torres", role: "Software Engineer" },
                { quote: "The automated follow-ups kept me organized and professional. Highly recommend!", author: "Emily Rodriguez", role: "Marketing Manager" },
                { quote: "Best investment in my career. The AI actually understands what recruiters want to see.", author: "David Kim", role: "Data Analyst" },
              ].map((testimonial, i) => (
                <div key={i} className="glass-panel w-80 p-6 rounded-xl flex-shrink-0">
                  <p className="text-sm text-gray-300 mb-4">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                    <div>
                      <div className="text-xs font-bold">{testimonial.author}</div>
                      <div className="text-[10px] text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-32 max-w-3xl mx-auto px-4">
          <h2 className="text-4xl font-display font-bold mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "How does the AI resume tailoring work?",
                a: "Our AI analyzes the job description and your base resume, then intelligently rewrites and reorganizes your experience to highlight the most relevant skills and keywords for that specific role."
              },
              {
                q: "Is my data secure?",
                a: "Absolutely. We use enterprise-grade encryption and never share your personal information with third parties. Your resumes and application data are stored securely and are only accessible by you."
              },
              {
                q: "Can I review applications before they're sent?",
                a: "Yes! You have full control. You can set the system to require your approval before any application is submitted, or let it run on autopilot."
              }
            ].map((faq, i) => (
              <details key={i} className="group glass-panel rounded-lg open:bg-white/5 transition-all">
                <summary className="flex cursor-pointer items-center justify-between p-6 font-medium text-white">
                  {faq.q}
                  <span className="transition group-open:rotate-180">
                    <ChevronDown className="w-5 h-5" />
                  </span>
                </summary>
                <div className="px-6 pb-6 text-gray-400 text-sm leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>


      </main>

      {/* Footer CTA */}
      <section className="relative py-32 text-center">
        <div className="relative z-10 max-w-2xl mx-auto px-4">
          <h2 className="text-5xl md:text-7xl font-display font-bold mb-8 tracking-tight">
            Ready to get <br />
            <span className="text-gradient-primary">hired?</span>
          </h2>
          <p className="text-xl text-gray-400 mb-10">Join thousands who automated their job search.</p>
          <Link href="/auth/signup">
            <button className="px-10 py-5 bg-white text-black text-lg font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_60px_rgba(255,255,255,0.4)] [text-shadow:_0_0_1px_rgb(0_0_0_/_40%)]">
              Start Automating Now
            </button>
          </Link>
        </div>
      </section>

      <Footer />

      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }

        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }

        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animate-scan {
          animation: scan 3s ease-in-out infinite;
        }

        .animate-scroll {
          animation: scroll 40s linear infinite;
        }

        .bg-grid-pattern {
          background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          mask-image: radial-gradient(circle at center, black 40%, transparent 80%);
        }

        .text-gradient-primary {
          background: linear-gradient(135deg, #fff 0%, #a5b4fc 50%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glass-panel {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
        }

        .dashboard-sidebar-link {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          color: #94a3b8;
          border-radius: 0.5rem;
          transition: all 0.2s;
          font-size: 0.9rem;
        }

        .dashboard-sidebar-link:hover,
        .dashboard-sidebar-link.active {
          background: rgba(99, 102, 241, 0.1);
          color: white;
        }

        .dashboard-sidebar-link.active {
          border-left: 3px solid #6366f1;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-applied {
          background: rgba(59, 130, 246, 0.2);
          color: #93c5fd;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .status-interview {
          background: rgba(168, 85, 247, 0.2);
          color: #e9d5ff;
          border: 1px solid rgba(168, 85, 247, 0.3);
        }
      `}</style>
    </div>
  );
}