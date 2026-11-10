'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

interface ProfileShape {
  personalInfo?: { phone?: string; linkedin?: string; github?: string };
  professionalInfo?: {
    skills?: unknown[];
    bio?: string;
    experience?: string;
    workExperience?: unknown[];
  };
  preferences?: { jobTypes?: unknown[]; locations?: unknown[] };
}

// Shows a compact banner when the signed-in user's profile is missing core
// details, prompting them to complete it for better matches.
const ProfileCompletionBanner = () => {
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (!res.ok) return;
        const p: ProfileShape = await res.json();
        const pi = p.personalInfo || {};
        const pf = p.professionalInfo || {};
        const prefs = p.preferences || {};
        const m: string[] = [];
        if (!pi.phone) m.push('a phone number');
        if (!pi.linkedin && !pi.github) m.push('profile links');
        if (!(pf.skills || []).length) m.push('skills');
        if (!pf.bio) m.push('a bio');
        if (!pf.experience || pf.experience === '0') m.push('experience');
        if (!(pf.workExperience || []).length) m.push('work history');
        if (!(prefs.jobTypes || []).length) m.push('job preferences');
        if (active) setMissing(m);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (missing.length === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-5 py-4">
      <div>
        <p className="font-semibold text-[var(--text-main)]">Complete your profile for better matches</p>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Missing: {missing.join(', ')}</p>
      </div>
      <Link href="/user-profile">
        <Button variant="primary" size="sm">Complete profile</Button>
      </Link>
    </div>
  );
};

export default ProfileCompletionBanner;
