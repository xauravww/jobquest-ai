'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Footer from './Footer';

interface AppLayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  showSidebar?: boolean;
  showFooter?: boolean;
}

const AppLayout = ({ children, requireAuth = false, showSidebar = true, showFooter = true }: AppLayoutProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [requireAuth, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-deep)]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--primary)] shadow-[0_0_15px_var(--primary)]"></div>
      </div>
    );
  }

  if (requireAuth && status === 'unauthenticated') {
    return null; // Will redirect
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-deep)]">
      <div className="flex flex-1">
        {showSidebar && session && (
          <div className="hidden lg:flex lg:w-80 lg:flex-col lg:fixed lg:inset-y-0 lg:z-40" style={{ top: '0', height: '100vh' }}>
            <Sidebar className="flex-1" />
          </div>
        )}

        <div className={`flex-1 ${showSidebar && session ? 'lg:pl-80' : ''}`}>
          {children}
        </div>
      </div>

      {showFooter === true && (
        <div className={`${showSidebar && session ? 'lg:pl-80' : ''}`}>
          <Footer />
        </div>
      )}
    </div>
  );
};

export default AppLayout;
