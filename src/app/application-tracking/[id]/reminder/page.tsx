'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Select, DatePicker, TimePicker } from 'antd';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import AppLayout from '@/components/AppLayout';
import Button from '@/components/ui/Button';
import FormPageSkeleton from '@/components/ui/FormPageSkeleton';
import { ArrowLeft } from 'lucide-react';
import { notificationService } from '@/services/NotificationService';
import { telegramService } from '@/services/TelegramService';

interface Job {
  _id: string;
  title: string;
  company: string;
}

interface ApiApplication {
  _id: string;
  jobId?: string | Record<string, unknown>;
  jobTitle?: string;
  title?: string;
  company?: string;
}

interface ReminderForm {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  priority: string;
  type: string;
}

function mapJob(data: ApiApplication): Job {
  const jobData = typeof data.jobId === 'object' && data.jobId ? data.jobId : {};
  const j = jobData as Record<string, unknown>;
  return {
    _id: data._id,
    title: (j.title as string) || data.jobTitle || data.title || 'Unknown Title',
    company: (j.company as string) || data.company || 'Unknown Company',
  };
}

export default function ReminderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ReminderForm>({
    title: '',
    description: '',
    dueDate: dayjs().add(1, 'week').format('YYYY-MM-DD'),
    dueTime: '09:00',
    priority: 'medium',
    type: 'follow_up',
  });

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/applications/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        const mapped = mapJob(data as ApiApplication);
        setJob(mapped);
        setForm((f) => ({
          ...f,
          title: `Follow up: ${mapped.title} at ${mapped.company}`,
        }));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [params?.id]);

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Please enter a reminder title');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          dueDate: new Date(form.dueDate).toISOString(),
          dueTime: form.dueTime,
          type: form.type,
          priority: form.priority,
          status: 'pending',
          tags: [],
          applicationId: job?._id || null,
        }),
      });

      if (!response.ok) {
        toast.error('Failed to create reminder');
        return;
      }

      toast.success('Reminder created successfully!');
      await notificationService.createNotification({
        title: 'Reminder Setup',
        message: `Reminder set for ${job?.title || form.title}`,
        type: 'info',
      });
      if (telegramService.isConnectedToTelegram()) {
        await telegramService.sendNotification('Reminder', `Reminder set for ${job?.title || form.title}`, 'reminder');
      }
      router.push('/application-tracking');
    } catch {
      toast.error('Failed to create reminder');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout showFooter={false}>
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          <FormPageSkeleton rows={2} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showFooter={false}>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/application-tracking')}
          className="px-3 py-2 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <h1 className="text-2xl font-bold text-[var(--text-main)]">Set Follow-up Reminder</h1>

        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Reminder title"
              className="w-full h-9 px-3 bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg text-[var(--text-main)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Date</label>
              <DatePicker
                value={form.dueDate ? dayjs(form.dueDate) : null}
                onChange={(d) => setForm({ ...form, dueDate: d ? d.format('YYYY-MM-DD') : '' })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Time</label>
              <TimePicker
                value={form.dueTime ? dayjs(form.dueTime, 'HH:mm') : null}
                onChange={(t) => setForm({ ...form, dueTime: t ? t.format('HH:mm') : '' })}
                format="HH:mm"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Priority</label>
              <Select
                value={form.priority}
                onChange={(v) => setForm({ ...form, priority: v })}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ]}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Type</label>
              <Select
                value={form.type}
                onChange={(v) => setForm({ ...form, type: v })}
                options={[
                  { value: 'follow_up', label: 'Follow-up / status check' },
                  { value: 'interview_scheduled', label: 'Interview scheduled' },
                  { value: 'interview_prep', label: 'Interview preparation' },
                  { value: 'offer_response', label: 'Offer response deadline' },
                  { value: 'job_search', label: 'Job search task' },
                  { value: 'networking', label: 'Networking / outreach' },
                ]}
                className="w-full"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">What this reminder is about.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Additional details..."
              rows={3}
              className="w-full px-3 py-2 bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg text-[var(--text-main)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none resize-none transition-colors duration-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => router.push('/application-tracking')} className="px-5 py-2">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} isLoading={submitting} className="px-5 py-2">
              Set Reminder
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
