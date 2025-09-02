'use client';

import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import AppLayout from '@/components/AppLayout';
import { Briefcase, Search, Target, TrendingUp, Users, Calendar, MapPin, DollarSign, Brain } from 'lucide-react';
import { FormDateInput } from '@/components/ui/FormInput';

// Mock job hunting data
const mockJobStats = {
  totalApplications: 47,
  activeApplications: 23,
  interviews: 8,
  offers: 2,
  responseRate: 34,
  avgResponseTime: 5.2
};

const mockUserProfile = {
  first_name: 'Saurav',
  last_name: 'Lakhota',
  email: 'mdsauravku@gmail.com',
  role: 'Job Seeker',
  account_status: 'Active',
  targetRole: 'Senior Frontend Developer',
  preferredLocation: 'San Francisco, CA'
};

const mockApplicationTrendData = [
  { date: '01', applications: 2, interviews: 0 }, { date: '02', applications: 1, interviews: 1 }, 
  { date: '03', applications: 3, interviews: 0 }, { date: '04', applications: 4, interviews: 1 }, 
  { date: '05', applications: 2, interviews: 2 }, { date: '06', applications: 1, interviews: 0 },
  { date: '07', applications: 0, interviews: 1 }, { date: '08', applications: 3, interviews: 0 }, 
  { date: '09', applications: 4, interviews: 1 }, { date: '10', applications: 2, interviews: 0 }, 
  { date: '11', applications: 1, interviews: 2 }, { date: '12', applications: 3, interviews: 1 },
  { date: '13', applications: 4, interviews: 0 }, { date: '14', applications: 2, interviews: 1 }, 
  { date: '15', applications: 1, interviews: 0 }, { date: '16', applications: 3, interviews: 2 },
];

const mockApplicationStatus = [
  { name: 'Applied', value: 23, color: '#10b981' },
  { name: 'In Review', value: 12, color: '#f59e0b' },
  { name: 'Interview', value: 8, color: '#3b82f6' },
  { name: 'Offer', value: 2, color: '#8b5cf6' },
  { name: 'Rejected', value: 2, color: '#ef4444' }
];

const mockTopSkills = [
    { id: 1, skill: 'React.js' }, { id: 2, skill: 'TypeScript' }, { id: 3, skill: 'Node.js' },
    { id: 4, skill: 'Next.js' }, { id: 5, skill: 'Tailwind CSS' }, { id: 6, skill: 'GraphQL' },
    { id: 7, skill: 'AWS' }, { id: 8, skill: 'MongoDB' }, { id: 9, skill: 'Docker' },
];

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
  const [fromDate, setFromDate] = useState('2025-01-09');
  const [toDate, setToDate] = useState('2025-09-30');

    return (
      <AppLayout showFooter={false}>
      <div className="p-8 bg-bg min-h-screen">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Briefcase className="w-10 h-10 text-primary" />
              Job Hunt Dashboard
            </h1>
            <p className="text-text-muted text-lg">Welcome back! Here&apos;s your job search progress and insights.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <style jsx global>{`
              input[type="date"]::-webkit-calendar-picker-indicator { 
                opacity: 0.7; 
                filter: invert(1);
              }
              input[type="date"] {
                color-scheme: dark;
              }
            `}</style>
            
            <div className="flex items-center gap-3 bg-bg-card px-4 py-2 rounded-lg border border-border">
              <label className="text-sm font-medium text-text-muted">From:</label>
              <FormDateInput
                value={fromDate}
                onChange={(value) => setFromDate(value)}
                className="bg-transparent border-none"
              />
            </div>
            
            <div className="flex items-center gap-3 bg-bg-card px-4 py-2 rounded-lg border border-border">
              <label className="text-sm font-medium text-text-muted">To:</label>
              <FormDateInput
                value={toDate}
                onChange={(value) => setToDate(value)}
                className="bg-transparent border-none"
              />
            </div>
            
            <button className="px-4 py-2 bg-bg-card hover:bg-bg-light text-text border border-border rounded-lg transition-all duration-200 text-sm font-medium">
              Reset Layout
            </button>
            
            <button className="px-6 py-2 bg-gradient-to-r from-primary to-success hover:from-success hover:to-primary text-white rounded-lg transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl">
              Export Data
            </button>
          </div>
        </div>

        <div id="dashboard-main-area">
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
          >
            <div
              key="a"
              className="bg-bg-card hover:bg-bg-light transition-all duration-300 cursor-pointer rounded-xl shadow-lg border border-border hover:border-primary/50 p-8 flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-8 h-8 text-primary" />
                  <h3 className="text-lg font-semibold text-text-muted">Total Applications</h3>
                </div>
                <div className="text-3xl font-bold text-white mb-4">{mockJobStats.totalApplications}</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Active:</span>
                  <span className="text-success font-medium">{mockJobStats.activeApplications}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Response Rate:</span>
                  <span className="text-primary font-medium">{mockJobStats.responseRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">This Month:</span>
                  <span className="text-text font-medium">+12</span>
                </div>
              </div>
            </div>

            <div
              key="b"
              className="bg-bg-card hover:bg-bg-light transition-all duration-300 cursor-pointer rounded-xl shadow-lg border border-border hover:border-primary/50 p-8 flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-8 h-8 text-success" />
                  <h3 className="text-lg font-semibold text-text-muted">Interviews</h3>
                </div>
                <div className="text-3xl font-bold text-white mb-4">
                  {mockJobStats.interviews}
                  <span className="text-lg text-text-muted font-normal"> scheduled</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="w-full bg-border-muted rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-success to-primary rounded-full transition-all duration-500"
                    style={{ width: `${(mockJobStats.interviews / mockJobStats.totalApplications) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Interview Rate</span>
                  <span className="text-success font-medium">{Math.round((mockJobStats.interviews / mockJobStats.totalApplications) * 100)}%</span>
                </div>
              </div>
            </div>

            <div
              key="h"
              className="bg-bg-card hover:bg-bg-light transition-all duration-300 cursor-pointer rounded-xl shadow-lg border border-border hover:border-primary/50 p-8 flex flex-col h-full"
            >
              <div className="w-full h-full">
                <div className="flex items-center gap-3 mb-4">
                  <Search className="w-6 h-6 text-warning" />
                  <h3 className="text-lg font-semibold text-text-muted">Top Skills</h3>
                </div>
                <div className="flex flex-wrap gap-2 min-h-32 max-h-48 overflow-y-auto">
                    {mockTopSkills.map((skill) => (
                      <span 
                        key={skill.id} 
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-colors"
                      >
                        {skill.skill}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            <div
              key="k"
              className="bg-bg-card hover:bg-bg-light transition-all duration-300 cursor-pointer rounded-xl shadow-lg border border-border hover:border-primary/50 p-8 flex flex-col h-full"
            >
              <div className="w-full h-full">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-6 h-6 text-primary" />
                  <h3 className="text-lg font-semibold text-text-muted">Profile</h3>
                </div>
                <div className="space-y-3">
                  <div className="text-xl font-bold text-white">
                    {mockUserProfile.first_name} {mockUserProfile.last_name}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-text-muted" />
                      <span className="text-text">{mockUserProfile.targetRole}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-text-muted" />
                      <span className="text-text">{mockUserProfile.preferredLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Status:</span>
                      <span className="text-success font-medium">{mockUserProfile.account_status}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              key="i"
              className="bg-bg-card hover:bg-bg-light transition-all duration-300 cursor-pointer rounded-xl shadow-lg border border-border hover:border-primary/50 p-8 flex flex-col h-full"
            >
              <div className="w-full h-full">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-success" />
                  <h3 className="text-lg font-semibold text-text-muted">Application Activity</h3>
                </div>
                <div style={{ height: '240px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockApplicationTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
              className="bg-bg-card hover:bg-bg-light transition-all duration-300 cursor-pointer rounded-xl shadow-lg border border-border hover:border-primary/50 p-8 flex flex-col h-full"
            >
              <div className="w-full h-full">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign className="w-6 h-6 text-warning" />
                  <h3 className="text-lg font-semibold text-text-muted">Application Status</h3>
                </div>
                <div style={{ height: '200px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mockApplicationStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {mockApplicationStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {mockApplicationStatus.map((status, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: status.color }}
                      ></div>
                      <span className="text-text-muted">{status.name}: {status.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              key="g"
              className="bg-bg-card hover:bg-bg-light transition-all duration-300 cursor-pointer rounded-xl shadow-lg border border-border hover:border-primary/50 p-8 flex flex-col h-full"
            >
              <div className="w-full h-full">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-6 h-6 text-primary" />
                  <h3 className="text-lg font-semibold text-text-muted">Quick Actions</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 h-full">
                  <a href="/job-search" className="flex flex-col items-center justify-center gap-2 p-4 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg transition-colors group">
                    <Search className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-primary">Search Jobs</span>
                  </a>
                  
                  <a href="/application-tracking" className="flex flex-col items-center justify-center gap-2 p-4 bg-success/10 hover:bg-success/20 border border-success/30 rounded-lg transition-colors group">
                    <Briefcase className="w-8 h-8 text-success group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-success">Track Apps</span>
                  </a>
                  
                  <a href="/user-profile" className="flex flex-col items-center justify-center gap-2 p-4 bg-warning/10 hover:bg-warning/20 border border-warning/30 rounded-lg transition-colors group">
                    <Users className="w-8 h-8 text-warning group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-warning">Update Profile</span>
                  </a>
                  
                  <a href="/ai-filtering" className="flex flex-col items-center justify-center gap-2 p-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg transition-colors group">
                    <Brain className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-purple-400">AI Filter</span>
                  </a>
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