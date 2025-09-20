'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const OnboardingCheck: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (status === 'authenticated' && session?.user?.email && !hasCheckedRef.current) {
        hasCheckedRef.current = true;

        // Skip check if already on onboarding or auth pages
        if (pathname.startsWith('/onboarding') || pathname.startsWith('/auth') || pathname === '/') {
          return;
        }

        try {
          const response = await fetch('/api/user/onboarding');
          if (response.ok) {
            const data = await response.json();
            if (!data.user?.isOnboarded) {
              // User not onboarded, redirect to onboarding if not already there
              if (!pathname.startsWith('/onboarding')) {
                router.push('/onboarding');
              }
            }
            // If user is onboarded, let them navigate freely without forced redirects
          }
        } catch (error) {
          console.error('Failed to check onboarding status:', error);
        }
      }
    };

    checkOnboarding();
  }, [session, status, router]);

  return null;
};

export default OnboardingCheck;
