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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-deep)] text-[var(--text-main)] selection:bg-[var(--primary-dim)] selection:text-white overflow-x-hidden">

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 px-4 sm:px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-sm text-[var(--text-muted)] mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
          </span>
          AI-Powered Job Search Automation
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 text-[var(--text-main)]">
          Career Growth, <br />
          <span className="text-[var(--primary)]">On Autopilot.</span>
        </h1>

        <p className="text-lg sm:text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
          The AI agent that tailors your resume for every application, tracks opportunities, and manages follow-ups while you focus on interviews.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/auth/signup">
            <button className="px-8 py-4 bg-[var(--primary)] text-black rounded-full font-semibold hover:bg-[var(--primary-dim)] transition-colors flex items-center gap-2">
              Start Free Trial
              <Zap className="w-4 h-4" />
            </button>
          </Link>
          <button className="px-8 py-4 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-light)] transition-colors flex items-center gap-2 text-[var(--text-main)] font-medium">
            <PlayCircle className="w-5 h-5" />
            Watch Demo
          </button>
        </div>

        {/* Social Proof */}
        <div className="mt-20 pt-10 border-t border-[var(--border)]">
          <p className="text-sm text-[var(--text-muted)] mb-6 uppercase tracking-wider">Trusted by job seekers at</p>
          <div className="flex justify-center items-center gap-8 sm:gap-12 flex-wrap opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <span className="text-xl font-bold">Google</span>
            <span className="text-xl font-bold">Meta</span>
            <span className="text-xl font-bold">Amazon</span>
            <span className="text-xl font-bold">Microsoft</span>
            <span className="text-xl font-bold">Apple</span>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section id="dashboard-preview" className="py-20 px-4 bg-[var(--bg-surface)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Mission Control for Your Career</h2>
            <p className="text-[var(--text-muted)]">A real-time view of your automated job hunt.</p>
          </div>

          {/* Dashboard Mockup */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] shadow-2xl overflow-hidden">
            {/* Window Controls */}
            <div className="h-10 bg-[var(--bg-light)] border-b border-[var(--border)] flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
              </div>
            </div>

            <div className="flex h-[600px]">
              {/* Sidebar Mockup */}
              <div className="w-64 border-r border-[var(--border)] bg-[var(--bg-surface)] p-4 hidden md:flex flex-col gap-2">
                <div className="flex items-center gap-3 px-3 py-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-md font-medium">
                  <LayoutDashboard className="w-4 h-4" /> Overview
                </div>
                <div className="flex items-center gap-3 px-3 py-2 text-[var(--text-muted)] hover:bg-[var(--bg-light)] rounded-md transition-colors">
                  <Briefcase className="w-4 h-4" /> Applications
                </div>
                <div className="flex items-center gap-3 px-3 py-2 text-[var(--text-muted)] hover:bg-[var(--bg-light)] rounded-md transition-colors">
                  <FileText className="w-4 h-4" /> Resumes
                </div>
                <div className="flex items-center gap-3 px-3 py-2 text-[var(--text-muted)] hover:bg-[var(--bg-light)] rounded-md transition-colors">
                  <Send className="w-4 h-4" /> Follow-ups
                </div>
              </div>

              {/* Main Content Mockup */}
              <div className="flex-1 p-8 bg-[var(--bg-deep)] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
                    <p className="text-[var(--text-muted)] text-sm mb-1">Applications Sent</p>
                    <p className="text-3xl font-bold">87</p>
                    <div className="flex items-center mt-2 text-xs text-[var(--success)]">
                      <TrendingUp className="w-3 h-3 mr-1" /> +18% this week
                    </div>
                  </div>
                  <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
                    <p className="text-[var(--text-muted)] text-sm mb-1">Profile Views</p>
                    <p className="text-3xl font-bold">342</p>
                    <div className="flex items-center mt-2 text-xs text-[var(--success)]">
                      <TrendingUp className="w-3 h-3 mr-1" /> High visibility
                    </div>
                  </div>
                  <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
                    <p className="text-[var(--text-muted)] text-sm mb-1">Interviews</p>
                    <p className="text-3xl font-bold">5</p>
                    <div className="flex items-center mt-2 text-xs text-[var(--secondary)]">
                      <span className="w-2 h-2 bg-[var(--secondary)] rounded-full mr-2"></span> 2 Scheduled
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
                  <div className="p-4 border-b border-[var(--border)] font-semibold">Recent Applications</div>
                  <div className="divide-y divide-[var(--border)]">
                    {[
                      { company: 'Google', role: 'Senior Product Designer', status: 'Interview', date: '2h ago' },
                      { company: 'Meta', role: 'UX Engineer', status: 'Applied', date: '5h ago' },
                      { company: 'Amazon', role: 'Design Lead', status: 'Applied', date: '1d ago' }
                    ].map((app, i) => (
                      <div key={i} className="p-4 flex items-center justify-between hover:bg-[var(--bg-light)] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded bg-[var(--bg-light)] flex items-center justify-center font-bold text-[var(--text-muted)]">
                            {app.company[0]}
                          </div>
                          <div>
                            <div className="font-medium">{app.role}</div>
                            <div className="text-xs text-[var(--text-muted)]">{app.company}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-[var(--text-muted)] font-mono">{app.date}</span>
                          <span className={`text-xs px-2 py-1 rounded-full border ${app.status === 'Interview'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
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

      {/* Stats Section */}
      <section className="py-20 bg-[var(--bg-surface)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Active Users', value: '50K+' },
              { label: 'Applications Sent', value: '2M+' },
              { label: 'Success Rate', value: '87%' },
              { label: 'Avg. Time to Offer', value: '14 Days' }
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl md:text-5xl font-bold text-[var(--text-main)] mb-2">{stat.value}</div>
                <div className="text-[var(--text-muted)]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Loved by Job Seekers Worldwide</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { quote: "Applytron helped me land 3 interviews in my first week. The resume tailoring is incredible!", author: "Sarah Chen", role: "Product Designer" },
            { quote: "I went from 0 responses to multiple offers. This tool is a game-changer for job seekers.", author: "Michael Torres", role: "Software Engineer" },
            { quote: "The automated follow-ups kept me organized and professional. Highly recommend!", author: "Emily Rodriguez", role: "Marketing Manager" },
            { quote: "Best investment in my career. The AI actually understands what recruiters want to see.", author: "David Kim", role: "Data Analyst" },
          ].map((testimonial, i) => (
            <div key={i} className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--primary)]/30 transition-colors">
              <p className="text-[var(--text-muted)] text-sm mb-4 leading-relaxed">"{testimonial.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--bg-light)]"></div>
                <div>
                  <div className="text-sm font-bold">{testimonial.author}</div>
                  <div className="text-xs text-[var(--text-muted)]">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

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