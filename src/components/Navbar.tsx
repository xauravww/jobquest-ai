// src/components/Navbar.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Dropdown, Drawer, Button, Avatar, MenuProps, Switch } from 'antd';
import { FiMenu, FiLogOut } from 'react-icons/fi';
import { FaBriefcase, FaUser } from 'react-icons/fa';
import { LuLayoutDashboard, LuUserRound, LuInfo, LuStar, LuMessageSquare, LuPhone } from 'react-icons/lu';
import Sidebar from './Sidebar';

const GlassNavbar: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // Restore the drawerView state
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
    const navItems = [
        { href: "/features", label: "Features", icon: <LuStar /> },
        { href: "/pricing", label: "Pricing", icon: <LuMessageSquare /> },
        { href: "/about", label: "About", icon: <LuInfo /> },
        { href: "/contact", label: "Contact", icon: <LuPhone /> },
    ];

    if (inDrawer) {
        return (
            <div className="flex flex-col space-y-2 p-4">
                {navItems.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeDrawer}
                        className="flex items-center gap-4 p-4 rounded-lg text-lg font-semibold text-gray-200 hover:bg-primary/10 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <div className="text-primary">{item.icon}</div>
                        <span>{item.label}</span>
                    </Link>
                ))}
            </div>
        );
    }

    // Fixed desktop version - now shows navigation
    return (
      <div className='hidden md:flex flex-1 justify-center space-x-8'>
         {navItems.map(item => (
             <Link 
               key={item.href} 
               href={item.href} 
               className="group relative px-3 py-2 text-gray-300 hover:text-white transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md"
             >
                <span className="relative z-10">{item.label}</span>
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
             </Link>
         ))}
      </div>
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
    <div className={inDrawer ? 'flex flex-col space-y-4 p-4 mt-auto border-t border-border' : 'hidden md:flex items-center gap-4'}>
      {status === 'authenticated' ? (
        <Dropdown menu={{ items: menuItems }} trigger={['click']} overlayClassName="glass-dropdown">
          <a onClick={(e) => e.preventDefault()}>
            <Avatar size="large" icon={<FaUser />} className="bg-indigo-600 cursor-pointer" />
          </a>
        </Dropdown>
      ) : (
        <>
          <Link href="/auth/signin" onClick={closeDrawer}>
            <button className="w-full px-4 py-3 border-2 border-indigo-500 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-all duration-200 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900">
              Sign In
            </button>
          </Link>
          <Link href="/auth/signup" onClick={closeDrawer}>
            <button className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900">
              Get Started
            </button>
          </Link>
        </>
      )}
    </div>
  );
};

  return (
    <>
      <style jsx global>{`
        /* Styles for dropdown and drawer remain the same */
        .glass-dropdown .ant-dropdown-menu { background-color: rgba(20, 20, 30, 0.7) !important; backdrop-filter: blur(10px) !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; border-radius: 8px !important; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37) !important; }
        .glass-dropdown .ant-dropdown-menu-item, .glass-dropdown .ant-dropdown-menu-item-icon { color: #d1d5db !important; }
        .glass-dropdown .ant-dropdown-menu-item:hover { background-color: rgba(79, 70, 229, 0.4) !important; color: #ffffff !important; }
        .glass-dropdown .ant-dropdown-menu-item-danger:hover { background-color: rgba(239, 68, 68, 0.4) !important; color: #ffffff !important; }
        .glass-dropdown .ant-dropdown-menu-item-danger { color: #f87171 !important; }
      `}</style>
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ease-in-out border-b
          ${isScrolled
            ? 'bg-gray-900/80 backdrop-blur-sm border-white/20'
            : 'bg-bg-dark border-border'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  <FaBriefcase className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-white hidden sm:block">Jobquest AI</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <NavLinks />

            {/* Desktop Auth Buttons */}
            <div className="flex-shrink-0">
              <AuthButtons />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={showDrawer}
                className="w-10 h-10 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label="Open navigation menu"
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
          <div className="flex items-center justify-between w-full">
            <Link href="/" className="flex items-center gap-3" onClick={closeDrawer}>
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <FaBriefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-extrabold text-white" style={{ textShadow: '0 0 8px rgba(99, 102, 241, 0.9)' }}>
                Jobquest AI
              </span>
            </Link>
             {/* Simplified view toggle - only show for authenticated users */}
             {session && (
                 <button
                   onClick={toggleDrawerView}
                   className="text-xs font-semibold text-gray-400 hover:text-white transition-colors px-2 py-1 rounded"
                   aria-label="Toggle between menu and app sidebar"
                 >
                   {drawerView === 'nav' ? 'Show App Menu' : 'Show Navigation'}
                 </button>
             )}
          </div>
        }
        placement="left"
        onClose={closeDrawer}
        open={isDrawerOpen}
        closeIcon={null}
        width={320}
        bodyStyle={{ padding: 0, height: '100%', background: 'var(--bg-dark)', overflow: 'hidden' }}
        style={{ zIndex: 1050 }}
        className="ant-drawer-dark"
      >
        {drawerView === 'nav' ? (
          <div className="flex flex-col h-full justify-between">
            <NavLinks inDrawer />
            <AuthButtons inDrawer />
          </div>
        ) : (
          <Sidebar onLinkClick={closeDrawer} />
        )}
      </Drawer>
    </>
  );
};

export default GlassNavbar;