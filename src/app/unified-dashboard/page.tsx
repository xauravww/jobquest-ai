'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  Bell,
  Users,
  Target,
  CheckCircle,
  Clock,
  AlertTriangle,
  Settings,
  Zap,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import ActivityHub from '@/components/ActivityHub';
import FollowUpTracker from '@/components/FollowUpTracker';
import NotificationsPanel from '@/components/NotificationsPanel';
import ActivitySkeleton from '@/components/ui/ActivitySkeleton';
import { notificationService } from '@/services/NotificationService';
import { useToast } from '@/contexts/ToastContext';
import { motion } from 'framer-motion';

// --- Custom Components ---

const TabButton = ({ active, onClick, icon, label, count, colorClass }: any) => (
  <button
    onClick={onClick}
    className={`relative flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${active
        ? 'text-white bg-[var(--primary)]/10 border border-[var(--primary)]/50 shadow-[0_0_15px_var(--primary-glow)]'
        : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-surface)] border border-transparent'
      }`}
  >
    {icon}
    <span>{label}</span>
    {count > 0 && (
      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${colorClass || 'bg-[var(--primary)] text-black'}`}>
        {count}
      </span>
    )}
    {active && (
      <motion.div
        layoutId="activeTab"
        className="absolute inset-0 rounded-xl bg-[var(--primary)]/5"
        initial={false}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    )}
  </button>
);

const StatCard = ({ title, value, icon, color, trend, isPrimary = false }: any) => (
  <div className={`relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl border transition-all duration-300 group hover:-translate-y-1 ${isPrimary
      ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 shadow-[0_0_20px_var(--primary-glow)]'
      : 'bg-[var(--bg-glass)] border-[var(--border-glass)] hover:border-[var(--primary)]/30 hover:shadow-lg hover:shadow-[var(--primary)]/5'
    }`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} text-white`}>
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${trend.isPositive
            ? 'bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/30'
            : 'bg-[var(--danger)]/20 text-[var(--danger)] border border-[var(--danger)]/30'
          }`}>
          {trend.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend.value}%
        </div>
      )}
    </div>
    <div>
      <p className="text-[var(--text-muted)] text-sm font-medium uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-white group-hover:text-[var(--primary)] transition-colors">{value}</h3>
    </div>
    {/* Decorative gradient */}
    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br from-[var(--primary)]/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
  </div>
);

const ProgressBar = ({ percent, color }: { percent: number, color: string }) => (
  <div className="h-2 w-full bg-[var(--bg-surface)] rounded-full overflow-hidden">
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

const UnifiedDashboard = () => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
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
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notifications) => {
      setNotifications(notifications);
    });
    fetchDashboardData();
    return unsubscribe;
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
        success('Dashboard data loaded successfully');
      } else {
        throw new Error('Failed to fetch stats');
      }
    } catch (err) {
      console.error(err);
      error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout showFooter={false}>
        <div className="p-8 min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_var(--primary-glow)]"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showFooter={false}>
      <div className="p-6 lg:p-10 min-h-screen space-y-10">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight">
              Dashboard <span className="text-[var(--primary)]">.</span>
            </h1>
            <p className="text-[var(--text-muted)] text-lg max-w-2xl">
              Your mission control center. Track applications, manage interviews, and stay on top of your career goals.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.location.href = '/settings'}
              className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-muted)] hover:text-white hover:border-[var(--primary)] transition-all flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            <button
              onClick={() => window.location.href = '/application-tracking'}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold shadow-lg shadow-[var(--primary)]/25 hover:shadow-[0_0_20px_var(--primary-glow)] hover:scale-105 transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Track Application</span>
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-[var(--border-glass)] pb-4">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={<BarChart3 className="w-4 h-4" />}
            label="Overview"
          />
          <TabButton
            active={activeTab === 'activities'}
            onClick={() => setActiveTab('activities')}
            icon={<Calendar className="w-4 h-4" />}
            label="Activity Hub"
            count={stats.totalActivities}
          />
          <TabButton
            active={activeTab === 'followups'}
            onClick={() => setActiveTab('followups')}
            icon={<Users className="w-4 h-4" />}
            label="Follow-ups"
            count={stats.overdueFollowUps}
            colorClass="bg-[var(--warning)] text-black"
          />
          <TabButton
            active={activeTab === 'notifications'}
            onClick={() => setActiveTab('notifications')}
            icon={<Bell className="w-4 h-4" />}
            label="Notifications"
            count={notificationService.getUnreadCount()}
            colorClass="bg-[var(--danger)] text-white"
          />
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-10">

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Activities"
                  value={stats.totalActivities}
                  icon={<Calendar className="w-6 h-6" />}
                  color="bg-blue-500"
                  trend={{ value: 12, isPositive: true }}
                  isPrimary={true}
                />
                <StatCard
                  title="Pending Reminders"
                  value={stats.pendingReminders}
                  icon={<Bell className="w-6 h-6" />}
                  color="bg-[var(--warning)]"
                />
                <StatCard
                  title="Upcoming Interviews"
                  value={stats.upcomingInterviews}
                  icon={<Target className="w-6 h-6" />}
                  color="bg-[var(--success)]"
                  trend={{ value: 25, isPositive: true }}
                />
                <StatCard
                  title="Active Contacts"
                  value={stats.activeContacts}
                  icon={<Users className="w-6 h-6" />}
                  color="bg-[var(--secondary)]"
                />
              </div>

              {/* Performance Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Weekly Progress */}
                <div className="bg-[var(--bg-glass)] backdrop-blur-xl border border-[var(--border-glass)] rounded-2xl p-8 hover:border-[var(--success)]/30 transition-colors">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-[var(--success)]/20 rounded-xl text-[var(--success)]">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Weekly Progress</h3>
                        <p className="text-[var(--text-muted)] text-sm">Tasks completed this week</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-white">{stats.weeklyProgress.completed}/{stats.weeklyProgress.total}</span>
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
                <div className="bg-[var(--bg-glass)] backdrop-blur-xl border border-[var(--border-glass)] rounded-2xl p-8 hover:border-blue-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/20 rounded-xl text-blue-500">
                        <BarChart3 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Completion Rate</h3>
                        <p className="text-[var(--text-muted)] text-sm">Overall application success</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-white">{stats.completionRate}%</span>
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

              {/* Recent Activity Feed */}
              <div className="bg-[var(--bg-glass)] backdrop-blur-xl border border-[var(--border-glass)] rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-[var(--warning)]/20 rounded-xl text-[var(--warning)]">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Recent Activity</h3>
                </div>

                <div className="space-y-4">
                  {notifications.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-[var(--border-glass)] rounded-xl">
                      <p className="text-[var(--text-muted)]">No recent activity to show.</p>
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-[var(--bg-surface)]/50 rounded-xl border border-[var(--border-glass)] hover:border-[var(--primary)]/30 transition-all group">
                        <div className={`p-2 rounded-lg ${activity.type === 'reminder' ? 'bg-[var(--success)]/20 text-[var(--success)]' :
                            activity.type === 'interview' ? 'bg-blue-500/20 text-blue-500' :
                              activity.type === 'follow_up' ? 'bg-[var(--secondary)]/20 text-[var(--secondary)]' :
                                'bg-[var(--danger)]/20 text-[var(--danger)]'
                          }`}>
                          {activity.type === 'reminder' ? <CheckCircle className="w-4 h-4" /> :
                            activity.type === 'interview' ? <Calendar className="w-4 h-4" /> :
                              activity.type === 'follow_up' ? <Users className="w-4 h-4" /> :
                                <AlertTriangle className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium group-hover:text-[var(--primary)] transition-colors">{activity.title}</p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {new Date(activity.timestamp).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </motion.div>
          )}

          {activeTab === 'activities' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <ActivityHub />
            </motion.div>
          )}

          {activeTab === 'followups' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <FollowUpTracker />
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <NotificationsPanel notifications={notifications} />
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default UnifiedDashboard;