'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Avatar } from 'antd';
import { FaUser } from 'react-icons/fa';
import {
  Home,
  Settings,
  Search,
  Briefcase,
  LogOut,
  FileText,
  Brain,
  Bot,
  Calendar,
} from 'lucide-react';
import BrandMark from '@/components/ui/BrandMark';

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onLinkClick?: () => void;
}

const NavLink = ({ href, icon, children, pathname, isCollapsed, onLinkClick }: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  pathname: string;
  isCollapsed?: boolean;
  onLinkClick?: () => void;
}) => {
  const isDashboard = href === '/dashboard';
  const isActive = isDashboard ? pathname === href : pathname.startsWith(href) && href !== '/';

  return (
    <Link
      href={href}
      onClick={onLinkClick}
      className={`relative group flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 ${isCollapsed ? 'justify-center' : ''
        } ${isActive
          ? 'bg-[var(--bg-raised)] text-[var(--accent)]'
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-main)]'
        }`}
    >
      <div className={`transition-colors duration-200 ${isActive ? 'text-[var(--accent)]' : 'group-hover:text-[var(--text-main)]'}`}>
        {icon}
      </div>
      {!isCollapsed && (
        <span className="text-sm font-medium">{children}</span>
      )}
    </Link>
  );
};

const SectionLabel = ({ children, isCollapsed }: { children: React.ReactNode; isCollapsed?: boolean }) => {
  if (isCollapsed) return <div className="my-2 h-px bg-[var(--border)] mx-2" />;
  return <div className="mt-5 mb-2 px-3 text-[10px] font-semibold text-[var(--text-dim)] uppercase tracking-widest">{children}</div>;
};

const Sidebar: React.FC<SidebarProps> = ({ className, isCollapsed = false, onLinkClick }) => {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);
  const { data: session } = useSession();

  return (
    <aside
      ref={sidebarRef}
      id="sidebar"
      className={`flex-shrink-0 flex flex-col gap-2 p-4 flex-1 overflow-y-auto overflow-x-hidden min-h-0 bg-[var(--bg-surface)] border-r border-[var(--border)] transition-all duration-300 ${className || ''}`}
      style={{ width: isCollapsed ? '70px' : '260px' }}
    >
      {/* Brand */}
      <div className={`flex items-center mb-4 ${isCollapsed ? 'justify-center py-2' : 'px-1 py-3'}`}>
        {isCollapsed ? (
          <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm">A</span>
          </div>
        ) : (
          <BrandMark size={24} textClass="text-base" />
        )}
      </div>

      {/* User */}
      {session && (
        <div className={`flex items-center gap-3 p-2 rounded-lg mb-2 ${isCollapsed ? 'justify-center' : ''}`}>
          <Avatar
            size={isCollapsed ? 30 : 34}
            src={session.user.image}
            icon={<FaUser />}
            className="bg-[var(--bg-raised)]"
          />
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 overflow-hidden">
              <p className="text-sm font-medium text-[var(--text-main)] truncate">{session.user.name}</p>
              <p className="text-xs text-[var(--text-dim)] truncate">{session.user.email}</p>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 flex-1">
        <NavLink href="/dashboard" icon={<Home size={18} />} pathname={pathname} isCollapsed={isCollapsed} onLinkClick={onLinkClick}>
          Dashboard
        </NavLink>

        <SectionLabel isCollapsed={isCollapsed}>Automation</SectionLabel>

        <NavLink href="/ai-filtering" icon={<Brain size={18} />} pathname={pathname} isCollapsed={isCollapsed} onLinkClick={onLinkClick}>
          Search Agent
        </NavLink>
        <NavLink href="/naukri-automation" icon={<Bot size={18} />} pathname={pathname} isCollapsed={isCollapsed} onLinkClick={onLinkClick}>
          Auto Apply
        </NavLink>

        <SectionLabel isCollapsed={isCollapsed}>Manage</SectionLabel>

        <NavLink href="/job-search" icon={<Search size={18} />} pathname={pathname} isCollapsed={isCollapsed} onLinkClick={onLinkClick}>
          Job Search
        </NavLink>
        <NavLink href="/application-tracking" icon={<Briefcase size={18} />} pathname={pathname} isCollapsed={isCollapsed} onLinkClick={onLinkClick}>
          Applications
        </NavLink>
        <NavLink href="/resume-management" icon={<FileText size={18} />} pathname={pathname} isCollapsed={isCollapsed} onLinkClick={onLinkClick}>
          Resumes
        </NavLink>
        <NavLink href="/reminders-calendar" icon={<Calendar size={18} />} pathname={pathname} isCollapsed={isCollapsed} onLinkClick={onLinkClick}>
          Calendar
        </NavLink>

        <SectionLabel isCollapsed={isCollapsed}>Account</SectionLabel>

        <NavLink href="/settings" icon={<Settings size={18} />} pathname={pathname} isCollapsed={isCollapsed} onLinkClick={onLinkClick}>
          Settings
        </NavLink>
      </nav>

      {/* Sign out */}
      {session && (
        <div className="mt-auto pt-2 border-t border-[var(--border)]">
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-raised)] hover:text-[var(--danger)] transition-all duration-200 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={18} />
            {!isCollapsed && <span className="text-sm font-medium">Sign out</span>}
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
