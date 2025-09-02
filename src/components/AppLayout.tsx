'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from './Header';
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (requireAuth && status === 'unauthenticated') {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="flex">
        {showSidebar && session && (
          <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-40">
            <Sidebar className="flex-1" />
          </div>
        )}

        <main className={`flex-1 ${showSidebar && session ? 'lg:pl-64' : ''}`}>
          {children}
        </main>
      </div>
      {showFooter !== false && <Footer />}
    </div>
  );
};

export default AppLayout;
