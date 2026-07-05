'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import AgentStatusWidget from '@/components/dashboard/AgentStatusWidget';
import OpportunityFeed from '@/components/dashboard/OpportunityFeed';
import ActivityLog from '@/components/dashboard/ActivityLog';
import ApplicationTracker from '@/components/dashboard/ApplicationTracker';
import type { TrackedApplication } from '@/components/dashboard/ApplicationTracker';
import { useSession } from 'next-auth/react';

interface DashboardStats {
  jobStats: {
    totalApplications: number;
    activeApplications: number;
    interviews: number;
    offers: number;
    responseRate: number;
  };
  applicationStatus: Array<{ name: string; value: number; color: string }>;
}

const DashboardPage = () => {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [applications, setApplications] = useState<TrackedApplication[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard/simple-stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        /* silent — widgets show empty state */
      }

      try {
        const res = await fetch('/api/applications');
        if (res.ok) {
          const data = await res.json();
          const apps = (data.applications || data || []).slice(0, 5).map((a: Record<string, string>) => ({
            id: a._id || a.id,
            role: a.jobTitle || a.role || a.title || 'Untitled',
            company: a.company || 'Unknown',
            status: a.status || 'Applied',
            appliedDate: a.appliedDate ? new Date(a.appliedDate).toLocaleDateString() : '',
          }));
          setApplications(apps);
        }
      } catch {
        /* silent */
      }
    };

    fetchData();
  }, []);

  return (
    <AppLayout showFooter={false}>
      <div className="p-4 md:p-8 bg-[var(--bg-deep)] min-h-screen text-[var(--text-main)]">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
            <p className="text-[var(--text-muted)]">
              Welcome back, <span className="text-[var(--accent)]">{session?.user?.name || 'User'}</span>.
            </p>
          </div>

          <section>
            <AgentStatusWidget totalScanned={stats?.jobStats.totalApplications ?? 0} />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 h-[500px] lg:h-[600px]">
              <OpportunityFeed />
            </section>
            <section className="lg:col-span-1 h-[500px] lg:h-[600px]">
              <ActivityLog />
            </section>
          </div>

          <section className="h-auto min-h-[300px]">
            <ApplicationTracker applications={applications} />
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
