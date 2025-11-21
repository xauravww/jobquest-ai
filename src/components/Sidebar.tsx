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
  Brain,
  Briefcase,
  BarChart3,
  Target,
  TrendingUp,
  Atom,
  StickyNote,
  Search,
  LogOut,
  Sparkles
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
      <div className={`relative group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${isCollapsed ? 'justify-center' : ''} opacity-50 cursor-not-allowed`}>
        <div className="text-[var(--text-muted)]">
          {icon}
        </div>
        {!isCollapsed && (
          <span className="text-sm font-medium text-[var(--text-muted)]">
            {children}
          </span>
        )}
        {/* Tooltip for collapsed */}
        {isCollapsed && (
          <div className="absolute left-full ml-4 px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            <span className="text-sm text-[var(--text-muted)]">{children} (Coming Soon)</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={href}
      onClick={onLinkClick}
      className={`relative group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${isCollapsed ? 'justify-center' : ''
        } ${isActive
          ? 'bg-gradient-to-r from-[var(--primary)]/20 to-[var(--primary)]/5 text-white shadow-[0_0_15px_rgba(0,242,255,0.1)] border border-[var(--primary)]/20'
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-white hover:translate-x-1'
        }`}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--primary)] rounded-r-full shadow-[0_0_10px_var(--primary)]" />
      )}

      <div className={`relative z-10 transition-transform duration-300 ${isActive ? 'text-[var(--primary)] scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>

      {!isCollapsed && (
        <span className={`text-sm font-medium relative z-10 ${isActive ? 'text-white font-bold' : ''}`}>
          {children}
        </span>
      )}

      {/* Tooltip for collapsed */}
      {isCollapsed && (
        <div className="absolute left-full ml-4 px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
          <span className="text-sm text-white">{children}</span>
        </div>
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
        return { label: 'Premium Seeker', icon: <TrendingUp size={14} />, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' };
      case 'pro-seeker':
        return { label: 'Pro Seeker', icon: <Target size={14} />, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' };
      case 'job-seeker':
      default:
        return { label: 'Job Seeker', icon: <User size={14} />, color: 'text-[var(--primary)]', bg: 'bg-[var(--primary)]/10', border: 'border-[var(--primary)]/20' };
    }
  };

  const roleInfo = getRoleInfo(accountType);

  return (
    <aside
      ref={sidebarRef}
      id="sidebar"
      className={`flex-shrink-0 flex flex-col gap-4 p-4 h-full overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin bg-[var(--bg-glass)] backdrop-blur-xl border-r border-[var(--border-glass)] transition-all duration-300 ${className || ''}`}
      style={{
        width: isCollapsed ? '80px' : '320px',
      }}
    >
      <Toaster position="top-right" />

      {/* Logo Area */}
      <div className={`flex flex-col items-center justify-center mb-6 transition-all duration-300 ${isCollapsed ? 'py-4' : 'py-6 bg-[var(--bg-surface)]/50 rounded-2xl border border-[var(--border-glass)]'}`}>
        {isCollapsed ? (
          <div className="w-10 h-10 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-lg flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--primary)]/20 mb-2">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${roleInfo.bg} ${roleInfo.border} border`}>
              <span className={roleInfo.color}>{roleInfo.icon}</span>
              <span className={`text-xs font-bold ${roleInfo.color}`}>{roleInfo.label}</span>
            </div>
          </div>
        )}
      </div>

      {/* User Info */}
      {session && (
        <div className={`flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface)]/50 border border-[var(--border-glass)] mb-2 ${isCollapsed ? 'justify-center' : ''}`}>
          <Avatar
            size={isCollapsed ? 32 : 40}
            src={session.user.image}
            icon={<FaUser />}
            className="border-2 border-[var(--primary)]"
          />
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{session.user.name}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{session.user.email}</p>
            </div>
          )}
        </div>
      )}

      <nav className="flex flex-col gap-1 flex-1">
        <NavLink href="/dashboard" icon={<Home size={20} />} pathname={pathname} isCollapsed={isCollapsed} onLinkClick={onLinkClick}>
          Dashboard
        </NavLink>
        <NavLink href="/unified-dashboard" icon={<TrendingUp size={20} />} pathname={pathname} isCollapsed={isCollapsed} onLinkClick={onLinkClick}>
          Command Center
        </NavLink>

        {!isCollapsed && <div className="mt-6 mb-2 px-3 text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider">Job Search & AI</div>}
        {isCollapsed && <div className="my-2 h-px bg-[var(--border-glass)] mx-2" />}

        <NavLink href="/ai-filtering" icon={<Brain size={20} />} pathname={pathname} isCollapsed={isCollapsed} onLinkClick={onLinkClick}>
          AI Filtering
        </NavLink>
        <NavLink href="/job-search" icon={<Search size={20} />} pathname={pathname} isCollapsed={isCollapsed} onLinkClick={onLinkClick}>
          Job Search
        </NavLink>

        {!isCollapsed && <div className="mt-6 mb-2 px-3 text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider">Management</div>}
        {isCollapsed && <div className="my-2 h-px bg-[var(--border-glass)] mx-2" />}

        <NavLink href="/application-tracking" icon={<Briefcase size={20} />} pathname={pathname} isCollapsed={isCollapsed}>
          Applications
        </NavLink>
        <NavLink href="/resume-management" icon={<FileText size={20} />} pathname={pathname} isCollapsed={isCollapsed}>
          Resumes
        </NavLink>
        <NavLink href="/latex-resume-builder" icon={<Atom size={20} />} pathname={pathname} isCollapsed={isCollapsed} disabled>
          LaTeX Builder
        </NavLink>

        {!isCollapsed && <div className="mt-6 mb-2 px-3 text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider">Tools</div>}
        {isCollapsed && <div className="my-2 h-px bg-[var(--border-glass)] mx-2" />}

        <NavLink href="/user-profile" icon={<User size={20} />} pathname={pathname} isCollapsed={isCollapsed}>
          Profile
        </NavLink>
        <NavLink href="/fleeting-notes" icon={<StickyNote size={20} />} pathname={pathname} isCollapsed={isCollapsed}>
          Fleeting Notes
        </NavLink>
        <NavLink href="/settings" icon={<Settings size={20} />} pathname={pathname} isCollapsed={isCollapsed}>
          Settings
        </NavLink>
        <NavLink href="/naukri-automation" icon={<Zap size={20} />} pathname={pathname} isCollapsed={isCollapsed} disabled>
          Auto Apply
        </NavLink>
        <NavLink href="/analytics" icon={<BarChart3 size={20} />} pathname={pathname} isCollapsed={isCollapsed} disabled>
          Analytics
        </NavLink>
      </nav>

      {/* Logout */}
      {session && (
        <div className="mt-auto pt-4 border-t border-[var(--border-glass)]">
          <button
            onClick={() => signOut({ redirect: false })}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 group ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
