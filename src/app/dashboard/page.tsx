'use client';

import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import AppLayout from '@/components/AppLayout';
import { Briefcase, Search, Target, TrendingUp, Users, Calendar, MapPin, DollarSign, Brain, Bell } from 'lucide-react';
import { FormDateInput } from '@/components/ui/FormInput';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface JobStats {
  totalApplications: number;
  activeApplications: number;
  interviews: number;
  offers: number;
  responseRate: number;
}

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  account_status: string;
  targetRole: string;
  preferredLocation: string;
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

const ResponsiveReactGridLayout = WidthProvider(Responsive);

const defaultLayouts = {
  "lg": [{ "w": 4, "h": 3, "x": 0, "y": 0, "i": "a" }, { "w": 4, "h": 3, "x": 4, "y": 0, "i": "b" }, { "w": 4, "h": 3, "x": 8, "y": 0, "i": "h" }, { "w": 4, "h": 3, "x": 0, "y": 3, "i": "k" }, { "w": 8, "h": 4, "x": 4, "y": 3, "i": "i" }, { "w": 4, "h": 4, "x": 0, "y": 6, "i": "l" }, { "w": 8, "h": 3, "x": 4, "y": 7, "i": "g" }],
};

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: 'var(--bg-light)', border: '1px solid var(--border)', padding: '10px', borderRadius: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', color: 'var(--text)' }}>
        <p style={{ margin: '0 0 5px', fontWeight: 'bold' }}>{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ margin: '0', color: entry.color }}>{`${entry.name}: ${entry.value}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

const DashboardContent = () => {
  const { data: session } = useSession();
  const [fromDate, setFromDate] = useState('2025-01-09');
  const [toDate, setToDate] = useState('2025-09-30');
  const [jobStats, setJobStats] = useState<JobStats>({
    totalApplications: 0,
    activeApplications: 0,
    interviews: 0,
    offers: 0,
    responseRate: 0
  });
  const [userProfile, setUserProfile] = useState<UserProfile>({
    first_name: 'User',
    last_name: '',
    email: '',
    role: 'Job Seeker',
    account_status: 'Active',
    targetRole: 'Software Developer',
    preferredLocation: 'Remote'
  });
  const [applicationTrendData, setApplicationTrendData] = useState<ApplicationTrendData[]>([]);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus[]>([]);
  const [topSkills, setTopSkills] = useState<TopSkill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch application stats
        const statsResponse = await fetch('/api/applications');
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          setJobStats(stats);
        }

        // Fetch user profile
        const profileResponse = await fetch('/api/user/profile');
        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          setUserProfile({
            first_name: profile.firstName || 'User',
            last_name: profile.lastName || '',
            email: profile.email || session?.user?.email || '',
            role: 'Job Seeker',
            account_status: 'Active',
            targetRole: profile.targetRole || 'Software Developer',
            preferredLocation: profile.location || 'Remote'
          });
        }

        // Fetch jobs by date range for trend data
        const jobsResponse = await fetch(`/api/applications?dateFrom=${fromDate}&dateTo=${toDate}`);
        if (jobsResponse.ok) {
          const jobs = await jobsResponse.json();

          // Process jobs into trend data
          const trendMap = new Map<string, { applications: number; interviews: number }>();

          jobs.forEach((job: any) => {
            const date = new Date(job.datePosted || job.createdAt).getDate().toString().padStart(2, '0');
            const existing = trendMap.get(date) || { applications: 0, interviews: 0 };
            existing.applications += 1;
            if (job.status === 'interviewing') {
              existing.interviews += 1;
            }
            trendMap.set(date, existing);
          });

          const trendData = Array.from(trendMap.entries()).map(([date, data]) => ({
            date,
            ...data
          })).sort((a, b) => parseInt(a.date) - parseInt(b.date));

          setApplicationTrendData(trendData);

          // Process application status data
          const statusMap = new Map<string, number>();
          jobs.forEach((job: unknown) => {
            const status = job.status || 'applied';
            statusMap.set(status, (statusMap.get(status) || 0) + 1);
          });

          const statusData = [
            { name: 'Applied', value: statusMap.get('applied') || statusMap.get('submitted') || 0, color: '#10b981' },
            { name: 'In Review', value: statusMap.get('under_review') || 0, color: '#f59e0b' },
            { name: 'Interview', value: statusMap.get('interviewing') || statusMap.get('phone_screening') || statusMap.get('technical_interview') || 0, color: '#3b82f6' },
            { name: 'Offer', value: statusMap.get('offer_received') || statusMap.get('offered') || 0, color: '#8b5cf6' },
            { name: 'Rejected', value: statusMap.get('rejected') || 0, color: '#ef4444' }
          ].filter(item => item.value > 0);

          setApplicationStatus(statusData);
        }

        // Fetch resumes to extract skills
        const resumesResponse = await fetch('/api/resumes');
        if (resumesResponse.ok) {
          const resumes = await resumesResponse.json();
          const skillsSet = new Set<string>();

          resumes.forEach((resume: unknown) => {
            if (resume.skills?.technical) {
              resume.skills.technical.forEach((skill: string) => skillsSet.add(skill));
            }
            if (resume.skills?.frameworks) {
              resume.skills.frameworks.forEach((skill: string) => skillsSet.add(skill));
            }
          });

          const skillsArray = Array.from(skillsSet).slice(0, 9).map((skill, index) => ({
            id: index + 1,
            skill
          }));

          setTopSkills(skillsArray.length > 0 ? skillsArray : [
            { id: 1, skill: 'JavaScript' }, { id: 2, skill: 'React' }, { id: 3, skill: 'Node.js' },
            { id: 4, skill: 'TypeScript' }, { id: 5, skill: 'Python' }, { id: 6, skill: 'SQL' }
          ]);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Keep default/fallback data on error
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchDashboardData();
    }
  }, [session, fromDate, toDate]);

  if (loading && !session) {
    return (
      <AppLayout showFooter={false}>
        <div className="p-4 md:p-8 bg-bg min-h-screen flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-text-muted">Loading your dashboard...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showFooter={false}>
      <div className="p-4 md:p-8 bg-bg min-h-screen overflow-x-hidden max-w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Briefcase className="w-8 h-8 md:w-10 md:h-10 text-primary flex-shrink-0" />
              <span className="truncate">Job Hunt Dashboard</span>
            </h1>
            <p className="text-text-muted text-base md:text-lg">Welcome back! Here&apos;s your job search progress and insights.</p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 min-w-0">
            <style jsx global>{`
              input[type="date"]::-webkit-calendar-picker-indicator { 
                opacity: 0.7; 
                filter: invert(1);
              }
              input[type="date"] {
                color-scheme: dark;
              }
            `}</style>

            <div className="flex items-center gap-2 bg-bg-card px-3 py-2 rounded-lg border border-border min-w-0">
              <label className="text-xs font-medium text-text-muted whitespace-nowrap">From:</label>
              <FormDateInput
                value={fromDate}
                onChange={(value) => setFromDate(value)}
                className="bg-transparent border-none text-sm min-w-0"
              />
            </div>

            <div className="flex items-center gap-2 bg-bg-card px-3 py-2 rounded-lg border border-border min-w-0">
              <label className="text-xs font-medium text-text-muted whitespace-nowrap">To:</label>
              <FormDateInput
                value={toDate}
                onChange={(value) => setToDate(value)}
                className="bg-transparent border-none text-sm min-w-0"
              />
            </div>

            <button className="px-3 py-2 bg-bg-card hover:bg-bg-light text-text border border-border rounded-lg transition-all duration-200 text-xs font-medium whitespace-nowrap">
              Reset Layout
            </button>

            <button className="px-4 py-2 bg-gradient-to-r from-primary to-success hover:from-success hover:to-primary text-white rounded-lg transition-all duration-200 text-xs font-semibold shadow-lg hover:shadow-xl whitespace-nowrap">
              Export Data
            </button>
          </div>
        </div>

        <div id="dashboard-main-area" className="w-full overflow-hidden">
          <style jsx global>{`
            .react-grid-layout {
              position: relative;
              max-width: 100%;
              overflow: hidden;
            }
            .react-grid-item {
              transition: all 200ms ease;
              transition-property: left, top;
              box-sizing: border-box;
              max-width: 100%;
            }
            .react-grid-item > .react-resizable-handle {
              display: none;
            }
            .layout {
              max-width: 100%;
              overflow-x: hidden;
            }
          `}</style>
          <ResponsiveReactGridLayout
            className="layout"
            layouts={defaultLayouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={100}
            isDraggable={false}
            isResizable={false}
            compactType="vertical"
            preventCollision={false}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            width={1200}
          >
            <div
              key="a"
              className="bg-bg-card hover:bg-bg-light transition-all duration-300 cursor-pointer rounded-xl shadow-lg border border-border hover:border-primary/50 p-4 md:p-6 flex flex-col justify-between h-full overflow-hidden"
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-6 h-6 text-primary flex-shrink-0" />
                  <h3 className="text-sm md:text-lg font-semibold text-text-muted truncate">Total Applications</h3>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white mb-3 flex items-center gap-2">
                  {loading ? <LoadingSpinner size="sm" /> : jobStats.totalApplications}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Active:</span>
                  <span className="text-success font-medium">{loading ? '...' : jobStats.activeApplications}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Response Rate:</span>
                  <span className="text-primary font-medium">{loading ? '...' : jobStats.responseRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">This Month:</span>
                  <span className="text-text font-medium">+12</span>
                </div>
              </div>
            </div>

            <div
              key="b"
              className="bg-bg-card hover:bg-bg-light transition-all duration-300 cursor-pointer rounded-xl shadow-lg border border-border hover:border-primary/50 p-4 md:p-6 flex flex-col justify-between h-full overflow-hidden"
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-6 h-6 text-success flex-shrink-0" />
                  <h3 className="text-sm md:text-lg font-semibold text-text-muted truncate">Interviews</h3>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white mb-3 flex items-center gap-2">
                  {loading ? <LoadingSpinner size="sm" /> : jobStats.interviews}
                  <span className="text-sm md:text-lg text-text-muted font-normal"> scheduled</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="w-full bg-border-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-success to-primary rounded-full transition-all duration-500"
                    style={{ width: `${jobStats.totalApplications > 0 ? (jobStats.interviews / jobStats.totalApplications) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Interview Rate</span>
                  <span className="text-success font-medium">{jobStats.totalApplications > 0 ? Math.round((jobStats.interviews / jobStats.totalApplications) * 100) : 0}%</span>
                </div>
              </div>
            </div>

            <div
              key="h"
              className="bg-bg-card hover:bg-bg-light transition-all duration-300 cursor-pointer rounded-xl shadow-lg border border-border hover:border-primary/50 p-4 md:p-6 flex flex-col h-full overflow-hidden"
            >
              <div className="w-full h-full">
                <div className="flex items-center gap-2 mb-3">
                  <Search className="w-5 h-5 text-warning flex-shrink-0" />
                  <h3 className="text-sm md:text-lg font-semibold text-text-muted truncate">Top Skills</h3>
                </div>
                <div className="flex flex-wrap gap-2 min-h-32 max-h-48 overflow-y-auto">
                  {loading ? (
                    <div className="text-text-muted">Loading skills...</div>
                  ) : topSkills.length > 0 ? (
                    topSkills.map((skill) => (
                      <span
                        key={skill.id}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-colors"
                      >
                        {skill.skill}
                      </span>
                    ))
                  ) : (
                    <div className="text-text-muted text-sm">No skills found. Add skills to your resume!</div>
                  )}
                </div>
              </div>
            </div>

            <div
              key="k"
              className="bg-bg-card hover:bg-bg-light transition-all duration-300 cursor-pointer rounded-xl shadow-lg border border-border hover:border-primary/50 p-4 md:p-6 flex flex-col h-full overflow-hidden"
            >
              <div className="w-full h-full">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-primary flex-shrink-0" />
                  <h3 className="text-sm md:text-lg font-semibold text-text-muted truncate">Profile</h3>
                </div>
                <div className="space-y-3">
                  <div className="text-lg md:text-xl font-bold text-white truncate">
                    {loading ? 'Loading...' : `${userProfile.first_name} ${userProfile.last_name}`.trim() || 'User'}
                  </div>
                  <div className="space-y-2 text-xs md:text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <Target className="w-3 h-3 md:w-4 md:h-4 text-text-muted flex-shrink-0" />
                      <span className="text-text truncate">{loading ? 'Loading...' : userProfile.targetRole}</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="w-3 h-3 md:w-4 md:h-4 text-text-muted flex-shrink-0" />
                      <span className="text-text truncate">{loading ? 'Loading...' : userProfile.preferredLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Status:</span>
                      <span className="text-success font-medium">{userProfile.account_status}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              key="i"
              className="bg-bg-card hover:bg-bg-light transition-all duration-300 cursor-pointer rounded-xl shadow-lg border border-border hover:border-primary/50 p-4 md:p-6 flex flex-col h-full overflow-hidden"
            >
              <div className="w-full h-full">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-success flex-shrink-0" />
                  <h3 className="text-sm md:text-lg font-semibold text-text-muted truncate">Application Activity</h3>
                </div>
                <div style={{ height: '240px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={applicationTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                        interval={0}
                        height={50}
                        axisLine={{ stroke: 'var(--border)' }}
                        tickLine={{ stroke: 'var(--border)' }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                        axisLine={{ stroke: 'var(--border)' }}
                        tickLine={{ stroke: 'var(--border)' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="applications"
                        fill="url(#applicationGradient)"
                        name="Applications"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="interviews"
                        fill="url(#interviewGradient)"
                        name="Interviews"
                        radius={[4, 4, 0, 0]}
                      />
                      <defs>
                        <linearGradient id="applicationGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" />
                          <stop offset="100%" stopColor="var(--success)" />
                        </linearGradient>
                        <linearGradient id="interviewGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--success)" />
                          <stop offset="100%" stopColor="var(--warning)" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-4 text-sm font-medium text-text-muted">February 2025</div>
              </div>
            </div>

            <div
              key="l"
              className="bg-bg-card hover:bg-bg-light transition-all duration-300 cursor-pointer rounded-xl shadow-lg border border-border hover:border-primary/50 p-4 md:p-6 flex flex-col h-full overflow-hidden"
            >
              <div className="w-full h-full">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 text-warning flex-shrink-0" />
                  <h3 className="text-sm md:text-lg font-semibold text-text-muted truncate">Application Status</h3>
                </div>
                <div style={{ height: '200px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={applicationStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {applicationStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {loading ? (
                    <div className="col-span-2 text-text-muted text-sm">Loading status data...</div>
                  ) : applicationStatus.length > 0 ? (
                    applicationStatus.map((status, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: status.color }}
                        ></div>
                        <span className="text-text-muted">{status.name}: {status.value}</span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-text-muted text-sm">No application data yet</div>
                  )}
                </div>
              </div>
            </div>

            <div
              key="g"
              className="bg-bg-card hover:bg-bg-light transition-all duration-300 cursor-pointer rounded-xl shadow-lg border border-border hover:border-primary/50 p-4 md:p-6 flex flex-col h-full overflow-hidden"
            >
              <div className="w-full h-full">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="w-5 h-5 text-warning flex-shrink-0" />
                  <h3 className="text-sm md:text-lg font-semibold text-text-muted truncate">Upcoming Reminders</h3>
                </div>
                <div className="space-y-2 h-full overflow-y-auto">
                  <div className="flex items-center gap-2 p-2 bg-bg-light rounded-lg">
                    <div className="w-2 h-2 bg-warning rounded-full"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">Follow up on Software Engineer application</p>
                      <p className="text-xs text-text-muted">Tomorrow at 10:00 AM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-bg-light rounded-lg">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">Technical Interview - Google</p>
                      <p className="text-xs text-text-muted">Friday at 2:00 PM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-bg-light rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">Prepare for final round</p>
                      <p className="text-xs text-text-muted">Next Monday at 9:00 AM</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <a 
                      href="/reminders-calendar" 
                      className="text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      View all reminders →
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </ResponsiveReactGridLayout>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardContent;