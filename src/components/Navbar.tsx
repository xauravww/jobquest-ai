// src/components/Navbar.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Dropdown, Drawer, Button, Avatar, MenuProps, Switch } from 'antd';
import { FiMenu, FiLogOut, FiSearch } from 'react-icons/fi';
import { FaBriefcase, FaUser } from 'react-icons/fa';
import { LuLayoutDashboard, LuUserRound, LuInfo, LuStar, LuMessageSquare, LuPhone, LuTrendingUp } from 'react-icons/lu';
import Sidebar from './Sidebar';

const GlassNavbar: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // Restore the drawerView state
  const [drawerView, setDrawerView] = useState<'nav' | 'sidebar'>('nav');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showFab, setShowFab] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      setIsScrolled(scrollY > 10);
      setScrollProgress(Math.min((scrollY / (documentHeight - windowHeight)) * 100, 100));
      setShowFab(scrollY > 200); // Show FAB after scrolling 200px
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        console.log('Open smart search modal');
        // Here you would open a search modal
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const showDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  // Restore the view toggler
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

  // --- REDESIGNED NavLinks Component ---
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
          <div className="flex flex-col space-y-4 p-4 flex-1">
            {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeDrawer}
                  className={`group drawer-nav-link ${isActive ? 'active' : ''} flex items-center gap-3 p-4 rounded-lg ${isActive ? 'text-lg font-semibold' : 'text-base font-medium'} transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 ${isActive ? 'bg-primary/20 border border-primary' : 'bg-transparent hover:bg-bg-card hover:shadow-sm border border-transparent'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isActive ? 'bg-primary text-white shadow-sm' : 'bg-gray-600 text-white group-hover:bg-primary group-hover:text-white group-hover:shadow-sm'}`}>
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
          {/* Creative logo placement at bottom */}
          <div className="p-4 border-t border-border">
            <Link href="/" onClick={closeDrawer} className="group flex items-center justify-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 hover:from-primary/20 hover:via-primary/10 hover:to-secondary/20 transition-all duration-300 border border-primary/20 hover:border-primary/30">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-primary via-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="w-6 h-6 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21 21L16.5 16.5M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 11L10.5 12.5L13.5 9.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">AI</span>
                </div>
              </div>
              <div className="flex flex-col text-center">
                <span className="text-lg font-black text-white tracking-tight group-hover:text-primary transition-colors duration-300">
                  JobQuest
                </span>
                <span className="text-xs font-semibold text-primary tracking-wider uppercase group-hover:text-secondary transition-colors duration-300">
                  AI Powered
                </span>
              </div>
            </Link>
          </div>
        </div>
      );
    }


    // Mobile-first: navigation always in drawer, show desktop nav links on larger screens
    return (
      <nav className='hidden xl:flex'>
        <div className='flex items-center space-x-4'>
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative px-4 py-3 text-base md:text-lg font-medium transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md ${isActive
                    ? 'text-white bg-primary/15 border-b-2 border-primary'
                    : 'text-gray-300 hover:text-white'
                  }`}
              >
                <span className="relative z-10">{item.label}</span>
                {!isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                )}
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
      // Hide Sign In and Get Started buttons on onboarding page if onboarding not complete
      return null;
    }

    return (
      <div className={inDrawer ? 'flex flex-col space-y-3 p-4 mt-auto border-t border-border' : 'hidden 2xl:flex flex-col gap-2 justify-end xl:flex-row xl:items-center xl:gap-4 xl:justify-end'}>
        {status === 'authenticated' ? (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} overlayClassName="glass-dropdown">
            <a onClick={(e) => e.preventDefault()}>
              <Avatar size="large" src={session.user.image} icon={<FaUser />} className="bg-gradient-to-br from-primary to-secondary cursor-pointer border-2 border-primary" />
            </a>
          </Dropdown>
        ) : (
          <>
            <Link href="/auth/signin" onClick={closeDrawer}>
              <button className="w-full px-4 py-3 text-base border-2 border-primary text-primary hover:bg-primary/20 hover:text-white rounded-lg transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900">
                Sign In
              </button>
            </Link>
            <Link href="/auth/signup" className="get-started-link" onClick={closeDrawer}>
              <button className="w-full px-6 py-3 text-base md:text-lg bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white rounded-lg transition-all duration-200 font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900">
                Get Started
              </button>
            </Link>
          </>
        )}
      </div>
    );
  };

  // Loading state for navbar
  if (status === 'loading') {
    return (
      <nav className="fixed w-full z-50 bg-bg-dark backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gray-700 rounded-xl animate-pulse"></div>
              <div className="flex flex-col gap-1 hidden sm:block">
                <div className="w-28 h-6 bg-gray-700 rounded animate-pulse"></div>
                <div className="w-16 h-3 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-12 sm:w-16 h-4 bg-gray-700 rounded animate-pulse"></div>
              ))}
            </div>
            <div className="w-20 sm:w-24 h-10 bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>

      <nav
        className={`fixed w-full z-50 transition-all duration-300 ease-in-out border-b
          ${isScrolled
            ? 'bg-bg-dark/95 backdrop-blur-md border-primary/20 shadow-lg shadow-primary/10'
            : 'bg-bg-dark/90 backdrop-blur-sm border-border'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`navbar-container flex justify-between items-center transition-all duration-300 ${isScrolled ? 'h-16' : 'h-20'
            }`}>
            {/* Professional Logo */}
            <div className="navbar-logo">
              <Link href="/" className="flex items-center gap-3 group">
                {/* Modern Logo Design */}
                <div className="relative">
                  <div className={`w-11 h-11 bg-gradient-to-br from-primary via-primary to-secondary rounded-xl flex items-center justify-center transition-all duration-300 ${session ? 'group-hover:scale-110 group-hover:rotate-3' : ''
                    }`}>
                    {/* Custom Job Search Icon */}
                    <svg
                      className={`w-6 h-6 text-white transition-all duration-300 ${session ? 'group-hover:scale-110' : ''
                        }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M21 21L16.5 16.5M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 11L10.5 12.5L13.5 9.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* AI Sparkle Effect */}
                      <circle cx="18" cy="6" r="1.5" fill="currentColor" opacity="0.6" className="animate-pulse" />
                      <circle cx="6" cy="18" r="1" fill="currentColor" opacity="0.4" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
                    </svg>
                  </div>
                </div>

                {/* Enhanced Typography */}
                <div className="flex flex-col">
                  <span className={`text-2xl md:text-3xl font-black text-white hidden sm:block transition-all duration-300 tracking-tight ${session ? 'group-hover:text-primary' : ''
                    }`}>
                    JobQuest
                  </span>
                  <span className={`text-xs font-semibold text-primary hidden sm:block transition-all duration-300 tracking-wider uppercase ${session ? 'group-hover:text-primary' : ''
                    }`}>
                    AI Powered
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation - Centered */}
            <div className="navbar-nav">
              <NavLinks />
            </div>

            {/* Desktop Auth Buttons & Features */}

            {/* Auth Buttons and Mobile Menu Button - shown on all screens */}
            <div className="navbar-actions flex items-center gap-4">
              <AuthButtons />
              <button
                onClick={showDrawer}
                className="2xl:hidden relative w-12 h-12 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 hover:from-primary/30 hover:via-primary/20 hover:to-secondary/30 text-primary hover:text-white rounded-2xl transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 border border-primary/30 hover:border-primary/50 group overflow-hidden"
                aria-label="Open navigation menu"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <FiMenu className="w-6 h-6 relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-180" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
              </button>
            </div>
          </div>

          {/* Scroll Progress Indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border">
            <div
              className="h-full bg-gradient-to-r from-primary via-primary to-secondary transition-all duration-300 ease-out shadow-sm"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <Drawer
        title={
          <div className="flex items-center justify-end w-full">
            {/* Enhanced view toggle with better UX */}
            {session && (
              <div className="relative">
                <button
                  onClick={toggleDrawerView}
                  className="group relative flex items-center bg-bg-card/50 backdrop-blur-sm border border-border rounded-full p-1 transition-all duration-300 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900"
                  aria-label="Toggle between navigation and app menu"
                >
                  <div className={`relative flex items-center transition-all duration-300 ${drawerView === 'nav' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full transition-all duration-300 flex items-center justify-center ${drawerView === 'nav'
                        ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/25'
                        : 'bg-bg-light text-text-muted group-hover:text-white'
                      }`}>
                      {drawerView === 'nav' ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 010 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 010 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 00-1-1V7l-7-5z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className={`px-3 py-1 text-xs font-medium transition-all duration-300 ${drawerView === 'nav'
                        ? 'text-primary opacity-0 max-w-0'
                        : 'text-text-muted opacity-100 max-w-20'
                      }`}>
                      Nav
                    </div>
                    <div className={`px-3 py-1 text-xs font-medium transition-all duration-300 ${drawerView === 'nav'
                        ? 'text-white opacity-100 max-w-20'
                        : 'text-text-muted opacity-0 max-w-0'
                      }`}>
                      App
                    </div>
                  </div>
                </button>
                {/* Tooltip */}
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-bg-card text-text text-xs px-2 py-1 rounded shadow-lg border border-border whitespace-nowrap">
                    {drawerView === 'nav' ? 'Switch to App Menu' : 'Switch to Navigation'}
                  </div>
                </div>
              </div>
            )}
          </div>
        }
        placement="left"
        onClose={closeDrawer}
        open={isDrawerOpen}
        closeIcon={null}
        width={320}
        bodyStyle={{ padding: 0, height: '100%', background: 'var(--bg-dark)', overflow: 'hidden', borderRadius: '0' }}
        style={{ zIndex: 1050 }}
        className="ant-drawer-dark"
        headerStyle={{ background: 'var(--bg-dark)', borderBottom: '1px solid var(--border)', padding: '16px' }}
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

      {/* Floating Action Button for Quick Actions */}
      {session && showFab && (
        <div className="fixed bottom-6 right-6 z-40 fab-enter">
          <div className="relative group">
            <button
              className="w-14 h-14 bg-gradient-to-r from-primary via-primary to-secondary rounded-full shadow-lg shadow-primary hover:shadow-xl hover:shadow-primary transform hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary flex items-center justify-center border border-white"
              aria-label="Quick actions"
            >
              <LuTrendingUp className="w-6 h-6 text-white" />
            </button>

            {/* FAB Menu */}
            <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
              <div className="bg-bg-card backdrop-blur-md rounded-lg shadow-xl border border-border p-2 space-y-1 min-w-48">
                <Link
                  href="/application-tracking"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-text-muted hover:text-white hover:bg-primary rounded-md transition-colors"
                >
                  <FaBriefcase className="w-4 h-4 text-primary" />
                  Quick Apply
                </Link>
                <Link
                  href="/ai-filtering"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-text-muted hover:text-white hover:bg-primary rounded-md transition-colors"
                >
                  <LuStar className="w-4 h-4 text-primary" />
                  AI Filter Jobs
                </Link>
                <Link
                  href="/reminders"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-text-muted hover:text-white hover:bg-primary rounded-md transition-colors"
                >
                  <LuMessageSquare className="w-4 h-4 text-primary" />
                  Set Reminder
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlassNavbar;