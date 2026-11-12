'use client';

import { useRouter } from 'next/navigation';
import CreateJobModal from '@/components/modals/CreateJobModal';

export default function NewApplicationPage() {
  const router = useRouter();

  return (
    <CreateJobModal
      mode="page"
      visible
      job={null}
      onClose={() => router.push('/application-tracking')}
      onJobCreated={() => router.push('/application-tracking')}
    />
  );
}
