'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
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
  ExternalLink
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

const ResponsiveGridLayout = WidthProvider(Responsive);

// --- Responsive Layout Definitions ---
const layouts = {
  lg: [
    { i: 'stats-total', x: 0, y: 0, w: 3, h: 3 },
    { i: 'stats-interviews', x: 3, y: 0, w: 3, h: 3 },
    { i: 'profile', x: 6, y: 0, w: 3, h: 3 },
    { i: 'reminders', x: 9, y: 0, w: 3, h: 3 },
    { i: 'activity-chart', x: 0, y: 3, w: 8, h: 4 },
    { i: 'status-pie', x: 8, y: 3, w: 4, h: 4 },
    { i: 'skills', x: 0, y: 7, w: 12, h: 2 },
  ],
  md: [
    { i: 'stats-total', x: 0, y: 0, w: 5, h: 3 },
    { i: 'stats-interviews', x: 5, y: 0, w: 5, h: 3 },
    { i: 'profile', x: 0, y: 3, w: 5, h: 3 },
    { i: 'reminders', x: 5, y: 3, w: 5, h: 3 },
    { i: 'activity-chart', x: 0, y: 6, w: 10, h: 4 },
    { i: 'status-pie', x: 0, y: 10, w: 10, h: 4 },
    { i: 'skills', x: 0, y: 14, w: 10, h: 2 },
  ],
  sm: [
    { i: 'stats-total', x: 0, y: 0, w: 6, h: 3 },
    { i: 'stats-interviews', x: 0, y: 3, w: 6, h: 3 },
    { i: 'profile', x: 0, y: 6, w: 6, h: 3 },
    { i: 'reminders', x: 0, y: 9, w: 6, h: 3 },
    { i: 'activity-chart', x: 0, y: 12, w: 6, h: 4 },
    { i: 'status-pie', x: 0, y: 16, w: 6, h: 4 },
    { i: 'skills', x: 0, y: 20, w: 6, h: 2 },
  ],
};


// --- Recharts Custom Components ---
interface TooltipEntry {
  color: string;
  name: string;
  value: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-light/80 backdrop-blur-sm border border-border p-3 rounded-lg shadow-lg text-sm">
        <p className="font-bold text-white mb-2">{`Date: ${label}`}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>{`${entry.name}: ${entry.value}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

// --- Widget Components ---



const StatCard = ({ title, value, icon, link, children }: { title: string, value: string | number, icon: React.ReactNode, link: string, children: React.ReactNode }) => (
    <Link href={link} className="block h-full group">
        <div className="bg-bg-card hover:bg-bg-light transition-all duration-300 rounded-xl shadow-lg border border-border hover:border-primary/50 p-4 md:p-6 flex flex-col justify-between h-full overflow-hidden group-hover:shadow-xl group-hover:shadow-primary/10">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        {icon}
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-text-muted truncate group-hover:text-white transition-colors">{title}</h3>
                </div>
                <div className="text-2xl md:text-4xl font-bold text-white mb-4 group-hover:text-primary transition-colors">
                    {value}
                </div>
            </div>
            <div className="space-y-2 text-xs md:text-sm border-t border-border/50 pt-4">
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
    
    console.log('Fetching dashboard data...');
    
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
      
      console.log('Stats API response status:', response.status);
      
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
      console.log('Dashboard data fetched:', {
        totalApplications: fetchedData.jobStats?.totalApplications,
        activeApplications: fetchedData.jobStats?.activeApplications
      });
      
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
    console.log('Manual refresh triggered');
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
        <div className="p-4 md:p-8 bg-bg min-h-screen">
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
      <div className="p-4 md:p-8 bg-bg min-h-screen">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-8" >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Welcome back, {data?.userProfile?.firstName || 'User'}!
            </h1>
            <p className="text-text-muted text-base md:text-lg">Here&apos;s your job search progress and insights.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-3 bg-bg-light hover:bg-bg-card text-white rounded-lg transition-all duration-200 font-semibold border border-border hover:border-primary whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              <TrendingUp className="w-5 h-5" />
              Refresh
            </button>
            <Link href="/application-tracking" className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-success hover:from-success hover:to-primary text-white rounded-lg transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900">
              <Briefcase className="w-5 h-5" />
              Manage Applications
            </Link>
          </div>
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
                    <h3 className="text-lg font-semibold text-text-muted mb-4 flex items-center gap-3"><Users className="w-6 h-6 text-primary" /> Profile Snapshot</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-text-muted flex-shrink-0" />
                            <span className="text-white truncate">{data?.userProfile?.targetRole || 'Job Seeker'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-text-muted flex-shrink-0" />
                            <span className="text-white truncate">{data?.userProfile?.location || 'Remote'}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div key="reminders">
                <div className="bg-bg-card rounded-xl shadow-lg border border-border p-6 h-full flex flex-col">
                    <h3 className="text-lg font-semibold text-text-muted mb-4 flex items-center gap-3"><Bell className="w-6 h-6 text-warning" /> Upcoming Reminders</h3>
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
