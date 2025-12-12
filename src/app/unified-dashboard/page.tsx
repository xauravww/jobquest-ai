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
import { notificationService } from '@/services/NotificationService';
import { useToast } from '@/contexts/ToastContext';
import { motion } from 'framer-motion';

// --- Custom Components ---

const TabButton = ({ active, onClick, icon, label, count, colorClass }: any) => (
  <button
    onClick={onClick}
    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${active
      ? 'text-[var(--primary)] bg-[var(--primary)]/10 border border-[var(--primary)]/20'
      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-light)] border border-transparent'
      }`}
  >
    {icon}
    <span>{label}</span>
    {count > 0 && (
      <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${colorClass || 'bg-[var(--primary)] text-white'}`}>
        {count}
      </span>
    )}
  </button>
);

const StatCard = ({ title, value, icon, color, trend, isPrimary = false }: any) => (
  <div className={`relative overflow-hidden rounded-xl p-6 border transition-all duration-200 ${isPrimary
    ? 'bg-[var(--bg-surface)] border-[var(--primary)]/30 shadow-sm'
    : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--primary)]/30'
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
              Dashboard <span className="text-[var(--primary)]">.</span>
            </h1>
            <p className="text-[var(--text-muted)] text-lg max-w-2xl">
              Your mission control center. Track applications, manage interviews, and stay on top of your career goals.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.location.href = '/settings'}
              className="px-4 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--primary)] transition-all flex items-center gap-2 text-sm font-medium"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            <button
              onClick={() => window.location.href = '/application-tracking'}
              className="px-4 py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-dim)] text-black font-medium shadow-sm transition-all flex items-center gap-2 text-sm"
            >
              <Zap className="w-4 h-4" />
              <span>Track Application</span>
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-4">
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
            colorClass="bg-[var(--warning)] text-white"
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
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6">
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
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6">
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

              {/* Recent Activity Feed */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-2.5 bg-[var(--bg-light)] rounded-lg text-[var(--text-muted)]">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-main)]">Recent Activity</h3>
                </div>

                <div className="space-y-3">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-lg">
                      <p className="text-[var(--text-muted)] text-sm">No recent activity to show.</p>
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-[var(--bg-light)]/30 rounded-lg border border-[var(--border)] hover:border-[var(--primary)]/30 transition-all group">
                        <div className="p-2 rounded-md bg-[var(--bg-light)] text-[var(--text-muted)]">
                          {activity.type === 'reminder' ? <CheckCircle className="w-4 h-4" /> :
                            activity.type === 'interview' ? <Calendar className="w-4 h-4" /> :
                              activity.type === 'follow_up' ? <Users className="w-4 h-4" /> :
                                <AlertTriangle className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-[var(--text-main)] text-sm font-medium group-hover:text-[var(--primary)] transition-colors">{activity.title}</p>
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <ActivityHub />
            </motion.div>
          )}

          {activeTab === 'followups' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <FollowUpTracker />
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <NotificationsPanel notifications={notifications} />
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default UnifiedDashboard;