'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  Bell,
  Users,
  Target,
  CheckCircle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  Zap
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/contexts/ToastContext';
import { motion } from 'framer-motion';

// --- Custom Components ---

const StatCard = ({ title, value, icon, color, trend, isPrimary = false }: any) => (
  <div className={`relative overflow-hidden rounded-xl p-6 transition-all duration-200 ${isPrimary
    ? 'bg-[var(--bg-surface)] shadow-sm'
    : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-light)]'
    }`}>
    <div className="flex justify-between items-start mb-4">
      <div className="p-2.5 rounded-lg bg-[var(--bg-light)] text-[var(--text-muted)]">
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${trend.isPositive
          ? 'bg-[var(--success)]/10 text-[var(--success)]'
          : 'bg-[var(--danger)]/10 text-[var(--danger)]'
          }`}>
          {trend.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend.value}%
        </div>
      )}
    </div>
    <div>
      <p className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-[var(--text-main)]">{value}</h3>
    </div>
  </div>
);

const ProgressBar = ({ percent, color }: { percent: number, color: string }) => (
  <div className="h-2 w-full bg-[var(--bg-light)] rounded-full overflow-hidden">
    <div
      className="h-full rounded-full transition-all duration-1000 ease-out"
      style={{ width: `${percent}%`, backgroundColor: color }}
    ></div>
  </div>
);


interface DashboardStats {
  totalActivities: number;
  pendingReminders: number;
  upcomingInterviews: number;
  overdueFollowUps: number;
  activeContacts: number;
  completionRate: number;
  weeklyProgress: {
    completed: number;
    total: number;
  };
}

const AnalyticsPage = () => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalActivities: 0,
    pendingReminders: 0,
    upcomingInterviews: 0,
    overdueFollowUps: 0,
    activeContacts: 0,
    completionRate: 0,
    weeklyProgress: { completed: 0, total: 0 }
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/simple-stats');
      if (response.ok) {
        const statsData = await response.json();
        setStats({
          totalActivities: statsData.totalActivities || 0,
          pendingReminders: statsData.pendingReminders || 0,
          upcomingInterviews: statsData.upcomingInterviews || 0,
          overdueFollowUps: statsData.overdueFollowUps || 0,
          activeContacts: statsData.activeContacts || 0,
          completionRate: statsData.completionRate || 0,
          weeklyProgress: {
            completed: statsData.weeklyProgress?.completed || 0,
            total: statsData.weeklyProgress?.total || 0
          }
        });
      } else {
        throw new Error('Failed to fetch stats');
      }
    } catch (err) {
      console.error(err);
      error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout showFooter={false}>
        <div className="p-8 min-h-screen flex items-center justify-center bg-[var(--bg-deep)]">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showFooter={false}>
      <div className="p-6 lg:p-10 min-h-screen space-y-8 bg-[var(--bg-deep)] text-[var(--text-main)]">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
              Performance Analytics <span className="text-[var(--primary)]">.</span>
            </h1>
            <p className="text-[var(--text-muted)] text-lg max-w-2xl">
              Deep dive into your job search metrics. Track your funnel, measure progress, and optimize your strategy.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-4 py-2 rounded-lg bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all flex items-center gap-2 text-sm font-medium"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Mission Control</span>
            </button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8">

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Activities"
              value={stats.totalActivities}
              icon={<Calendar className="w-5 h-5" />}
              color="bg-blue-500"
              trend={{ value: 12, isPositive: true }}
              isPrimary={true}
            />
            <StatCard
              title="Pending Reminders"
              value={stats.pendingReminders}
              icon={<Bell className="w-5 h-5" />}
              color="bg-[var(--warning)]"
            />
            <StatCard
              title="Upcoming Interviews"
              value={stats.upcomingInterviews}
              icon={<Target className="w-5 h-5" />}
              color="bg-[var(--success)]"
              trend={{ value: 25, isPositive: true }}
            />
            <StatCard
              title="Active Contacts"
              value={stats.activeContacts}
              icon={<Users className="w-5 h-5" />}
              color="bg-[var(--secondary)]"
            />
          </div>

          {/* Performance Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Weekly Progress */}
            <div className="bg-[var(--bg-surface)] rounded-xl p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-[var(--bg-light)] rounded-lg text-[var(--text-muted)]">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-main)]">Weekly Progress</h3>
                    <p className="text-[var(--text-muted)] text-sm">Tasks completed this week</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-[var(--text-main)]">{stats.weeklyProgress.completed}/{stats.weeklyProgress.total}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-[var(--text-muted)]">Completion</span>
                  <span className="text-[var(--success)]">{Math.round(((stats.weeklyProgress.completed || 0) / (stats.weeklyProgress.total || 1)) * 100)}%</span>
                </div>
                <ProgressBar
                  percent={Math.round(((stats.weeklyProgress.completed || 0) / (stats.weeklyProgress.total || 1)) * 100)}
                  color="var(--success)"
                />
              </div>
            </div>

            {/* Completion Rate */}
            <div className="bg-[var(--bg-surface)] rounded-xl p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-[var(--bg-light)] rounded-lg text-[var(--text-muted)]">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-main)]">Completion Rate</h3>
                    <p className="text-[var(--text-muted)] text-sm">Overall application success</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-[var(--text-main)]">{stats.completionRate}%</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-[var(--text-muted)]">Target: 85%</span>
                  <span className="text-blue-500">{stats.completionRate}%</span>
                </div>
                <ProgressBar
                  percent={stats.completionRate}
                  color="#3b82f6"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default AnalyticsPage;