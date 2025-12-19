'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useSession, signOut } from 'next-auth/react';
import { Avatar } from 'antd';
import { FaUser } from 'react-icons/fa';
import {
  Home,
  User,
  FileText,
  Zap,
  Settings,
  Search,
  Briefcase,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Brain,
  TrendingUp,
  Users,
  Target
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onLinkClick?: () => void;
}

const NavLink = ({ href, icon, children, pathname, isCollapsed, disabled = false, onLinkClick }: {
  href: string,
  icon: React.ReactNode,
  children: React.ReactNode,
  pathname: string,
  isCollapsed?: boolean,
  disabled?: boolean,
  onLinkClick?: () => void
}) => {
  const isDashboard = href === '/dashboard';
  const isActive = ((isDashboard ? pathname === href : (pathname.startsWith(href) && href !== '/')) && !disabled);

  if (disabled) {
    return (
      <div className={`relative group flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 ${isCollapsed ? 'justify-center' : ''} opacity-50 cursor-not-allowed`}>
        <div className="text-[var(--text-muted)]">
          {icon}
        </div>
        {!isCollapsed && (
          <span className="text-sm font-medium text-[var(--text-muted)]">
            {children}
          </span>
        )}
      </div>
    );
  }

  return (
    <Link
      href={href}
      onClick={onLinkClick}
      className={`relative group flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 ${isCollapsed ? 'justify-center' : ''
        } ${isActive
          ? 'bg-[var(--bg-light)] text-[var(--primary)]'
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-light)] hover:text-[var(--text-main)]'
        }`}
    >
      <div className={`relative z-10 transition-transform duration-200 ${isActive ? 'text-[var(--primary)]' : 'group-hover:text-[var(--text-main)]'}`}>
        {icon}
      </div>

      {!isCollapsed && (
        <span className={`text-sm font-medium relative z-10`}>
          {children}
        </span>
      )}
    </Link>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ className, isCollapsed = false, onLinkClick }) => {
  const pathname = usePathname();
  const [accountType, setAccountType] = useState('job-seeker');
  const sidebarRef = useRef<HTMLElement>(null);
  const { data: session } = useSession();

  useEffect(() => {
    setAccountType('job-seeker');
  }, []);

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'premium-seeker':
        return { label: 'Premium', icon: <TrendingUp size={14} />, color: 'text-amber-400', bg: 'bg-amber-400/10', border: '' };
      case 'pro-seeker':
        return { label: 'Pro', icon: <Target size={14} />, color: 'text-purple-400', bg: 'bg-purple-400/10', border: '' };
      case 'job-seeker':
      default:
        return { label: 'Basic', icon: <User size={14} />, color: 'text-[var(--text-muted)]', bg: 'bg-[var(--bg-light)]', border: '' };
    }
  };

  const roleInfo = getRoleInfo(accountType);

  return (
    <aside
      ref={sidebarRef}
      id="sidebar"
      className={`flex-shrink-0 flex flex-col gap-4 p-4 flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin bg-[var(--bg-surface)] transition-all duration-300 ${className || ''}`}
      style={{
        width: isCollapsed ? '70px' : '260px',
      }}
    >
      <Toaster position="top-right" />

      {/* Logo Area */}
      <div className={`flex flex-col items-center justify-center mb-4 transition-all duration-300 ${isCollapsed ? 'py-2' : 'py-4'}`}>
        {isCollapsed ? (
          <div className="w-8 h-8 bg-[var(--primary)] rounded-md flex items-center justify-center">
            <span className="text-black font-bold">J</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 w-full">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${roleInfo.bg} w-full justify-center`}>
              <span className={roleInfo.color}>{roleInfo.icon}</span>
              <span className={`text-xs font-bold ${roleInfo.color}`}>{roleInfo.label} Plan</span>
            </div>
          </div>
        )}
      </div>

      {/* User Info */}
      {session && (
        <div className={`flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-light)] transition-colors mb-2 ${isCollapsed ? 'justify-center' : ''}`}>
          <Avatar
            size={isCollapsed ? 32 : 36}
            src={session.user.image}
            icon={<FaUser />}
            className="bg-[var(--primary)]"
          />
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 overflow-hidden">
              <p className="text-sm font-medium text-[var(--text-main)] truncate">{session.user.name}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{session.user.email}</p>
            </div>
          )}
        </div>
      )}

      <nav className="flex flex-col gap-1 flex-1">
        <NavLink href="/dashboard" icon={<Home size={18} />} pathname={pathname} isCollapsed={isCollapsed} onLinkClick={onLinkClick}>
          Mission Control
        </NavLink>

        {!isCollapsed && <div className="mt-4 mb-2 px-3 text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider">Automation</div>}
        {isCollapsed && <div className="my-2 h-px bg-transparent mx-2" />}

        <NavLink href="/ai-filtering" icon={<Brain size={18} />} pathname={pathname} isCollapsed={isCollapsed} onLinkClick={onLinkClick}>
          Search Agent
        </NavLink>
        <NavLink href="/unified-dashboard" icon={<TrendingUp size={18} />} pathname={pathname} isCollapsed={isCollapsed} onLinkClick={onLinkClick}>
          Analytics
        </NavLink>
        <NavLink href="/naukri-automation" icon={<Users size={18} />} pathname={pathname} isCollapsed={isCollapsed} onLinkClick={onLinkClick}>
          Auto Apply
        </NavLink>

        {!isCollapsed && <div className="mt-4 mb-2 px-3 text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider">Job Search</div>}
        {isCollapsed && <div className="my-2 h-px bg-transparent mx-2" />}

        <NavLink href="/job-search" icon={<Search size={18} />} pathname={pathname} isCollapsed={isCollapsed} onLinkClick={onLinkClick}>
          Manual Search
        </NavLink>

        {!isCollapsed && <div className="mt-4 mb-2 px-3 text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider">Management</div>}
        {isCollapsed && <div className="my-2 h-px bg-transparent mx-2" />}

        <NavLink href="/follow-ups" icon={<Users size={18} />} pathname={pathname} isCollapsed={isCollapsed} onLinkClick={onLinkClick}>
          Follow-ups
        </NavLink>
        <NavLink href="/application-tracking" icon={<Briefcase size={18} />} pathname={pathname} isCollapsed={isCollapsed} onLinkClick={onLinkClick}>
          Applications
        </NavLink>
        <NavLink href="/resume-management" icon={<FileText size={18} />} pathname={pathname} isCollapsed={isCollapsed}>
          Resumes
        </NavLink>

        {!isCollapsed && <div className="mt-4 mb-2 px-3 text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider">Tools</div>}
        {isCollapsed && <div className="my-2 h-px bg-transparent mx-2" />}

        <NavLink href="/user-profile" icon={<User size={18} />} pathname={pathname} isCollapsed={isCollapsed}>
          Profile
        </NavLink>
        <NavLink href="/settings" icon={<Settings size={18} />} pathname={pathname} isCollapsed={isCollapsed}>
          Settings
        </NavLink>
      </nav>

      {/* Logout */}
      {session && (
        <div className="mt-auto pt-2">
          <button
            onClick={() => signOut({ redirect: false })}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-light)] hover:text-[var(--text-main)] transition-all duration-200 group ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={18} className="group-hover:text-[var(--danger)] transition-colors" />
            {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
