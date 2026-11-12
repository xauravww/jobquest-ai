'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import Button from '@/components/ui/Button';
import FormPageSkeleton from '@/components/ui/FormPageSkeleton';
import CoverLetterModal from '@/components/modals/CoverLetterModal';

interface Job {
  _id: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  status: string;
  datePosted: string;
  description: string;
  priority: string;
  platform: string;
  url: string;
  notes?: string;
  createdAt: string;
  appliedDate: string;
}

interface ApiApplication {
  _id: string;
  jobId?: string | Record<string, unknown>;
  jobTitle?: string;
  title?: string;
  company?: string;
  location?: string;
  status?: string;
  createdAt?: string;
  appliedDate?: string;
  datePosted?: string;
  description?: string;
  priority?: string;
  platform?: string;
  notes?: string;
}

function mapApplication(data: ApiApplication): Job {
  const jobData = typeof data.jobId === 'object' && data.jobId ? data.jobId : {};
  const j = jobData as Record<string, unknown>;
  return {
    _id: data._id,
    jobId: typeof data.jobId === 'object' ? (j._id as string) || data._id : data.jobId || data._id,
    title: (j.title as string) || data.jobTitle || data.title || 'Unknown Title',
    company: (j.company as string) || data.company || 'Unknown Company',
    location: (j.location as string) || data.location || '',
    status: data.status || 'saved',
    datePosted: (j.datePosted as string) || data.datePosted || data.createdAt || new Date().toISOString(),
    description: (j.description as string) || data.description || '',
    priority: data.priority || 'medium',
    platform: data.platform || 'other',
    url: (j.url as string) || '',
    notes: data.notes || '',
    createdAt: data.createdAt || new Date().toISOString(),
    appliedDate: data.appliedDate || new Date().toISOString(),
  };
}

export default function CoverLetterPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [userProfile, setUserProfile] = useState<React.ComponentProps<typeof CoverLetterModal>['userProfile']>({
    name: '',
    experience: [],
    firstName: '',
    lastName: '',
    email: '',
    location: '',
    bio: '',
    skills: [],
    experienceYears: '',
    targetRole: '',
    education: [],
    workExperience: [],
  });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    (async () => {
      try {
        const [jobRes, profileRes] = await Promise.all([
          fetch(`/api/applications/${id}`),
          fetch('/api/user/profile'),
        ]);

        if (!jobRes.ok) {
          setNotFound(true);
          return;
        }

        const data = await jobRes.json();
        setJob(mapApplication(data as ApiApplication));

        if (profileRes.ok) {
          const p = await profileRes.json();
          setUserProfile({
            ...p,
            name: `${p.firstName || ''} ${p.lastName || ''}`.trim(),
            experience: p.workExperience || [],
          });
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [params?.id]);

  if (loading) {
    return (
      <AppLayout showFooter={false}>
        <div className="p-6 lg:p-8 max-w-3xl mx-auto">
          <FormPageSkeleton rows={3} />
        </div>
      </AppLayout>
    );
  }

  if (notFound || !job) {
    return (
      <AppLayout showFooter={false}>
        <div className="p-6 lg:p-8 max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-[var(--text-main)] mb-3">Application not found</h1>
          <Button variant="secondary" onClick={() => router.push('/application-tracking')} className="px-5 py-2">
            Back to Application Tracking
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <CoverLetterModal
      variant="page"
      visible
      job={job}
      userProfile={userProfile}
      onClose={() => router.push('/application-tracking')}
    />
  );
}
