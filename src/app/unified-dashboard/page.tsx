'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, Badge, Button, Card, Progress } from 'antd';
import {
  TrendingUp,
  Calendar,
  Bell,
  Users,
  Target,
  CheckCircle,
  Clock,
  AlertTriangle,
  Phone,
  Mail,
  Settings,
  Zap,
  BarChart3,
  X
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import ActivityHub from '@/components/ActivityHub';
import FollowUpTracker from '@/components/FollowUpTracker';
import NotificationsPanel from '@/components/NotificationsPanel';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ActivitySkeleton from '@/components/ui/ActivitySkeleton';
import { notificationService } from '@/services/NotificationService';
import toast from 'react-hot-toast';

const { TabPane } = Tabs;

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
    // Subscribe to notifications
    const unsubscribe = notificationService.subscribe((notifications) => {
      setNotifications(notifications);
    });

    // Fetch initial data
    fetchDashboardData();

    return unsubscribe;
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data...');
      
      // Fetch dashboard statistics from API
      try {
        console.log('Calling API: /api/dashboard/simple-stats');
        const response = await fetch('/api/dashboard/simple-stats');
        console.log('API response status:', response.status);
        
        if (response.ok) {
          const statsData = await response.json();
          console.log('API data received:', statsData);
          
          // Ensure the data has the expected structure
          const processedStats: DashboardStats = {
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
          };
          
          setStats(processedStats);
          toast.success('Dashboard data loaded successfully');
        } else {
          const errorData = await response.text();
          console.error('API error:', response.status, errorData);
          throw new Error(`API failed with status ${response.status}: ${errorData}`);
        }
      } catch (apiError) {
        console.error('Failed to fetch from API:', apiError);
        toast.error('Failed to load dashboard data - please refresh the page');
        // Keep the initial empty stats instead of showing dummy data
      }

      // Notifications will be created by the notification service based on real data

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'overview': return <BarChart3 className="w-4 h-4" />;
      case 'activities': return <Calendar className="w-4 h-4" />;
      case 'followups': return <Users className="w-4 h-4" />;
      case 'notifications': return <Bell className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const StatCard = ({ title, value, icon, color, trend }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    trend?: { value: number; isPositive: boolean };
  }) => (
    <Card className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{value}</span>
            {trend && (
              <span className={`text-xs flex items-center gap-1 ${
                trend.isPositive ? 'text-green-400' : 'text-red-400'
              }`}>
                <TrendingUp className={`w-3 h-3 ${trend.isPositive ? '' : 'rotate-180'}`} />
                {trend.value}%
              </span>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <AppLayout showFooter={false}>
        <div className="p-8 bg-bg min-h-screen">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="animate-pulse">
              <div className="h-8 bg-bg-light rounded w-64 mb-2"></div>
              <div className="h-5 bg-bg-light rounded w-96 mb-8"></div>
            </div>
            <ActivitySkeleton count={6} />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showFooter={false}>
      <div className="p-8 bg-bg min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl border border-primary/30">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                Job Search Command Center
              </h1>
              <p className="text-gray-400 mt-2 text-lg">
                Your unified hub for managing job applications, interviews, and networking
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                icon={<Settings className="w-4 h-4" />}
                className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                onClick={() => window.location.href = '/settings'}
              >
                Settings
              </Button>
              <Button
                type="primary"
                icon={<Zap className="w-4 h-4" />}
                className="bg-primary hover:bg-primary/80"
                onClick={() => window.location.href = '/application-tracking'}
              >
                Track Applications
              </Button>
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className="custom-dark-tabs"
            size="large"
          >
            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  {getTabIcon('overview')}
                  Overview
                </span>
              }
              key="overview"
            >
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="Total Activities"
                    value={stats.totalActivities}
                    icon={<Calendar className="w-6 h-6 text-blue-400" />}
                    color="bg-blue-500/20"
                    trend={{ value: 12, isPositive: true }}
                  />
                  <StatCard
                    title="Pending Reminders"
                    value={stats.pendingReminders}
                    icon={<Bell className="w-6 h-6 text-yellow-400" />}
                    color="bg-yellow-500/20"
                  />
                  <StatCard
                    title="Upcoming Interviews"
                    value={stats.upcomingInterviews}
                    icon={<Target className="w-6 h-6 text-green-400" />}
                    color="bg-green-500/20"
                    trend={{ value: 25, isPositive: true }}
                  />
                  <StatCard
                    title="Active Contacts"
                    value={stats.activeContacts}
                    icon={<Users className="w-6 h-6 text-purple-400" />}
                    color="bg-purple-500/20"
                  />
                </div>

                {/* Progress Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-gray-800/50 border-gray-700">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">Weekly Progress</h3>
                        <Badge count={stats.weeklyProgress?.completed || 0} className="bg-green-500" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Completed Tasks</span>
                          <span className="text-white">
                            {stats.weeklyProgress?.completed || 0} / {stats.weeklyProgress?.total || 0}
                          </span>
                        </div>
                        <Progress
                          percent={Math.round(((stats.weeklyProgress?.completed || 0) / (stats.weeklyProgress?.total || 1)) * 100)}
                          strokeColor="#10b981"
                          trailColor="#374151"
                        />
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-gray-800/50 border-gray-700">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">Completion Rate</h3>
                        <Badge count={`${stats.completionRate}%`} className="bg-blue-500" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Overall Performance</span>
                          <span className="text-white">{stats.completionRate}%</span>
                        </div>
                        <Progress
                          percent={stats.completionRate}
                          strokeColor="#3b82f6"
                          trailColor="#374151"
                        />
                      </div>
                    </div>
                  </Card>
                </div>



                {/* Recent Activity */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-400" />
                      Recent Activity
                    </h3>
                    <div className="space-y-3">
                      {notifications.length === 0 ? (
                        <div className="text-center py-8">
                          <Clock className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                          <p className="text-gray-400">No recent activity</p>
                        </div>
                      ) : (
                        notifications.slice(0, 4).map((activity, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                            <div className={`w-4 h-4 ${
                              activity.type === 'reminder' ? 'text-green-400' :
                              activity.type === 'interview' ? 'text-blue-400' :
                              activity.type === 'follow_up' ? 'text-purple-400' :
                              'text-red-400'
                            }`}>
                              {activity.type === 'reminder' ? <CheckCircle className="w-4 h-4" /> :
                               activity.type === 'interview' ? <Calendar className="w-4 h-4" /> :
                               activity.type === 'follow_up' ? <Users className="w-4 h-4" /> :
                               <AlertTriangle className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-white">{activity.title}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(activity.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </TabPane>

            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  {getTabIcon('activities')}
                  Activity Hub
                  <Badge count={stats.totalActivities} size="small" />
                </span>
              }
              key="activities"
            >
              <ActivityHub />
            </TabPane>

            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  {getTabIcon('followups')}
                  Follow-up Tracker
                  <Badge count={stats.overdueFollowUps} size="small" />
                </span>
              }
              key="followups"
            >
              <FollowUpTracker />
            </TabPane>

            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  {getTabIcon('notifications')}
                  Notifications
                  <Badge count={notificationService.getUnreadCount()} size="small" />
                </span>
              }
              key="notifications"
            >
              <NotificationsPanel notifications={notifications} />
            </TabPane>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

export default UnifiedDashboard;