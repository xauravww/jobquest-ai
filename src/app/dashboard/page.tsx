'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import {
  Briefcase,
  Search,
  Target,
  TrendingUp,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  Brain,
  Bell,
  AlertTriangle,
  FileText,
  Clock,
  ExternalLink
} from 'lucide-react';
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

const ResponsiveGridLayout = WidthProvider(Responsive);

// --- Responsive Layout Definitions ---
const layouts = {
  lg: [
    { i: 'stats-total', x: 0, y: 0, w: 3, h: 2 },
    { i: 'stats-interviews', x: 3, y: 0, w: 3, h: 2 },
    { i: 'profile', x: 6, y: 0, w: 3, h: 2 },
    { i: 'reminders', x: 9, y: 0, w: 3, h: 2 },
    { i: 'activity-chart', x: 0, y: 2, w: 8, h: 4 },
    { i: 'status-pie', x: 8, y: 2, w: 4, h: 4 },
    { i: 'skills', x: 0, y: 6, w: 12, h: 2 },
  ],
  md: [
    { i: 'stats-total', x: 0, y: 0, w: 5, h: 2 },
    { i: 'stats-interviews', x: 5, y: 0, w: 5, h: 2 },
    { i: 'profile', x: 0, y: 2, w: 5, h: 2 },
    { i: 'reminders', x: 5, y: 2, w: 5, h: 2 },
    { i: 'activity-chart', x: 0, y: 4, w: 10, h: 4 },
    { i: 'status-pie', x: 0, y: 8, w: 10, h: 4 },
    { i: 'skills', x: 0, y: 12, w: 10, h: 2 },
  ],
  sm: [
    { i: 'stats-total', x: 0, y: 0, w: 6, h: 2 },
    { i: 'stats-interviews', x: 0, y: 2, w: 6, h: 2 },
    { i: 'profile', x: 0, y: 4, w: 6, h: 2 },
    { i: 'reminders', x: 0, y: 6, w: 6, h: 2 },
    { i: 'activity-chart', x: 0, y: 8, w: 6, h: 4 },
    { i: 'status-pie', x: 0, y: 12, w: 6, h: 4 },
    { i: 'skills', x: 0, y: 16, w: 6, h: 2 },
  ],
};


// --- Recharts Custom Components ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-light/80 backdrop-blur-sm border border-border p-3 rounded-lg shadow-lg text-sm">
        <p className="font-bold text-white mb-2">{`Date: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>{`${entry.name}: ${entry.value}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

// --- Widget Components ---

const WidgetSkeleton = () => (
    <div className="bg-bg-card rounded-xl p-6 h-full flex items-center justify-center animate-pulse">
        <div className="w-8 h-8 bg-bg-light rounded-full"></div>
    </div>
);

const StatCard = ({ title, value, icon, link, children }: { title: string, value: string | number, icon: React.ReactNode, link: string, children: React.ReactNode }) => (
    <Link href={link} className="block h-full">
        <div className="bg-bg-card hover:bg-bg-light transition-all duration-300 rounded-xl shadow-lg border border-border hover:border-primary/50 p-6 flex flex-col justify-between h-full overflow-hidden">
            <div>
                <div className="flex items-center gap-3 mb-3">
                    {icon}
                    <h3 className="text-md font-semibold text-text-muted truncate">{title}</h3>
                </div>
                <div className="text-4xl font-bold text-white mb-3">
                    {value}
                </div>
            </div>
            <div className="space-y-2 text-sm">
                {children}
            </div>
        </div>
    </Link>
);


const DashboardPage = () => {
  const { data: session, status } = useSession({ required: true });
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (status !== 'authenticated') return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data.');
      }
      const fetchedData: DashboardData = await response.json();
      setData(fetchedData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (status === "loading" || loading) {
    return (
      <AppLayout showFooter={false}>
        <div className="p-8 bg-bg min-h-screen">
            {/* Header Skeleton */}
            <div className="animate-pulse flex justify-between items-center mb-8">
                <div>
                    <div className="h-8 bg-bg-light rounded w-64 mb-2"></div>
                    <div className="h-5 bg-bg-light rounded w-96"></div>
                </div>
                <div className="h-10 bg-bg-light rounded w-32"></div>
            </div>
            {/* Grid Skeleton */}
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-6 lg:col-span-3 h-48 bg-bg-card rounded-xl"></div>
                <div className="col-span-12 md:col-span-6 lg:col-span-3 h-48 bg-bg-card rounded-xl"></div>
                <div className="col-span-12 md:col-span-6 lg:col-span-3 h-48 bg-bg-card rounded-xl"></div>
                <div className="col-span-12 md:col-span-6 lg:col-span-3 h-48 bg-bg-card rounded-xl"></div>
                <div className="col-span-12 lg:col-span-8 h-96 bg-bg-card rounded-xl"></div>
                <div className="col-span-12 lg:col-span-4 h-96 bg-bg-card rounded-xl"></div>
                <div className="col-span-12 h-48 bg-bg-card rounded-xl"></div>
            </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout showFooter={false}>
        <div className="p-8 bg-bg min-h-screen flex flex-col items-center justify-center text-center">
            <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong.</h1>
            <p className="text-text-muted mb-6">{error}</p>
            <button
              onClick={fetchData}
              className="px-6 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors font-semibold"
            >
              Try Again
            </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showFooter={false}>
      <div className="p-4 md:p-8 bg-bg min-h-screen">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Welcome back, {data?.userProfile.firstName || 'User'}!
            </h1>
            <p className="text-text-muted text-base md:text-lg">Here's your job search progress and insights.</p>
          </div>
          <Link href="/application-tracking" className="px-5 py-3 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors font-semibold flex items-center gap-2 whitespace-nowrap">
            <Briefcase className="w-5 h-5" />
            Manage Applications
          </Link>
        </div>

        <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 6 }}
            rowHeight={100}
            isDraggable={false}
            isResizable={false}
            margin={[24, 24]}
        >
            <div key="stats-total">
                <StatCard title="Total Applications" value={data?.jobStats.totalApplications ?? 0} icon={<TrendingUp className="w-6 h-6 text-primary" />} link="/application-tracking">
                    <div className="flex justify-between">
                        <span className="text-text-muted">Active:</span>
                        <span className="text-success font-medium">{data?.jobStats.activeApplications ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-text-muted">Response Rate:</span>
                        <span className="text-primary font-medium">{data?.jobStats.responseRate ?? 0}%</span>
                    </div>
                </StatCard>
            </div>
            <div key="stats-interviews">
                <StatCard title="Interviews" value={data?.jobStats.interviews ?? 0} icon={<Calendar className="w-6 h-6 text-success" />} link="/events">
                    <div className="flex justify-between">
                        <span className="text-text-muted">Offers:</span>
                        <span className="text-success font-medium">{data?.jobStats.offers ?? 0}</span>
                    </div>
                    <div className="w-full bg-border-muted rounded-full h-2.5 mt-1">
                        <div className="bg-success h-2.5 rounded-full" style={{ width: `${data?.jobStats.responseRate}%` }}></div>
                    </div>
                </StatCard>
            </div>
            <div key="profile">
                <div className="bg-bg-card rounded-xl shadow-lg border border-border p-6 h-full flex flex-col justify-center">
                    <h3 className="text-md font-semibold text-text-muted mb-3 flex items-center gap-3"><Users className="w-6 h-6 text-primary" /> Profile Snapshot</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-text-muted flex-shrink-0" />
                            <span className="text-white truncate">{data?.userProfile.targetRole}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-text-muted flex-shrink-0" />
                            <span className="text-white truncate">{data?.userProfile.location}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div key="reminders">
                <div className="bg-bg-card rounded-xl shadow-lg border border-border p-6 h-full flex flex-col">
                    <h3 className="text-md font-semibold text-text-muted mb-3 flex items-center gap-3"><Bell className="w-6 h-6 text-warning" /> Upcoming Reminders</h3>
                    <div className="space-y-2 flex-grow overflow-y-auto pr-2">
                        {data?.upcomingReminders && data.upcomingReminders.length > 0 ? (
                            data.upcomingReminders.map(r => (
                                <Link key={r._id} href="/reminders" className="flex items-center gap-3 p-2 bg-bg-light rounded-md hover:bg-bg-dark transition-colors">
                                    <Clock className="w-4 h-4 text-warning flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-white truncate">{r.title}</p>
                                        <p className="text-xs text-text-muted">{new Date(r.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                    </div>
                                    <ExternalLink className="w-3 h-3 text-text-muted" />
                                </Link>
                            ))
                        ) : (
                            <div className="text-center text-xs text-text-muted pt-4">No upcoming reminders.</div>
                        )}
                    </div>
                </div>
            </div>
            <div key="activity-chart" className="bg-bg-card rounded-xl shadow-lg border border-border p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Application Activity (Last 30 Days)</h3>
                 {data?.applicationTrendData && data.applicationTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={data.applicationTrendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(110, 118, 140, 0.1)' }} />
                            <Bar dataKey="applications" fill="var(--primary)" name="Applications" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="interviews" fill="var(--success)" name="Interviews" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                 ) : (
                    <div className="h-full flex items-center justify-center text-text-muted">No activity data for this period.</div>
                 )}
            </div>
             <div key="status-pie" className="bg-bg-card rounded-xl shadow-lg border border-border p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Application Status</h3>
                {data?.applicationStatus && data.applicationStatus.length > 0 ? (
                    <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                            <Pie data={data.applicationStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" nameKey="name">
                                {data.applicationStatus.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-text-muted">No application data yet.</div>
                )}
            </div>
            <div key="skills" className="bg-bg-card rounded-xl shadow-lg border border-border p-6">
                 <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-3"><Brain className="w-6 h-6 text-secondary" /> Top Skills</h3>
                <div className="flex flex-wrap gap-3">
                    {data?.topSkills && data.topSkills.length > 0 ? (
                        data.topSkills.map(skill => (
                            <Link key={skill.id} href={`/job-search?q=${encodeURIComponent(skill.skill)}`} className="px-4 py-2 rounded-full text-sm font-medium bg-secondary/20 border border-secondary/30 text-secondary hover:bg-secondary/30 transition-colors">
                                {skill.skill}
                            </Link>
                        ))
                    ) : (
                        <p className="text-text-muted text-sm">Add resumes to see your top skills here.</p>
                    )}
                </div>
            </div>
        </ResponsiveGridLayout>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
