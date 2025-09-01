'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Briefcase,
  FileText,
  BarChart3,
  Users,
  Settings,
  User,
  Bell,
  Search,
  Heart,
  Calendar,
  BookOpen,
  Target,
  TrendingUp
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Job Search', href: '/jobs', icon: Search },
    { name: 'My Jobs', href: '/my-jobs', icon: Briefcase },
    { name: 'Applications', href: '/applications', icon: FileText },
    { name: 'Saved Jobs', href: '/saved', icon: Heart },
    { name: 'Interviews', href: '/interviews', icon: Calendar },
    { name: 'Resume', href: '/resume', icon: BookOpen },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Network', href: '/network', icon: Users },
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'Insights', href: '/insights', icon: TrendingUp },
  ];

  const bottomNavigation = [
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className={cn('flex flex-col h-full bg-white border-r border-gray-200', className)}>
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex-1 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 flex-shrink-0 h-5 w-5',
                    isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="px-3 space-y-1 border-t border-gray-200 pt-4">
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 flex-shrink-0 h-5 w-5',
                    isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
