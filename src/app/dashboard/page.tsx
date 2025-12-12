'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import {
  Briefcase,
  Target,
  TrendingUp,
  Users,
  Calendar,
  MapPin,
  Brain,
  Bell,
  Clock,
  ExternalLink,
  ArrowUpRight
} from 'lucide-react';
import ErrorState from '@/components/ui/ErrorState';
import DashboardSkeleton from '@/components/ui/DashboardSkeleton';
import { useSession } from 'next-auth/react';

// --- Type Definitions ---
interface JobStats {
  totalApplications: number;
  activeApplications: number;
  interviews: number;
  offers: number;
  responseRate: number;
}
interface UserProfile {
  firstName: string;
  targetRole: string;
  location: string;
}
interface ApplicationTrendData {
  date: string;
  applications: number;
  interviews: number;
}
interface ApplicationStatus {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}
interface TopSkill {
  id: number;
  skill: string;
}
interface UpcomingReminder {
  _id: string;
  title: string;
  dueDate: string;
}
interface DashboardData {
  jobStats: JobStats;
  applicationStatus: ApplicationStatus[];
  applicationTrendData: ApplicationTrendData[];
  userProfile: UserProfile;
  upcomingReminders: UpcomingReminder[];
  topSkills: TopSkill[];
}

// --- Recharts Custom Components ---
interface TooltipEntry {
  color: string;
  name: string;
  value: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] p-3 rounded-lg shadow-xl text-sm">
        <p className="font-semibold text-[var(--text-main)] mb-2">{`Date: ${label}`}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }} className="font-medium">{`${entry.name}: ${entry.value}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

// --- Widget Components ---

const StatCard = ({ title, value, icon, link, children }: { title: string, value: string | number, icon: React.ReactNode, link: string, children: React.ReactNode }) => (
  <Link href={link} className="block h-full group">
    <div className="bg-[var(--bg-surface)] hover:bg-slate-700 transition-all duration-200 rounded-xl border border-[var(--border)] p-6 flex flex-col justify-between h-full group-hover:border-[var(--primary)]/30">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-[var(--bg-light)] rounded-lg text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors">
            {icon}
          </div>
          <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="text-3xl font-bold text-[var(--text-main)] mb-1">
          {value}
        </div>
        <h3 className="text-sm font-medium text-[var(--text-muted)]">{title}</h3>
      </div>
      <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-2">
        {children}
      </div>
    </div>
  </Link>
);


const DashboardPage = () => {
  const { status } = useSession({ required: true });
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (status !== 'authenticated') return;
    setLoading(true);
    setError(null);

    try {
      // Try the full stats API first with stronger cache busting
      let response = await fetch('/api/dashboard/stats?' + new URLSearchParams({
        t: Date.now().toString(),
        bust: Math.random().toString()
      }), {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      // If that fails, try the simple stats API
      if (!response.ok) {
        console.warn('Full stats API failed, trying simple stats API');
        response = await fetch('/api/dashboard/simple-stats?' + new URLSearchParams({
          t: Date.now().toString(),
          bust: Math.random().toString()
        }), {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch dashboard data. Status: ${response.status}`);
      }

      const fetchedData: DashboardData = await response.json();
      setData(fetchedData);
    } catch (e) {
      console.error('Dashboard data fetch error:', e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add a refresh function for manual refresh
  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  if (status === "loading" || loading) {
    return (
      <AppLayout showFooter={false}>
        <DashboardSkeleton />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout showFooter={false}>
        <div className="p-4 md:p-8 bg-[var(--bg-deep)] min-h-screen">
          <ErrorState
            title="Dashboard Error"
            message={error}
            onRetry={fetchData}
            showHomeButton={true}
            className="min-h-[60vh]"
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showFooter={false}>
      <div className="p-4 md:p-8 bg-[var(--bg-deep)] min-h-screen text-[var(--text-main)]">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                Welcome back, <span className="text-[var(--primary)]">{data?.userProfile?.firstName || 'User'}</span>
              </h1>
              <p className="text-[var(--text-muted)] text-lg">Here's your job search progress and insights.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--bg-surface)] hover:bg-slate-700 text-[var(--text-main)] rounded-lg transition-colors font-medium border border-[var(--border)]"
              >
                <TrendingUp className="w-4 h-4" />
                Refresh Data
              </button>
               <Link href="/application-tracking" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-dim)] text-black rounded-lg transition-colors font-medium shadow-sm">
                <Briefcase className="w-4 h-4" />
                Manage Applications
              </Link>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Stat: Total Applications */}
            <StatCard title="Total Applications" value={data?.jobStats.totalApplications ?? 0} icon={<Briefcase className="w-5 h-5" />} link="/application-tracking">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Active</span>
                <span className="text-[var(--success)] font-medium">{data?.jobStats.activeApplications ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Response Rate</span>
                <span className="text-[var(--primary)] font-medium">{data?.jobStats.responseRate ?? 0}%</span>
              </div>
            </StatCard>

            {/* Stat: Interviews */}
            <StatCard title="Interviews" value={data?.jobStats.interviews ?? 0} icon={<Calendar className="w-5 h-5" />} link="/events">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Offers</span>
                <span className="text-[var(--success)] font-medium">{data?.jobStats.offers ?? 0}</span>
              </div>
              <div className="w-full bg-[var(--bg-deep)] rounded-full h-1.5 mt-2">
                <div className="bg-[var(--success)] h-1.5 rounded-full" style={{ width: `${Math.min(data?.jobStats.responseRate || 0, 100)}%` }}></div>
              </div>
            </StatCard>

            {/* Profile Snapshot */}
            <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-6 flex flex-col justify-center h-full">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-[var(--primary)]" /> Profile Snapshot</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--bg-light)]/50">
                  <Target className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="font-medium truncate">{data?.userProfile?.targetRole || 'Job Seeker'}</span>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--bg-light)]/50">
                  <MapPin className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="font-medium truncate">{data?.userProfile?.location || 'Remote'}</span>
                </div>
              </div>
            </div>

            {/* Upcoming Reminders */}
            <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-6 flex flex-col h-full">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-[var(--warning)]" /> Reminders</h3>
              <div className="space-y-2 flex-grow overflow-y-auto custom-scrollbar max-h-[120px]">
                {data?.upcomingReminders && data.upcomingReminders.length > 0 ? (
                  data.upcomingReminders.map(r => (
                     <Link key={r._id} href="/reminders" className="flex items-center gap-3 p-2.5 bg-[var(--bg-light)]/30 hover:bg-slate-700 rounded-lg transition-colors group">
                      <Clock className="w-4 h-4 text-[var(--warning)] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate group-hover:text-[var(--primary)] transition-colors">{r.title}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{new Date(r.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center text-sm text-[var(--text-muted)] py-4">No upcoming reminders.</div>
                )}
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            {/* Activity Chart */}
            <div className="lg:col-span-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-6">
              <h3 className="text-lg font-semibold mb-6">Application Activity</h3>
              <div className="h-[300px] w-full">
                {data?.applicationTrendData && data.applicationTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.applicationTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'var(--bg-light)', opacity: 0.4 }}
                      />
                      <Bar
                        dataKey="applications"
                        fill="var(--primary)"
                        name="Applications"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                      />
                      <Bar
                        dataKey="interviews"
                        fill="var(--success)"
                        name="Interviews"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[var(--text-muted)]">No activity data for this period.</div>
                )}
              </div>
            </div>

            {/* Status Pie Chart */}
            <div className="lg:col-span-1 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-6">
              <h3 className="text-lg font-semibold mb-2">Status</h3>
              <div className="h-[300px] w-full">
                {data?.applicationStatus && data.applicationStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.applicationStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                      >
                        {data.applicationStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '12px', color: 'var(--text-muted)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[var(--text-muted)]">No application data yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* Top Skills */}
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Brain className="w-5 h-5 text-[var(--secondary)]" /> Top Skills</h3>
            <div className="flex flex-wrap gap-2">
              {data?.topSkills && data.topSkills.length > 0 ? (
                data.topSkills.map(skill => (
                   <Link key={skill.id} href={`/job-search?q=${encodeURIComponent(skill.skill)}`} className="px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--bg-light)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-slate-700 transition-colors border border-[var(--border)] hover:border-[var(--primary)]/30">
                    {skill.skill}
                  </Link>
                ))
              ) : (
                <p className="text-[var(--text-muted)] text-sm">Add resumes to see your top skills here.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
