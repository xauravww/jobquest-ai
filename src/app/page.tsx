'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Zap,
  PlayCircle,
  Briefcase,
  FileText,
  Send,
  LayoutDashboard,
  TrendingUp,
  Eye,
  MessageSquare,
  CheckCircle2,
  Bot,
  ChevronDown
} from 'lucide-react';
import Footer from '@/components/landing/Footer';
import Navbar from '@/components/landing/Navbar';
import Stats from '@/components/landing/Stats';
import Testimonials from '@/components/landing/Testimonials';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-deep)] text-[var(--text-main)] selection:bg-[var(--primary-dim)] selection:text-white overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 overflow-hidden pt-24">
        {/* Enhanced Background Atmosphere */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--primary)]/3 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--secondary)]/4 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--success)]/2 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        {/* Floating Automation Icon */}
        <div className="absolute top-32 right-16 opacity-20 animate-bounce" style={{animationDuration: '3s'}}>
          <Bot className="w-16 h-16 text-[var(--primary)]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">


          {/* Impactful Headline */}
          <h1 className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter mb-10 leading-none pt-12 text-center">
            <span className="block text-[var(--text-main)] mb-2">Dream Job,</span>
            <span className="block relative">
              <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
                Auto-Applied.
              </span>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-full opacity-60"></div>
            </span>
          </h1>

          {/* Powerful Subtext */}
          <div className="max-w-3xl mx-auto mb-20 text-center">
            <p className="text-2xl sm:text-3xl text-[var(--text-muted)] leading-relaxed mb-4">
              AI applies to jobs for you while you sleep, network, or interview. Your career runs on autopilot.
            </p>
            <p className="text-lg text-[var(--text-muted)]/70 leading-relaxed">
              Custom resumes, automatic applications, smart follow-ups. Never miss an opportunity again.
            </p>
          </div>

          {/* Dynamic CTAs */}
          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-24">
            <Link href="/auth/signup">
              <button className="group relative px-12 py-6 bg-[var(--primary)] text-black rounded-full font-bold text-lg hover:bg-[var(--primary-dim)] transition-all duration-300 shadow-xl hover:shadow-[var(--primary)]/30 hover:scale-105 flex items-center gap-3 overflow-hidden">
                <span className="relative z-10">Begin Automation</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:animate-pulse"></div>
              </button>
            </Link>
            <button className="group px-8 py-4 rounded-full border-2 border-[var(--border)] bg-[var(--bg-surface)]/80 backdrop-blur-sm hover:bg-[var(--bg-surface)] transition-all duration-300 flex items-center gap-2 text-[var(--text-main)] font-semibold text-base hover:scale-105">
              <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Watch the Magic
            </button>
          </div>

          {/* Integrated Social Proof */}
          <div className="grid grid-cols-3 gap-12 max-w-2xl mx-auto opacity-60 hover:opacity-90 transition-opacity duration-700">
            <div className="text-center group">
              <div className="text-4xl font-black text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors">50K+</div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mt-1">Careers Automated</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-black text-[var(--text-main)] group-hover:text-[var(--secondary)] transition-colors">2M+</div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mt-1">Apps Sent</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-black text-[var(--text-main)] group-hover:text-[var(--success)] transition-colors">87%</div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mt-1">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section id="dashboard-preview" className="py-20 px-4 bg-gradient-to-br from-black via-slate-950 to-black relative overflow-hidden">
        {/* Premium Atmospheric Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-emerald-500/8 to-green-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        {/* Animated Grid Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '20px 20px'}}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">Mission Control for Your Career</h2>
            <p className="text-slate-300">A real-time view of your automated job hunt.</p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400 font-mono">LIVE</span>
            </div>
          </div>

          {/* Dashboard Mockup */}
          <div className="rounded-xl border border-slate-600 bg-slate-950 shadow-2xl overflow-hidden">
            {/* Window Controls */}
            <div className="h-10 bg-slate-800 border-b border-slate-600 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/30 border border-red-500/60"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/30 border border-yellow-500/60"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/30 border border-green-500/60 animate-pulse"></div>
              </div>
            </div>

            <div className="flex h-[600px]">
              {/* Sidebar Mockup */}
              <div className="w-64 border-r border-slate-600 bg-slate-900 p-4 hidden md:flex flex-col gap-2">
                <div className="flex items-center gap-3 px-3 py-2 bg-cyan-500/20 text-cyan-400 rounded-md font-medium border border-cyan-500/30">
                  <LayoutDashboard className="w-4 h-4" /> Overview
                </div>
                <div className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-slate-800 rounded-md transition-colors">
                  <Briefcase className="w-4 h-4" /> Applications
                </div>
                <div className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-slate-800 rounded-md transition-colors">
                  <FileText className="w-4 h-4" /> Resumes
                </div>
                <div className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-slate-800 rounded-md transition-colors">
                  <Send className="w-4 h-4" /> Follow-ups
                </div>
              </div>

              {/* Main Content Mockup */}
              <div className="flex-1 p-8 bg-slate-950 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="p-6 rounded-xl border border-slate-600 bg-slate-900 hover:bg-slate-800 transition-colors">
                    <p className="text-slate-400 text-sm mb-1">Applications Sent</p>
                    <p className="text-3xl font-bold text-white">87</p>
                    <div className="flex items-center mt-2 text-xs text-green-400">
                      <TrendingUp className="w-3 h-3 mr-1" /> +18% this week
                    </div>
                  </div>
                  <div className="p-6 rounded-xl border border-slate-600 bg-slate-900 hover:bg-slate-800 transition-colors">
                    <p className="text-slate-400 text-sm mb-1">Profile Views</p>
                    <p className="text-3xl font-bold text-white">342</p>
                    <div className="flex items-center mt-2 text-xs text-green-400">
                      <TrendingUp className="w-3 h-3 mr-1" /> High visibility
                    </div>
                  </div>
                  <div className="p-6 rounded-xl border border-slate-600 bg-slate-900 hover:bg-slate-800 transition-colors">
                    <p className="text-slate-400 text-sm mb-1">Interviews</p>
                    <p className="text-3xl font-bold text-white">5</p>
                    <div className="flex items-center mt-2 text-xs text-blue-400">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span> 2 Scheduled
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-600 bg-slate-900 overflow-hidden">
                  <div className="p-4 border-b border-slate-600 font-semibold text-white">Recent Applications</div>
                  <div className="divide-y divide-slate-700">
                    {[
                      { company: 'Google', role: 'Senior Product Designer', status: 'Interview', date: '2h ago' },
                      { company: 'Meta', role: 'UX Engineer', status: 'Applied', date: '5h ago' },
                      { company: 'Amazon', role: 'Design Lead', status: 'Applied', date: '1d ago' }
                    ].map((app, i) => (
                      <div key={i} className="p-4 flex items-center justify-between bg-slate-900/30 hover:bg-slate-800 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                            {app.company[0]}
                          </div>
                          <div>
                            <div className="font-medium text-white">{app.role}</div>
                            <div className="text-xs text-slate-400">{app.company}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-slate-400 font-mono">{app.date}</span>
                          <span className={`text-xs px-2 py-1 rounded-full border ${app.status === 'Interview'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">AI-Powered Career Acceleration</h2>
          <p className="text-[var(--text-muted)] text-lg">Three steps to complete automation.</p>
        </div>

        <div className="space-y-24">
          {/* Feature 1 */}
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] font-mono text-lg font-bold">
                01
              </div>
              <h3 className="text-3xl font-bold">Smart Resume Tailoring</h3>
              <p className="text-[var(--text-muted)] text-lg leading-relaxed">
                Upload your base resume. Our AI analyzes each job description and automatically customizes your resume to match keywords, skills, and requirements—increasing your ATS pass rate dramatically.
              </p>
              <ul className="space-y-3">
                {['Context-aware rewriting', 'Keyword optimization', 'ATS-friendly formatting'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[var(--text-muted)]">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)]" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)]">
              <div className="aspect-video relative rounded-lg overflow-hidden bg-[var(--bg-deep)] border border-[var(--border)] flex items-center justify-center">
                <FileText className="w-16 h-16 text-[var(--text-muted)] opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--primary)]/5 to-transparent"></div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center text-[var(--secondary)] font-mono text-lg font-bold">
                02
              </div>
              <h3 className="text-3xl font-bold">Automated Follow-ups</h3>
              <p className="text-[var(--text-muted)] text-lg leading-relaxed">
                Never miss a follow-up again. Applytron tracks all your applications and automatically sends personalized follow-up emails at the optimal time to keep you top of mind.
              </p>
              <ul className="space-y-3">
                {['Smart timing algorithms', 'Personalized templates', 'Multi-channel outreach'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[var(--text-muted)]">
                    <CheckCircle2 className="w-5 h-5 text-[var(--secondary)]" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)]">
              <div className="aspect-video relative rounded-lg overflow-hidden bg-[var(--bg-deep)] border border-[var(--border)] flex items-center justify-center">
                <Send className="w-16 h-16 text-[var(--text-muted)] opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--secondary)]/5 to-transparent"></div>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center text-[var(--success)] font-mono text-lg font-bold">
                03
              </div>
              <h3 className="text-3xl font-bold">Real-Time Analytics</h3>
              <p className="text-[var(--text-muted)] text-lg leading-relaxed">
                Track your job search performance with detailed analytics. See which applications get responses, optimize your approach, and land more interviews faster.
              </p>
              <ul className="space-y-3">
                {['Response rate tracking', 'Interview conversion metrics', 'Performance insights'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[var(--text-muted)]">
                    <CheckCircle2 className="w-5 h-5 text-[var(--success)]" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)]">
              <div className="aspect-video relative rounded-lg overflow-hidden bg-[var(--bg-deep)] border border-[var(--border)] flex items-center justify-center">
                <TrendingUp className="w-16 h-16 text-[var(--text-muted)] opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--success)]/5 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Stats />

      <Testimonials />

      {/* FAQ Section */}
      <section className="py-24 px-4 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
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
            <details key={i} className="group rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] open:bg-[var(--bg-light)]/50 transition-all">
              <summary className="flex cursor-pointer items-center justify-between p-6 font-medium">
                {faq.q}
                <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180 text-[var(--text-muted)]" />
              </summary>
              <div className="px-6 pb-6 text-[var(--text-muted)] text-sm leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 text-center px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-5xl font-bold mb-6 tracking-tight">
            Ready to get <span className="text-[var(--primary)]">hired?</span>
          </h2>
          <p className="text-xl text-[var(--text-muted)] mb-10">Join thousands who automated their job search.</p>
          <Link href="/auth/signup">
            <button className="px-10 py-5 bg-[var(--text-main)] text-[var(--bg-deep)] text-lg font-bold rounded-full hover:scale-105 transition-transform">
              Start Automating Now
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}