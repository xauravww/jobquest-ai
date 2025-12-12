'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import AgentStatusWidget from '@/components/dashboard/AgentStatusWidget';
import OpportunityFeed from '@/components/dashboard/OpportunityFeed';
import ActivityLog from '@/components/dashboard/ActivityLog';
import ApplicationTracker from '@/components/dashboard/ApplicationTracker';
import { useSession } from 'next-auth/react';

const DashboardPage = () => {
  const { data: session } = useSession();

  return (
    <AppLayout showFooter={false}>
      <div className="p-4 md:p-8 bg-[var(--bg-deep)] min-h-screen text-[var(--text-main)]">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Mission Control
              </h1>
              <p className="text-[var(--text-muted)]">
                Welcome back, <span className="text-[var(--primary)]">{session?.user?.name || 'User'}</span>. Your AI agent is active.
              </p>
            </div>
          </div>

          {/* Zone A: Agent Status */}
          <section>
            <AgentStatusWidget />
          </section>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Zone B: Opportunity Feed (2/3 width) */}
            <section className="lg:col-span-2 h-[500px] lg:h-[600px]">
              <OpportunityFeed />
            </section>

            {/* Zone C: Activity Log (1/3 width) */}
            <section className="lg:col-span-1 h-[500px] lg:h-[600px]">
              <ActivityLog />
            </section>
          </div>

          {/* Zone D: Application Tracker */}
          <section className="h-auto min-h-[300px]">
            <ApplicationTracker />
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
