'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from 'antd';
import {
  ArrowRight,
  PlayCircle,
  Briefcase,
  FileText,
  Send,
  LayoutDashboard,
  TrendingUp,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import Footer from '@/components/landing/Footer';
import Navbar from '@/components/landing/Navbar';
import Stats from '@/components/landing/Stats';
import Testimonials from '@/components/landing/Testimonials';
import LiveFeed from '@/components/landing/LiveFeed';

const FEATURES = [
  {
    n: '01',
    title: 'Smart resume tailoring',
    body: 'Upload one base resume. Applytron reads each job post and rewrites your resume to match the skills and keywords that role asks for, so more of your applications get past the filters.',
    points: ['Rewrites for each job', 'Matches the keywords', 'Stays ATS-friendly'],
    icon: FileText,
  },
  {
    n: '02',
    title: 'Applies for you',
    body: 'Set what you want once. Applytron finds roles that fit and sends tailored applications around the clock. Want the final say? Turn on approval and review each one before it goes out.',
    points: ['Finds matching roles', 'Sends tailored applications', 'Approve before sending'],
    icon: Send,
  },
  {
    n: '03',
    title: 'Follows up on time',
    body: 'Every application gets tracked and nudged at the right moment, so you stay on the recruiter’s radar without keeping a spreadsheet or setting reminders yourself.',
    points: ['Nudges at the right time', 'Uses your voice', 'Tracks every reply'],
    icon: TrendingUp,
  },
];

const FAQS = [
  {
    q: 'How does the AI resume tailoring work?',
    a: 'Applytron reads the job description alongside your base resume, then rewrites and reorders your experience to surface the skills and keywords that matter most for that specific role.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. Your resumes and application data are encrypted, never sold, and only accessible by you.',
  },
  {
    q: 'Can I review applications before they are sent?',
    a: 'You are in control. Ask it to check with you before each application, or let it run on full autopilot. You can set this per search.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-deep)] text-[var(--text-main)]">
      <Navbar />

      {/* Hero */}
      <section className="relative px-6 pt-32 pb-24 md:pt-40 md:pb-28">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 lg:gap-16 items-center">
          {/* Left: thesis */}
          <div>
            <div className="inline-flex items-center gap-2 mb-7">
              <span className="w-2 h-2 rounded-full bg-[var(--live)] animate-pulse" />
              <span className="font-mono-ui text-xs tracking-[0.2em] uppercase text-[var(--text-muted)]">
                Applications on autopilot
              </span>
            </div>

            <h1 className="font-display font-extrabold tracking-tight text-5xl sm:text-6xl md:text-7xl leading-[0.98] mb-6">
              Your job search,
              <br />
              <span className="text-[var(--accent)]">on autopilot.</span>
            </h1>

            <p className="text-lg sm:text-xl text-[var(--text-muted)] leading-relaxed max-w-xl mb-10">
              Applytron tailors your resume, applies to the roles that fit, and
              follows up for you while you sleep, network, or interview. You stay
              in control. The busywork runs itself.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/signup">
                <Button
                  type="primary"
                  size="large"
                  shape="round"
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="end"
                  className="!h-12 !px-8 !font-semibold w-full sm:w-auto"
                >
                  Start automating
                </Button>
              </Link>
              <Button
                size="large"
                shape="round"
                icon={<PlayCircle className="w-4 h-4" />}
                className="!h-12 !px-8 w-full sm:w-auto"
              >
                Watch demo
              </Button>
            </div>
          </div>

          {/* Right: signature live feed */}
          <div className="lg:pl-4">
            <LiveFeed />
          </div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section id="dashboard-preview" className="px-6 py-24 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="font-mono-ui text-xs tracking-[0.2em] uppercase text-[var(--text-muted)]">
              Mission control
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3">
              One view of your entire hunt
            </h2>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden shadow-2xl shadow-black/40">
            {/* Window controls */}
            <div className="h-10 flex items-center px-4 gap-1.5 border-b border-[var(--border)] bg-[var(--bg-raised)]">
              <span className="w-3 h-3 rounded-full bg-[var(--border-strong)]" />
              <span className="w-3 h-3 rounded-full bg-[var(--border-strong)]" />
              <span className="w-3 h-3 rounded-full bg-[var(--border-strong)]" />
            </div>

            <div className="flex min-h-[560px]">
              {/* Sidebar */}
              <div className="w-60 shrink-0 border-r border-[var(--border)] bg-[var(--bg-deep)] p-4 hidden md:flex flex-col gap-1">
                {[
                  { icon: LayoutDashboard, label: 'Overview', active: true },
                  { icon: Briefcase, label: 'Applications' },
                  { icon: FileText, label: 'Resumes' },
                  { icon: Send, label: 'Follow-ups' },
                ].map(({ icon: Icon, label, active }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                      active
                        ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-medium'
                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-raised)]'
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </div>
                ))}
              </div>

              {/* Main */}
              <div className="flex-1 p-6 md:p-8 overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  {[
                    { label: 'Applications sent', value: '87', note: '+18% this week' },
                    { label: 'Profile views', value: '342', note: 'High visibility' },
                    { label: 'Interviews', value: '5', note: '2 scheduled' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="p-5 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)]"
                    >
                      <p className="text-[var(--text-muted)] text-sm mb-1">{stat.label}</p>
                      <p className="font-display text-3xl font-bold">{stat.value}</p>
                      <p className="mt-2 font-mono-ui text-xs text-[var(--text-dim)]">{stat.note}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[var(--border)] font-medium bg-[var(--bg-deep)]">
                    Recent applications
                  </div>
                  <div className="divide-y divide-[var(--border)]">
                    {[
                      { company: 'Google', role: 'Senior Product Designer', status: 'Interview', date: '2h ago' },
                      { company: 'Meta', role: 'UX Engineer', status: 'Applied', date: '5h ago' },
                      { company: 'Amazon', role: 'Design Lead', status: 'Applied', date: '1d ago' },
                    ].map((app) => (
                      <div
                        key={app.company}
                        className="px-4 py-3 flex items-center justify-between bg-[var(--bg-surface)]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded bg-[var(--bg-raised)] flex items-center justify-center font-semibold text-[var(--text-muted)]">
                            {app.company[0]}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{app.role}</div>
                            <div className="text-xs text-[var(--text-muted)]">{app.company}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono-ui text-xs text-[var(--text-dim)]">{app.date}</span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full border ${
                              app.status === 'Interview'
                                ? 'border-[var(--accent)] text-[var(--accent)]'
                                : 'border-[var(--border-strong)] text-[var(--text-muted)]'
                            }`}
                          >
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

      {/* Features: a real sequence, so numbering earns its place */}
      <section id="features" className="px-6 py-24 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-mono-ui text-xs tracking-[0.2em] uppercase text-[var(--text-muted)]">
              How it runs
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3">
              Three steps, then hands-off
            </h2>
          </div>

          <div className="space-y-6">
            {FEATURES.map(({ n, title, body, points, icon: Icon }) => (
              <div
                key={n}
                className="grid md:grid-cols-[auto_1fr] gap-6 md:gap-10 p-6 md:p-8 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]"
              >
                <div className="font-mono-ui text-4xl md:text-5xl font-bold text-[var(--accent)] leading-none">
                  {n}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Icon className="w-5 h-5 text-[var(--accent)]" />
                    <h3 className="font-display text-2xl font-bold">{title}</h3>
                  </div>
                  <p className="text-[var(--text-muted)] leading-relaxed mb-5 max-w-2xl">
                    {body}
                  </p>
                  <ul className="flex flex-wrap gap-x-6 gap-y-2">
                    {points.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                        <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Stats />

      <Testimonials />

      {/* FAQ */}
      <section className="px-6 py-24 border-t border-[var(--border)]">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-bold mb-12 text-center">
            Frequently asked
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]"
              >
                <summary className="flex cursor-pointer items-center justify-between p-5 font-medium list-none">
                  {faq.q}
                  <ChevronDown className="w-5 h-5 text-[var(--text-muted)] transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-5 text-[var(--text-muted)] text-sm leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-28 border-t border-[var(--border)] text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-5 tracking-tight">
            Ready to get <span className="text-[var(--accent)]">hired?</span>
          </h2>
          <p className="text-lg text-[var(--text-muted)] mb-10">
            Point Applytron at the jobs you want. Let it do the applying.
          </p>
          <Link href="/auth/signup">
            <Button
              type="primary"
              size="large"
              shape="round"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="end"
              className="!h-12 !px-9 !font-semibold"
            >
              Start automating
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
