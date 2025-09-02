'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import React, { useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import {
  Home,
  User,
  FileText,
  Bell,
  Zap,
  Settings,
  Search,
  Brain,
  Briefcase,
  BarChart3,
  Calendar,
  Target,
  TrendingUp
} from 'lucide-react';
import Image from 'next/image';

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
}

const NavLink = ({ href, icon, children, pathname, isCollapsed, disabled = false }: { 
  href: string, 
  icon: React.ReactNode, 
  children: React.ReactNode, 
  pathname: string, 
  isCollapsed?: boolean,
  disabled?: boolean 
}) => {
  // Special case for dashboard links: only active on exact match
  const isDashboard = href === '/dashboard';
  const isActive = ((isDashboard ? pathname === href : (pathname.startsWith(href) && href !== '/')) && !disabled);
  
  const linkClasses = `nav-item flex items-center transition-all duration-300 ease-in-out ${
    isActive ? 'nav-item-active' : ''
  } ${
    isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'
  } ${
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer group'
  }`;

  const linkContent = (
    <div
      className={linkClasses}
      style={{
        background: isActive ? undefined : 'transparent',
        color: isActive ? '#ffffff' : 'var(--text-muted)',
        fontWeight: isActive ? 700 : 500,
        position: 'relative',
        zIndex: 3
      }}
    >
      <div
        className={`nav-icon transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
          isActive ? 'text-white' : ''
        }`}
        style={{
          color: isActive ? '#ffffff' : 'var(--text-muted)',
          fontSize: '18px',
          zIndex: 4,
          position: 'relative'
        }}
      >
        {icon}
      </div>
      {!isCollapsed && (
        <p
          className="text-sm font-semibold leading-normal whitespace-nowrap transition-all duration-300 group-hover:translate-x-1"
          style={{
            color: isActive ? '#ffffff' : 'var(--text)',
            textShadow: isActive ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
            letterSpacing: isActive ? '0.025em' : '0',
            zIndex: 4,
            position: 'relative',
            fontWeight: isActive ? '700' : '500'
          }}
        >
          {children}
        </p>
      )}
      {/* Enhanced active indicator */}
      {isActive && !isCollapsed && (
        <div
          className="ml-auto flex items-center justify-center text-bg"
          style={{ zIndex: 4, position: 'relative' }}
        >
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{
              background: '#ffffff',
              boxShadow: '0 0 12px rgba(255, 255, 255, 0.9)'
            }}
          />
        </div>
      )}
      {/* Active state border accent - only show when not collapsed */}
      {isActive && !isCollapsed && (
        <div
          className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-l-full"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,0.4))',
            zIndex: 5
          }}
        />
      )}
    </div>
  );

  // Enhanced tooltip for collapsed mode
  const tooltipClass = isCollapsed ? 'group relative' : '';

  if (disabled) {
    return (
      <div className={tooltipClass} title={isCollapsed ? String(children) : undefined}>
        {linkContent}
        {isCollapsed && (
          <div
            className="sidebar-tooltip absolute px-3 py-2 rounded-lg shadow-xl"
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              fontSize: '12px',
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              left: 'calc(100% + 12px)',
              top: '50%',
              transform: 'translateY(-50%)'
            }}
          >
            {children}
            <span style={{ color: 'var(--text-muted)' }}> (Coming Soon)</span>
            <div
              className="absolute top-1/2 transform -translate-y-1/2 w-2 h-2 rotate-45"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRight: 'none',
                borderBottom: 'none',
                left: '-4px'
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <Link href={href} className={tooltipClass}>
      {linkContent}
      {isCollapsed && (
        <div
          className="sidebar-tooltip absolute px-3 py-2 rounded-lg shadow-xl"
          style={{
            background: 'var(--bg-card)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            fontSize: '12px',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            left: 'calc(100% + 12px)',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        >
          {children}
          <div
            className="absolute top-1/2 transform -translate-y-1/2 w-2 h-2 rotate-45"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRight: 'none',
              borderBottom: 'none',
              left: '-4px'
            }}
          />
        </div>
      )}
    </Link>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ className, isCollapsed = false }) => {
  const pathname = usePathname();
  const [accountType, setAccountType] = useState('job-seeker');
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Set default account type for job seekers
    setAccountType('job-seeker');
  }, []);

  // Map accountType to display label and icon for job seekers
  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'premium-seeker':
        return { 
          label: 'Premium Seeker', 
          icon: <TrendingUp size={14} />, 
          gradient: 'linear-gradient(135deg, #FBBF24, #F59E0B)', 
          textColor: '#422006' 
        };
      case 'pro-seeker':
        return { 
          label: 'Pro Seeker', 
          icon: <Target size={14} />, 
          gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', 
          textColor: '#ffffff' 
        };
      case 'job-seeker':
      default:
        return { 
          label: 'Job Seeker', 
          icon: <User size={14} />, 
          gradient: 'linear-gradient(135deg, #10B981, #059669)', 
          textColor: '#ffffff' 
        };
    }
  };

  return (
    <>
      <style jsx>{`
        /* Custom scrollbar styles */
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.3);
          border-radius: 3px;
          transition: background 0.2s ease;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.6);
        }
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: rgba(16, 185, 129, 0.3) transparent;
        }

        /* Enhanced navigation animations */
        .nav-item {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          min-width: 0;
          flex-shrink: 0;
        }

        .nav-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
          transition: left 0.6s ease;
          z-index: 1;
        }

        .nav-item:hover::before {
          left: 100%;
        }

        /* Active state glow effect */
        .nav-item-active {
          position: relative;
          background: linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%) !important;
          box-shadow:
            0 4px 20px rgba(16, 185, 129, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.25) !important;
          transform: translateX(6px) !important;
          border-left: 4px solid rgba(255, 255, 255, 0.9) !important;
        }

        .nav-item-active::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
          animation: activeShimmer 2s infinite;
          border-radius: 12px;
          z-index: 2;
        }

        @keyframes activeShimmer {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }

        /* Active state pulse */
        .nav-item-active .nav-icon {
          animation: iconPulse 2s infinite;
          filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.7)) !important;
        }

        @keyframes iconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        /* Ensure text is always white in active state */
        .nav-item-active p,
        .nav-item-active .nav-icon {
          color: #ffffff !important;
        }

        /* Enhanced hover states */
        .nav-item:not(.nav-item-active):hover {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%) !important;
          transform: translateX(2px) !important;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2) !important;
          border-left: 3px solid rgba(16, 185, 129, 0.4) !important;
        }

        /* Section headers enhancement */
        .section-header {
          position: relative;
          margin: 16px 0 8px 0;
          padding: 8px 12px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%);
          border-radius: 8px;
          border-left: 3px solid rgba(16, 185, 129, 0.3);
        }

        .section-divider {
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.4) 20%, rgba(5, 150, 105, 0.6) 50%, rgba(16, 185, 129, 0.4) 80%, transparent 100%);
          margin-top: 4px;
          border-radius: 1px;
          animation: dividerGlow 3s ease-in-out infinite;
        }

        @keyframes dividerGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        /* Logo container enhancement */
        .logo-container {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%);
          border: 1px solid rgba(16, 185, 129, 0.2);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
          max-width: 100%;
          overflow: hidden;
        }

        .logo-container:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.2);
        }

        #sidebar.collapsed .logo-container {
          width: 100%;
          max-width: 100%;
          padding: 12px 8px;
        }

        /* Tooltip animations */
        .sidebar-tooltip {
          transform: translateY(-50%) translateX(-20px);
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          pointer-events: none;
          white-space: nowrap;
          top: 50%;
          z-index: 1000;
          left: 100%;
          margin-left: 12px;
        }

        .sidebar-tooltip > div {
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }

        .group:hover .sidebar-tooltip {
          transform: translateY(-50%) translateX(0);
          opacity: 1;
          visibility: visible;
        }

        .group:hover .sidebar-tooltip > div {
          opacity: 1;
          visibility: visible;
        }

        /* Prevent horizontal overflow in collapsed state */
        #sidebar.collapsed {
          overflow-x: hidden !important;
        }

        #sidebar.collapsed .nav-item {
          width: 100%;
          max-width: 100%;
          justify-content: center !important;
          padding-left: 8px !important;
          padding-right: 8px !important;
          display: flex !important;
          align-items: center !important;
        }

        #sidebar.collapsed .nav-item .nav-icon {
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }

        #sidebar.collapsed .nav-item {
          min-height: 48px;
        }

        #sidebar.collapsed .group {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        #sidebar.collapsed .nav-item p {
          display: none !important;
        }

        #sidebar.collapsed .nav-item .ml-auto {
          display: none !important;
        }

        #sidebar.collapsed .nav-item .absolute {
          display: none !important;
        }

        #sidebar .nav-item p {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
          flex: 1;
        }

        /* Role badge glow effect */
        .role-badge {
          position: relative;
          overflow: hidden;
        }

        .role-badge::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transform: rotate(45deg);
          animation: shimmer 3s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }

        .logo-image-container {
          transition: background 0.3s ease;
        }

        body:not(.light-mode) .logo-image-container {
          background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
        }
      `}</style>
      <aside
        ref={sidebarRef}
        id="sidebar"
        className={`flex-shrink-0 flex flex-col gap-4 p-4 transition-all duration-500 ease-in-out ${
          isCollapsed ? 'w-20 collapsed' : 'w-80'
        } h-full overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin ${className || ''}`}
        style={{
          background: 'var(--bg-dark)',
          borderRight: '1px solid var(--border)',
          width: isCollapsed ? '80px' : '320px'
        }}
      >
        <Toaster position="top-right" />
        
        <div
          className={`logo-container flex flex-col items-center justify-center mb-4 w-full rounded-lg transition-all duration-300 ${
            isCollapsed ? 'p-2' : 'p-4'
          }`}
          style={{
            background: 'var(--bg-light)',
            minHeight: isCollapsed ? '80px' : '160px'
          }}
        >
          {isCollapsed ? (
            <div className="flex items-center justify-center w-full h-full">
              <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">J</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full space-y-3 transition-opacity duration-300">
              <div className="logo-image-container p-1 rounded-full">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center hover:scale-105 transition-transform duration-300">
                  <span className="text-white font-bold text-2xl">J</span>
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-white mb-2">Jobquest AI</h2>
                <div className="flex items-center justify-center w-full px-2">
                  <div
                    className="role-badge inline-flex items-center gap-2 px-3 py-2 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:scale-105 mx-auto text-sm"
                    style={{
                      background: getRoleInfo(accountType).gradient,
                      color: getRoleInfo(accountType).textColor,
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      textShadow: getRoleInfo(accountType).textColor === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                    }}
                  >
                    <span style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))', fontSize: '14px' }}>
                      {getRoleInfo(accountType).icon}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>
                      {getRoleInfo(accountType).label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <nav className="flex flex-col gap-1">
          {/* Main Dashboard */}
          <NavLink href="/dashboard" icon={<Home />} pathname={pathname} isCollapsed={isCollapsed}>
            Dashboard
          </NavLink>

          {/* Job Search & AI */}
          {!isCollapsed && (
            <div className="mt-4 mb-2 px-3">
              <p className="text-xs uppercase font-semibold tracking-wider opacity-60" style={{ color: 'var(--text-muted)' }}>
                Job Search & AI
              </p>
              <div className="mt-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>
          )}
          <NavLink href="/job-search" icon={<Search />} pathname={pathname} isCollapsed={isCollapsed}>
            Job Search
          </NavLink>
          <NavLink href="/ai-filtering" icon={<Brain />} pathname={pathname} isCollapsed={isCollapsed}>
            AI Filtering
          </NavLink>

          {/* Application Management */}
          {!isCollapsed && (
            <div className="mt-4 mb-2 px-3">
              <p className="text-xs uppercase font-semibold tracking-wider opacity-60" style={{ color: 'var(--text-muted)' }}>
                Application Management
              </p>
              <div className="mt-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>
          )}
          <NavLink href="/application-tracking" icon={<Briefcase />} pathname={pathname} isCollapsed={isCollapsed}>
            Applications
          </NavLink>
          <NavLink href="/resume-management" icon={<FileText />} pathname={pathname} isCollapsed={isCollapsed}>
            Resumes
          </NavLink>

          {/* Profile & Tools */}
          {!isCollapsed && (
            <div className="mt-4 mb-2 px-3">
              <p className="text-xs uppercase font-semibold tracking-wider opacity-60" style={{ color: 'var(--text-muted)' }}>
                Profile & Tools
              </p>
              <div className="mt-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>
          )}
          <NavLink href="/user-profile" icon={<User />} pathname={pathname} isCollapsed={isCollapsed}>
            Profile
          </NavLink>
          <NavLink href="/reminders" icon={<Bell />} pathname={pathname} isCollapsed={isCollapsed} disabled>
            Reminders
          </NavLink>
          <NavLink href="/naukri-automation" icon={<Zap />} pathname={pathname} isCollapsed={isCollapsed} disabled>
            Auto Apply
          </NavLink>

          {/* Analytics & Reports */}
          {!isCollapsed && (
            <div className="mt-4 mb-2 px-3">
              <p className="text-xs uppercase font-semibold tracking-wider opacity-60" style={{ color: 'var(--text-muted)' }}>
                Analytics & Reports
              </p>
              <div className="mt-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>
          )}
          <NavLink href="/analytics" icon={<BarChart3 />} pathname={pathname} isCollapsed={isCollapsed} disabled>
            Analytics
          </NavLink>
          <NavLink href="/calendar" icon={<Calendar />} pathname={pathname} isCollapsed={isCollapsed} disabled>
            Calendar
          </NavLink>
          <NavLink href="/admin/job-actions" icon={<Settings />} pathname={pathname} isCollapsed={isCollapsed} disabled>
            Job Actions
          </NavLink>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;