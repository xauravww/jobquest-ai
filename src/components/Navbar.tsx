asi'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Dropdown, Drawer, Button, Avatar, MenuProps, Switch } from 'antd';
import { FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import { FaBriefcase, FaUser } from 'react-icons/fa';
import { LuLayoutDashboard, LuUserRound } from 'react-icons/lu';
import Sidebar from './Sidebar';

const GlassNavbar: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerView, setDrawerView] = useState<'nav' | 'sidebar'>('nav');

  // Effect to handle navbar style changes on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Drawer visibility handlers
  const showDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const toggleDrawerView = () => {
    setDrawerView((prev) => (prev === 'nav' ? 'sidebar' : 'nav'));
  };


  // Sign out handler
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  // Menu items for the user dropdown
  const menuItems: MenuProps['items'] = [
    {
      key: '1',
      label: <Link href="/dashboard">Dashboard</Link>,
      icon: <LuLayoutDashboard />,
    },
    {
      key: '2',
      label: <Link href="/profile">Profile</Link>,
      icon: <LuUserRound />,
    },
    {
      key: '3',
      label: 'Sign Out',
      icon: <FiLogOut />,
      onClick: handleSignOut,
      danger: true,
    },
  ];

  // Reusable Navigation Links component
  const NavLinks: React.FC<{ inDrawer?: boolean }> = ({ inDrawer = false }) => (
      <div
        className={
          inDrawer
            ? 'flex flex-col space-y-10 text-lg px-6 text-indigo-300'
            : 'hidden md:flex flex-1 justify-center space-x-8'
        }
        style={inDrawer ? { fontWeight: '700' } : undefined}
      >
      <Link
        href="/features"
        className="group text-indigo-300 hover:text-indigo-500 transition-transform duration-300 ease-in-out transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-600 rounded"
        onClick={closeDrawer}
      >
        Features
        <span className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-indigo-500"></span>
      </Link>
      <Link
        href="/pricing"
        className="group text-indigo-300 hover:text-indigo-500 transition-transform duration-300 ease-in-out transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-600 rounded"
        onClick={closeDrawer}
      >
        Pricing
        <span className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-indigo-500"></span>
      </Link>
      <Link
        href="/about"
        className="group text-indigo-300 hover:text-indigo-500 transition-transform duration-300 ease-in-out transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-600 rounded"
        onClick={closeDrawer}
      >
        About
        <span className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-indigo-500"></span>
      </Link>
      <Link
        href="/contact"
        className="group text-indigo-300 hover:text-indigo-500 transition-transform duration-300 ease-in-out transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-600 rounded"
        onClick={closeDrawer}
      >
        Contact
        <span className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-indigo-500"></span>
      </Link>
    </div>
  );

  // Reusable Authentication Buttons component
  const AuthButtons: React.FC<{ inDrawer?: boolean }> = ({ inDrawer = false }) => (
    <div className={inDrawer ? 'flex flex-col space-y-4 pt-8' : 'hidden md:flex items-center gap-4'}>
      {status === 'authenticated' ? (
        <Dropdown menu={{ items: menuItems }} trigger={['click']} overlayClassName="glass-dropdown">
          <a onClick={(e) => e.preventDefault()}>
            <Avatar size="large" icon={<FaUser />} className="bg-indigo-600 cursor-pointer" />
          </a>
        </Dropdown>
      ) : (
        <>
          <Link href="/auth/signin" passHref>
            <Button
              ghost
              className="border-indigo-500 text-indigo-400 hover:bg-indigo-500 hover:text-white"
              onClick={closeDrawer}
            >
              Sign In
            </Button>
          </Link>
          <Link href="/auth/signup" passHref>
            <Button
              type="primary"
              className="bg-indigo-600 hover:bg-indigo-700 border-indigo-600"
              onClick={closeDrawer}
            >
              Get Started
            </Button>
          </Link>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Scoped global styles for styling Ant Design components in a dark theme */}
      <style jsx global>{`
        .glass-dropdown .ant-dropdown-menu {
          background-color: rgba(20, 20, 30, 0.7) !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 8px !important;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37) !important;
        }
        .glass-dropdown .ant-dropdown-menu-item,
        .glass-dropdown .ant-dropdown-menu-item-icon {
          color: #d1d5db !important; /* text-gray-300 */
        }
        .glass-dropdown .ant-dropdown-menu-item:hover {
          background-color: rgba(79, 70, 229, 0.4) !important; /* indigo-600 with opacity */
          color: #ffffff !important;
        }
        .glass-dropdown .ant-dropdown-menu-item-danger:hover {
          background-color: rgba(239, 68, 68, 0.4) !important; /* red-500 with opacity */
          color: #ffffff !important;
        }
        .glass-dropdown .ant-dropdown-menu-item-danger {
            color: #f87171 !important; /* red-400 */
        }

        /* Added focus styles for drawer nav links */
        .drawer-nav-link:focus {
          outline: 2px solid #6366f1; /* indigo-500 */
          outline-offset: 2px;
          border-radius: 4px;
        }
      `}</style>
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ease-in-out border-b
          ${isScrolled
            ? 'bg-gray-900 border-white/20'
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

            {/* Desktop Nav Links */}
            <NavLinks />

            {/* Desktop Auth Buttons */}
            <div className="flex-shrink-0">
              <AuthButtons />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <Button
                icon={<FiMenu className="w-6 h-6 text-white transition-all duration-300 ease-in-out" />}
                onClick={showDrawer}
                type="text"
                className="text-white"
                aria-label="Open navigation menu"
                style={{ width: '40px', height: '40px', backgroundColor: '#1f2937', borderRadius: '4px' }}
              />
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
              <span
                className="text-2xl font-extrabold text-white"
                style={{ textShadow: '0 0 8px rgba(99, 102, 241, 0.9)' }}
              >
                Jobquest AI
              </span>
            </Link>
            <div className="border-b border-indigo-700 my-4" />

            <Switch
              checked={drawerView === 'sidebar'}
              onChange={toggleDrawerView}
              aria-label="Toggle drawer view"
              className="text-primary hover:text-primary-light focus:outline-none focus:ring-2 focus:ring-primary rounded"
              style={{ fontSize: '1.5rem', lineHeight: 1, padding: '4px' }}
            />
          </div>
        }
        placement="left"
        onClose={closeDrawer}
        open={isDrawerOpen}
        closeIcon={null}
        bodyStyle={{
          padding: 0,
          height: '100%',
          background: 'var(--bg-dark)',
        }}
        style={{
          zIndex: 1050,
        }}
        className="ant-drawer-dark"
      >
        {drawerView === 'nav' ? (
          <div className="flex flex-col h-full justify-between p-6">
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
