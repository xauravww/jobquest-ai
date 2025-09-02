'use client';

import React from 'react';
import { Card, Statistic } from 'antd';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Label } from 'recharts';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import AppLayout from '@/components/AppLayout';

// Using mock data to display the charts and statistics
const mockUsageData = {
  current_usage: { total_keywords: 55 },
  subscription_limits: { max_keywords: 100 },
  usage_percentage: { keywords: 55 },
};

const mockUserProfile = {
  first_name: 'Saurav',
  last_name: 'Lakhota',
  email: 'mdsauravku@gmail.com',
  role: 'user',
  account_status: 'Review',
};

const mockContentTrendData = [
  { date: '01', count: 2 }, { date: '02', count: 1 }, { date: '03', count: 3 }, { date: '04', count: 4 }, { date: '05', count: 2 }, { date: '06', count: 1 },
  { date: '07', count: 0 }, { date: '08', count: 3 }, { date: '09', count: 4 }, { date: '10', count: 2 }, { date: '11', count: 1 }, { date: '12', count: 3 },
  { date: '13', count: 4 }, { date: '14', count: 2 }, { date: '15', count: 1 }, { date: '16', count: 3 }, { date: '17', count: 4 }, { date: '18', count: 2 },
  { date: '19', count: 1 }, { date: '20', count: 3 }, { date: '21', count: 4 }, { date: '22', count: 2 }, { date: '23', count: 1 }, { date: '24', count: 3 },
  { date: '25', count: 4 }, { date: '26', count: 2 }, { date: '27', count: 1 }, { date: '28', count: 3 }, { date: '29', count: 4 }, { date: '30', count: 2 },
];

const mockKeywords = [
    { id: 1, keyword: 'react-js' }, { id: 2, keyword: 'next-js' }, { id: 3, keyword: 'tailwind-css' },
    { id: 4, keyword: 'ui-ux' }, { id: 5, keyword: 'dashboard' }, { id: 6, keyword: 'frontend' },
    { id: 7, keyword: 'design' }, { id: 8, keyword: 'api-service' }, { id: 9, keyword: 'data-visualization' },
];

const ResponsiveReactGridLayout = WidthProvider(Responsive);

const defaultLayouts = {
  "lg": [{ "w": 4, "h": 3, "x": 0, "y": 0, "i": "a" }, { "w": 4, "h": 3, "x": 4, "y": 0, "i": "b" }, { "w": 8, "h": 3, "x": 4, "y": 6, "i": "g" }, { "w": 4, "h": 3, "x": 8, "y": 0, "i": "h" }, { "w": 8, "h": 4, "x": 4, "y": 3, "i": "i" }, { "w": 4, "h": 3, "x": 0, "y": 3, "i": "k" }, { "w": 4, "h": 4, "x": 0, "y": 6, "i": "l" }],
};

const CustomTooltip = ({ active, payload, label }) => {
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
    return (
      <AppLayout>
      <div className="p-8 bg-bg min-h-screen">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-text-muted text-lg">Welcome back! Here's what&apos;s happening with your campaigns.</p>
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
              <label htmlFor="min-date" className="text-sm font-medium text-text-muted">From:</label>
              <input 
                id="min-date" 
                type="date" 
                defaultValue="2025-01-09"
                className="bg-transparent text-text text-sm border-none outline-none"
              />
            </div>
            
            <div className="flex items-center gap-3 bg-bg-card px-4 py-2 rounded-lg border border-border">
              <label htmlFor="max-date" className="text-sm font-medium text-text-muted">To:</label>
              <input 
                id="max-date" 
                type="date" 
                defaultValue="2025-09-30"
                className="bg-transparent text-text text-sm border-none outline-none"
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
            <Card
              key="a"
              className="bg-bg-card hover:bg-bg-light transition-all duration-300 cursor-pointer rounded-xl shadow-lg border border-border hover:border-primary/50"
              bordered={false}
              bodyStyle={{ padding: 32, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <h3 className="text-lg font-semibold text-text-muted mb-2">Active Subscription</h3>
                <div className="text-3xl font-bold text-white mb-4">Basic Plan</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Price:</span>
                  <span className="text-text font-medium">$1</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Duration:</span>
                  <span className="text-text font-medium">30 days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Status:</span>
                  <span className="text-success font-medium">Active</span>
                </div>
              </div>
            </Card>

            <Card
              key="b"
              className="bg-bg-card hover:bg-bg-light transition-all duration-300 cursor-pointer rounded-xl shadow-lg border border-border hover:border-primary/50"
              bordered={false}
              bodyStyle={{ padding: 32, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <h3 className="text-lg font-semibold text-text-muted mb-2">Keywords Used</h3>
                <div className="text-3xl font-bold text-white mb-4">
                  {mockUsageData.current_usage.total_keywords}
                  <span className="text-lg text-text-muted font-normal"> / {mockUsageData.subscription_limits.max_keywords}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="w-full bg-border-muted rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all duration-500"
                    style={{ width: `${mockUsageData.usage_percentage.keywords}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Usage</span>
                  <span className="text-primary font-medium">{mockUsageData.usage_percentage.keywords}%</span>
                </div>
              </div>
            </Card>

            <Card
              key="h"
              className="bg-bg-card hover:bg-bg-light transition-all duration-300 cursor-pointer rounded-xl shadow-lg border border-border hover:border-primary/50"
              bordered={false}
              bodyStyle={{ padding: 32, height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <div className="w-full h-full">
                <h3 className="text-lg font-semibold text-text-muted mb-4">Top Keywords</h3>
                <div className="text-sm text-text-secondary mb-4">No keywords found.</div>
                <div className="flex flex-wrap gap-2 min-h-32 max-h-48 overflow-y-auto">
                    {mockKeywords.map((k) => (
                      <span 
                        key={k.id} 
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-bg-light border border-border text-text hover:border-primary/50 transition-colors"
                      >
                        {k.keyword}
                      </span>
                    ))}
                </div>
              </div>
            </Card>

            <Card
              key="k"
              className="bg-bg-card hover:bg-bg-light transition-all duration-300 cursor-pointer rounded-xl shadow-lg border border-border hover:border-primary/50"
              bordered={false}
              bodyStyle={{ padding: 32, height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <div className="w-full h-full">
                <h3 className="text-lg font-semibold text-text-muted mb-4">User Profile</h3>
                <div className="space-y-3">
                  <div className="text-xl font-bold text-white">
                    {mockUserProfile.first_name} {mockUserProfile.last_name}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Email:</span>
                      <span className="text-text">{mockUserProfile.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Role:</span>
                      <span className="text-text capitalize">{mockUserProfile.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Status:</span>
                      <span className="text-warning font-medium">{mockUserProfile.account_status}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card
              key="i"
              className="bg-bg-card hover:bg-bg-light transition-all duration-300 cursor-pointer rounded-xl shadow-lg border border-border hover:border-primary/50"
              bordered={false}
              bodyStyle={{ padding: 32, height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <div className="w-full h-full">
                <h3 className="text-lg font-semibold text-text-muted mb-4">Monthly Content Generation Trend</h3>
                <div style={{ height: '240px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockContentTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
                        dataKey="count" 
                        fill="url(#colorGradient)" 
                        name="Content Generated" 
                        radius={[4, 4, 0, 0]}
                      />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" />
                          <stop offset="100%" stopColor="var(--success)" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-4 text-sm font-medium text-text-muted">September 2025</div>
              </div>
            </Card>

          </ResponsiveReactGridLayout>
        </div>
      </div>
      </AppLayout>
    );
};

export default DashboardContent;