// src/components/Navbar.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Dropdown, Drawer, Avatar, MenuProps } from 'antd';
import { FiMenu, FiLogOut } from 'react-icons/fi';
import { FaUser } from 'react-icons/fa';
import { LuLayoutDashboard, LuUserRound, LuInfo, LuStar, LuMessageSquare, LuPhone } from 'react-icons/lu';
import Sidebar from './Sidebar';

const Navbar: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerView, setDrawerView] = useState<'nav' | 'sidebar'>('nav');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const toggleDrawerView = () => {
    setDrawerView((prev) => (prev === 'nav' ? 'sidebar' : 'nav'));
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  const menuItems: MenuProps['items'] = [
    { key: '1', label: <Link href="/dashboard">Dashboard</Link>, icon: <LuLayoutDashboard /> },
    { key: '2', label: <Link href="/profile">Profile</Link>, icon: <LuUserRound /> },
    { key: '3', label: 'Sign Out', icon: <FiLogOut />, onClick: handleSignOut, danger: true },
  ];

  const NavLinks: React.FC<{ inDrawer?: boolean }> = ({ inDrawer = false }) => {
    const pathname = usePathname();
    const navItems = [
      { href: "/features", label: "Features", icon: <LuStar /> },
      { href: "/pricing", label: "Pricing", icon: <LuMessageSquare /> },
      { href: "/about", label: "About", icon: <LuInfo /> },
      { href: "/contact", label: "Contact", icon: <LuPhone /> },
    ];

    if (inDrawer) {
      return (
        <div className="flex flex-col h-full">
          <div className="flex flex-col space-y-2 p-4 flex-1">
            {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeDrawer}
                  className={`flex items-center gap-3 p-3 rounded-md transition-colors ${isActive
                      ? 'bg-[var(--bg-light)] text-[var(--primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-light)]'
                    }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-[var(--primary-dim)]/10' : 'bg-[var(--bg-card)]'}`}>
                    {item.icon}
                  </div>
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <nav className='hidden xl:flex'>
        <div className='flex items-center space-x-8'>
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${isActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  };

  const AuthButtons: React.FC<{ inDrawer?: boolean }> = ({ inDrawer = false }) => {
    const pathname = usePathname();
    const [onboardingComplete, setOnboardingComplete] = React.useState(false);

    React.useEffect(() => {
      const checkOnboarding = async () => {
        try {
          const response = await fetch('/api/user/onboarding');
          if (response.ok) {
            const data = await response.json();
            setOnboardingComplete(data.user?.isOnboarded || false);
          }
        } catch (error) {
          console.error('Failed to check onboarding status:', error);
        }
      };

      if (status === 'authenticated') {
        checkOnboarding();
      }
    }, [status]);

    if (pathname.startsWith('/onboarding') && !onboardingComplete) {
      return null;
    }

    return (
      <div className={inDrawer ? 'flex flex-col space-y-3 p-4 mt-auto border-t border-[var(--border)]' : 'hidden 2xl:flex items-center gap-4'}>
        {status === 'authenticated' ? (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} overlayClassName="ant-dropdown-dark">
            <a onClick={(e) => e.preventDefault()} className="cursor-pointer">
              <Avatar size="large" src={session.user.image} icon={<FaUser />} className="bg-[var(--primary)]" />
            </a>
          </Dropdown>
        ) : (
          <>
            <Link href="/auth/signin" onClick={closeDrawer}>
              <button className="px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                Sign In
              </button>
            </Link>
            <Link href="/auth/signup" onClick={closeDrawer}>
              <button className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-black rounded-md hover:bg-[var(--primary-dim)] transition-colors">
                Get Started
              </button>
            </Link>
          </>
        )}
      </div>
    );
  };

  if (status === 'loading') {
    return (
      <nav className="fixed w-full z-50 bg-[var(--bg-deep)] border-b border-[var(--border)] h-16 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
      </nav>
    );
  }

  return (
    <>
      <nav
        className={`fixed w-full z-50 transition-all duration-300 border-b ${isScrolled
            ? 'bg-[var(--bg-deep)]/90 backdrop-blur-md border-[var(--border)]'
            : 'bg-[var(--bg-deep)] border-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center text-black font-bold text-lg">
                  J
                </div>
                <span className="text-xl font-bold text-[var(--text-main)] tracking-tight">
                  JobQuest
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <NavLinks />

            {/* Actions */}
            <div className="flex items-center gap-4">
              <AuthButtons />
              <button
                onClick={showDrawer}
                className="2xl:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                aria-label="Open menu"
              >
                <FiMenu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <Drawer
        title={
          <div className="flex items-center justify-end w-full">
            {session && (
              <button
                onClick={toggleDrawerView}
                className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-dim)]"
              >
                {drawerView === 'nav' ? 'Switch to App Menu' : 'Switch to Navigation'}
              </button>
            )}
          </div>
        }
        placement="right"
        onClose={closeDrawer}
        open={isDrawerOpen}
        width={300}
        className="ant-drawer-dark"
        styles={{
          body: { padding: 0, background: 'var(--bg-deep)' },
          header: { background: 'var(--bg-deep)', borderBottom: '1px solid var(--border)' }
        }}
      >
        {drawerView === 'nav' ? (
          <div className="flex flex-col h-full justify-between">
            <NavLinks inDrawer />
            {status !== 'authenticated' && <AuthButtons inDrawer />}
          </div>
        ) : (
          <Sidebar onLinkClick={closeDrawer} />
        )}
      </Drawer>
    </>
  );
};

export default Navbar;