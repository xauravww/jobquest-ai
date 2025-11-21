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
import { useToast } from '@/contexts/ToastContext';

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
          success('Dashboard data loaded successfully');
        } else {
          const errorData = await response.text();
          console.error('API error:', response.status, errorData);
          throw new Error(`API failed with status ${response.status}: ${errorData}`);
        }
      } catch (apiError) {
        console.error('Failed to fetch from API:', apiError);
        error('Failed to load dashboard data - please refresh the page');
        // Keep the initial empty stats instead of showing dummy data
      }

      // Notifications will be created by the notification service based on real data

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      error('Failed to load dashboard data');
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

  const StatCard = ({ title, value, icon, color, trend, isPrimary = false }: {
     title: string;
     value: number | string;
     icon: React.ReactNode;
     color: string;
     trend?: { value: number; isPositive: boolean };
     isPrimary?: boolean;
   }) => (
     <Card className={`bg-bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group ${isPrimary ? 'ring-2 ring-primary/20' : ''}`}>
       <div className="flex items-center justify-between p-2">
         <div className="flex-1">
           <p className="text-text-muted text-sm font-medium mb-2 uppercase tracking-wide">{title}</p>
           <div className="flex items-baseline gap-3">
             <span className="text-3xl md:text-4xl font-bold text-white group-hover:text-primary transition-colors">{value}</span>
             {trend && (
               <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                 trend.isPositive
                   ? 'bg-success/20 text-success border border-success/30'
                   : 'bg-danger/20 text-danger border border-danger/30'
               }`}>
                 <TrendingUp className={`w-3 h-3 ${trend.isPositive ? '' : 'rotate-180'}`} />
                 {trend.value}%
               </div>
             )}
           </div>
         </div>
         <div className={`p-4 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
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
           <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
             <div className="flex-1">
               <div className="flex items-center gap-4 mb-4">
                 <div className="p-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl border border-primary/30 shadow-lg shadow-primary/10">
                   <TrendingUp className="w-10 h-10 text-primary" />
                 </div>
                 <div>
                   <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight">
                     Job Search Command Center
                   </h1>
                   <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary rounded-full mt-2"></div>
                 </div>
               </div>
               <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-2xl">
                 Your unified hub for managing job applications, interviews, and networking activities
               </p>
             </div>

             <div className="flex flex-col sm:flex-row items-start lg:items-end gap-3 lg:ml-8">
               <Button
                 icon={<Settings className="w-4 h-4" />}
                 className="bg-bg-light hover:bg-bg-card text-white border-border hover:border-primary/50 transition-all duration-200 font-medium"
                 onClick={() => window.location.href = '/settings'}
               >
                 Settings
               </Button>
               <Button
                 type="primary"
                 icon={<Zap className="w-4 h-4" />}
                 className="bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                 onClick={() => window.location.href = '/application-tracking'}
               >
                 Track Applications
               </Button>
             </div>
           </div>

           {/* Main Tabs */}
           <div className="border-t border-border/30 pt-8">
             <Tabs
               activeKey={activeTab}
               onChange={setActiveTab}
               className="custom-dark-tabs"
               size="large"
               tabBarStyle={{
                 borderBottom: '2px solid var(--border)',
                 marginBottom: '2rem'
               }}
             >
               <TabPane
                 tab={
                   <span className="flex items-center gap-3 px-4 py-3 text-base font-semibold">
                     {getTabIcon('overview')}
                     Overview
                   </span>
                 }
                 key="overview"
               >
               <div className="space-y-10">
                 {/* Stats Grid */}
                 <div>
                   <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                     <div className="w-1 h-8 bg-gradient-to-b from-primary to-secondary rounded-full"></div>
                     Key Metrics
                   </h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     <StatCard
                       title="Total Activities"
                       value={stats.totalActivities}
                       icon={<Calendar className="w-7 h-7 text-blue-400" />}
                       color="bg-blue-500/20 border border-blue-500/30"
                       trend={{ value: 12, isPositive: true }}
                       isPrimary={true}
                     />
                     <StatCard
                       title="Pending Reminders"
                       value={stats.pendingReminders}
                       icon={<Bell className="w-7 h-7 text-yellow-400" />}
                       color="bg-yellow-500/20 border border-yellow-500/30"
                     />
                     <StatCard
                       title="Upcoming Interviews"
                       value={stats.upcomingInterviews}
                       icon={<Target className="w-7 h-7 text-green-400" />}
                       color="bg-green-500/20 border border-green-500/30"
                       trend={{ value: 25, isPositive: true }}
                     />
                     <StatCard
                       title="Active Contacts"
                       value={stats.activeContacts}
                       icon={<Users className="w-7 h-7 text-purple-400" />}
                       color="bg-purple-500/20 border border-purple-500/30"
                     />
                   </div>
                 </div>

                 {/* Progress Cards */}
                 <div>
                   <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                     <div className="w-1 h-8 bg-gradient-to-b from-secondary to-info rounded-full"></div>
                     Performance Overview
                   </h2>
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <Card className="bg-bg-card border-border hover:border-success/50 transition-all duration-300 hover:shadow-lg hover:shadow-success/10">
                       <div className="p-6">
                         <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-3">
                             <div className="p-2 bg-success/20 rounded-lg border border-success/30">
                               <CheckCircle className="w-5 h-5 text-success" />
                             </div>
                             <h3 className="text-xl font-semibold text-white">Weekly Progress</h3>
                           </div>
                           <Badge count={stats.weeklyProgress?.completed || 0} className="bg-success text-white font-semibold" />
                         </div>
                         <div className="space-y-4">
                           <div className="flex justify-between items-center">
                             <span className="text-text-muted font-medium">Completed Tasks</span>
                             <span className="text-white font-bold text-lg">
                               {stats.weeklyProgress?.completed || 0} / {stats.weeklyProgress?.total || 0}
                             </span>
                           </div>
                           <div className="space-y-2">
                             <Progress
                               percent={Math.round(((stats.weeklyProgress?.completed || 0) / (stats.weeklyProgress?.total || 1)) * 100)}
                               strokeColor="#10b981"
                               trailColor="#374151"
                               strokeWidth={8}
                               showInfo={false}
                             />
                             <div className="flex justify-between text-sm">
                               <span className="text-text-muted">Progress</span>
                               <span className="text-success font-medium">
                                 {Math.round(((stats.weeklyProgress?.completed || 0) / (stats.weeklyProgress?.total || 1)) * 100)}%
                               </span>
                             </div>
                           </div>
                         </div>
                       </div>
                     </Card>

                     <Card className="bg-bg-card border-border hover:border-info/50 transition-all duration-300 hover:shadow-lg hover:shadow-info/10">
                       <div className="p-6">
                         <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-3">
                             <div className="p-2 bg-info/20 rounded-lg border border-info/30">
                               <BarChart3 className="w-5 h-5 text-info" />
                             </div>
                             <h3 className="text-xl font-semibold text-white">Completion Rate</h3>
                           </div>
                           <Badge count={`${stats.completionRate}%`} className="bg-info text-white font-semibold" />
                         </div>
                         <div className="space-y-4">
                           <div className="flex justify-between items-center">
                             <span className="text-text-muted font-medium">Overall Performance</span>
                             <span className="text-white font-bold text-lg">{stats.completionRate}%</span>
                           </div>
                           <div className="space-y-2">
                             <Progress
                               percent={stats.completionRate}
                               strokeColor="#3b82f6"
                               trailColor="#374151"
                               strokeWidth={8}
                               showInfo={false}
                             />
                             <div className="flex justify-between text-sm">
                               <span className="text-text-muted">Target</span>
                               <span className="text-info font-medium">85% Goal</span>
                             </div>
                           </div>
                         </div>
                       </div>
                     </Card>
                   </div>
                 </div>



                 {/* Recent Activity */}
                 <div>
                   <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                     <div className="w-1 h-8 bg-gradient-to-b from-warning to-danger rounded-full"></div>
                     Recent Activity
                   </h2>
                   <Card className="bg-bg-card border-border hover:border-warning/50 transition-all duration-300">
                     <div className="p-6">
                       <div className="flex items-center gap-3 mb-6">
                         <div className="p-2 bg-warning/20 rounded-lg border border-warning/30">
                           <Clock className="w-5 h-5 text-warning" />
                         </div>
                         <h3 className="text-xl font-semibold text-white">Activity Feed</h3>
                         <Badge count={notifications.length} className="bg-warning text-bg-dark font-semibold ml-auto" />
                       </div>
                       <div className="space-y-4">
                         {notifications.length === 0 ? (
                           <div className="text-center py-12">
                             <div className="p-4 bg-bg-light/50 rounded-full w-fit mx-auto mb-4">
                               <Clock className="w-8 h-8 text-text-muted" />
                             </div>
                             <p className="text-text-muted font-medium">No recent activity</p>
                             <p className="text-sm text-text-secondary mt-1">Your activity feed will appear here</p>
                           </div>
                         ) : (
                           notifications.slice(0, 5).map((activity, index) => (
                             <div key={index} className="flex items-start gap-4 p-4 bg-bg-light/30 hover:bg-bg-light/50 rounded-xl border border-border/50 transition-all duration-200 group">
                               <div className={`p-2 rounded-lg flex-shrink-0 ${
                                 activity.type === 'reminder' ? 'bg-success/20 border border-success/30' :
                                 activity.type === 'interview' ? 'bg-info/20 border border-info/30' :
                                 activity.type === 'follow_up' ? 'bg-secondary/20 border border-secondary/30' :
                                 'bg-danger/20 border border-danger/30'
                               }`}>
                                 {activity.type === 'reminder' ? <CheckCircle className="w-4 h-4 text-success" /> :
                                  activity.type === 'interview' ? <Calendar className="w-4 h-4 text-info" /> :
                                  activity.type === 'follow_up' ? <Users className="w-4 h-4 text-secondary" /> :
                                  <AlertTriangle className="w-4 h-4 text-danger" />}
                               </div>
                               <div className="flex-1 min-w-0">
                                 <p className="text-white font-medium group-hover:text-primary transition-colors">{activity.title}</p>
                                 <p className="text-sm text-text-muted mt-1">
                                   {new Date(activity.timestamp).toLocaleDateString('en-US', {
                                     month: 'short',
                                     day: 'numeric',
                                     hour: '2-digit',
                                     minute: '2-digit'
                                   })}
                                 </p>
                               </div>
                             </div>
                           ))
                         )}
                       </div>
                     </div>
                   </Card>
                  </div>
                </div>
              </TabPane>

               <TabPane
                 tab={
                   <span className="flex items-center gap-3 px-4 py-3 text-base font-semibold">
                     {getTabIcon('activities')}
                     Activity Hub
                     {stats.totalActivities > 0 && (
                       <Badge count={stats.totalActivities} className="bg-primary text-white font-semibold ml-2" />
                     )}
                   </span>
                 }
                 key="activities"
               >
                 <div className="mt-6">
                   <ActivityHub />
                 </div>
               </TabPane>

               <TabPane
                 tab={
                   <span className="flex items-center gap-3 px-4 py-3 text-base font-semibold">
                     {getTabIcon('followups')}
                     Follow-up Tracker
                     {stats.overdueFollowUps > 0 && (
                       <Badge count={stats.overdueFollowUps} className="bg-warning text-bg-dark font-semibold ml-2" />
                     )}
                   </span>
                 }
                 key="followups"
               >
                 <div className="mt-6">
                   <FollowUpTracker />
                 </div>
               </TabPane>

               <TabPane
                 tab={
                   <span className="flex items-center gap-3 px-4 py-3 text-base font-semibold">
                     {getTabIcon('notifications')}
                     Notifications
                     {notificationService.getUnreadCount() > 0 && (
                       <Badge count={notificationService.getUnreadCount()} className="bg-danger text-white font-semibold ml-2" />
                     )}
                   </span>
                 }
                 key="notifications"
               >
                 <div className="mt-6">
                   <NotificationsPanel notifications={notifications} />
                 </div>
               </TabPane>
             </Tabs>
           </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default UnifiedDashboard;