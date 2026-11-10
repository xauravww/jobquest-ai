'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import DashboardSkeleton from '@/components/ui/DashboardSkeleton';
import Footer from './Footer';
import BrandMark from '@/components/ui/BrandMark';

interface AppLayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  showSidebar?: boolean;
  showFooter?: boolean;
}

const AppLayout = ({ children, requireAuth = false, showSidebar = true, showFooter = true }: AppLayoutProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (requireAuth && status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [requireAuth, status, router]);

  if (status === 'loading') {
    return <DashboardSkeleton />;
  }

  if (requireAuth && status === 'unauthenticated') {
    return null; // Will redirect
  }

  const showNav = showSidebar && session;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-deep)]">
      {/* Mobile top bar */}
      {showNav && (
        <header className="lg:hidden sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--border)]">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="p-2 rounded-lg text-[var(--text-main)] hover:bg-[var(--bg-raised)] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <BrandMark size={22} textClass="text-base" />
        </header>
      )}

      {/* Mobile drawer */}
      {showNav && (
        <div className="lg:hidden">
          <div
            onClick={() => setMobileOpen(false)}
            className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          />
          <div
            className={`fixed inset-y-0 left-0 z-50 flex flex-col w-[280px] max-w-[85vw] bg-[var(--bg-surface)] shadow-2xl transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
          >
            <div className="flex justify-end p-3">
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-raised)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 flex flex-col">
              <Sidebar className="flex-1" onLinkClick={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {showNav && (
          <div className="hidden lg:flex lg:w-80 lg:flex-col lg:fixed lg:inset-y-0 lg:z-40" style={{ top: '0', height: '100vh' }}>
            <Sidebar className="flex-1" />
          </div>
        )}

        <div className={`flex-1 ${showNav ? 'lg:pl-80' : ''}`}>
          {children}
        </div>
      </div>

      {showFooter === true && (
        <div className={`${showNav ? 'lg:pl-80' : ''}`}>
          <Footer />
        </div>
      )}
    </div>
  );
};

export default AppLayout;
