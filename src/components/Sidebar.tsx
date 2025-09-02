'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  User,
  FileText,
  BarChart3,
  Bell,
  Bot,
  Zap,
  Settings,
  Crown,
  ShieldCheck
} from 'lucide-react';
import Image from 'next/image';

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean; // Added isCollapsed prop for potential future use
}

// Reusable NavLink component with advanced styling
const NavLink = ({ href, icon: Icon, children, pathname, isCollapsed = false }: { href: string, icon: unknown, children: React.ReactNode, pathname: string, isCollapsed?: boolean }) => {
  const isActive = pathname === href;

  return (
    <Link href={href}>
      <div className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive ? 'nav-item-active' : ''}`}>
        <Icon className="h-5 w-5 nav-icon" />
        {!isCollapsed && (
          <span className="text-sm font-medium">{children}</span>
        )}
      </div>
    </Link>
  );
};


const Sidebar = ({ className, isCollapsed = false }: SidebarProps) => {
  const pathname = usePathname();

  // Mocked user role logic for the badge, matching reference design
  const getRoleInfo = (role) => {
    switch (role) {
      case 'owner':
        return { label: 'Owner', icon: Crown, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', textColor: '#ffffff' };
      case 'admin':
        return { label: 'Admin', icon: ShieldCheck, gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', textColor: '#ffffff' };
      default:
        return { label: 'Subscriber', icon: User, gradient: 'linear-gradient(135deg, #10b981, #059669)', textColor: '#ffffff' };
    }
  };

  const accountType = 'subscriber'; // Example: Set your desired mock role here
  const roleInfo = getRoleInfo(accountType);
  const IconComponent = roleInfo.icon;

  // Jobquest AI navigation items
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/user-profile', label: 'Profile', icon: User },
    { href: '/resume-management', label: 'Resumes', icon: FileText },
    { href: '/latex-resume', label: 'LaTeX Resume', icon: FileText },
    { href: '/application-tracking', label: 'Applications', icon: BarChart3 },
    { href: '/reminders', label: 'Reminders', icon: Bell },
    { href: '/ai-filtering-v2', label: 'AI Jobs', icon: Bot },
    { href: '/naukri-automation', label: 'Auto Apply', icon: Zap },
    { href: '/admin/job-actions', label: 'Job Actions', icon: Settings },
  ];

  return (
    <>
      <style jsx>{`
        /* Modern sidebar styling matching reference design */
        .nav-item {
          position: relative;
          overflow: hidden;
          border-radius: 8px;
          min-width: 0;
          flex-shrink: 0;
          margin: 2px 0;
        }

        .nav-item-active {
          position: relative;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3) !important;
          border-left: 3px solid #ffffff !important;
        }

        .nav-item-active p,
        .nav-item-active .nav-icon {
          color: #ffffff !important;
          font-weight: 600 !important;
        }

        .nav-item:not(.nav-item-active):hover {
          background: rgba(16, 185, 129, 0.1) !important;
          border-left: 3px solid rgba(16, 185, 129, 0.5) !important;
        }

        /* Section headers */
        .section-header {
            margin: 20px 0 12px 0;
            padding: 0;
        }

        .section-title {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-secondary);
            margin-bottom: 8px;
        }
      `}</style>
      <div className={cn('flex flex-col h-full bg-sidebar border-r border-sidebar-border', className)}
           style={{ width: '256px' }}>

        {/* Logo and Role Badge Section */}
        <div className="flex flex-col items-start p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">J</span>
            </div>
            <div className="text-white font-semibold text-lg">Jobquest AI</div>
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
               style={{
                 background: roleInfo.gradient,
                 color: roleInfo.textColor,
               }}>
            <IconComponent size={12} />
            <span>{roleInfo.label}</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col py-6 overflow-y-auto">
          {/* Main Navigation */}
          <div className="px-6">
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  href={item.href}
                  icon={item.icon}
                  pathname={pathname}
                  isCollapsed={isCollapsed}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;