'use client';

import React, { useState } from 'react';
import {
  Bell,
  Target,
  Phone,
  Mail,
  X,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  Eye,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { notificationService } from '@/services/NotificationService';
import type { Notification } from '@/services/NotificationService';
import { motion, AnimatePresence } from 'framer-motion';
import Button from "@/components/ui/Button";
import { Select } from 'antd';

interface NotificationsPanelProps {
  notifications: Notification[];
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ notifications }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase()) && !n.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    if (statusFilter === 'unread' && n.read) return false;
    if (statusFilter === 'read' && !n.read) return false;
    return true;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / pageSize);
  const paginatedNotifications = filteredNotifications.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'interview': return <Target className="w-4 h-4" />;
      case 'reminder': return <Bell className="w-4 h-4" />;
      case 'follow_up': return <Phone className="w-4 h-4" />;
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      case 'error': return <X className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'interview': return 'bg-[var(--danger)]/20 text-[var(--danger)] border-[var(--danger)]/30';
      case 'reminder': return 'bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30';
      case 'follow_up': return 'bg-[var(--secondary)]/20 text-[var(--secondary)] border-[var(--secondary)]/30';
      case 'success': return 'bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30';
      case 'warning': return 'bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30';
      case 'error': return 'bg-[var(--danger)]/20 text-[var(--danger)] border-[var(--danger)]/30';
      default: return 'bg-[var(--primary)]/20 text-[var(--primary)] border-[var(--primary)]/30';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-[var(--warning)]/20 rounded-xl border border-[var(--warning)]/30">
              <Bell className="w-6 h-6 text-[var(--warning)]" />
            </div>
            Notifications
          </h2>
          <p className="text-[var(--text-muted)] mt-1 ml-14">
            Stay updated with your job search activities
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="secondary"
            onClick={() => notificationService.markAllAsRead()}
            disabled={notificationService.getUnreadCount() === 0}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-muted)] hover:text-white hover:border-[var(--primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Mark All Read</span>
          </Button>
          <Button
            variant="danger"
            onClick={() => notificationService.clearAll()}
            disabled={notifications.length === 0}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] hover:bg-[var(--danger)]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear All</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--bg-surface)]/30 backdrop-blur-xl rounded-2xl p-6 border border-[var(--border-glass)]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters & Search</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white placeholder-[var(--text-dim)] focus:border-[var(--primary)] focus:outline-none transition-colors"
              />
            </div>

            <Select
              value={typeFilter}
              onChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'reminder', label: 'Reminders' },
                { value: 'interview', label: 'Interviews' },
                { value: 'follow_up', label: 'Follow-ups' },
                { value: 'success', label: 'Success' },
                { value: 'warning', label: 'Warnings' },
                { value: 'error', label: 'Errors' },
              ]}
              className="w-full"
            />

            <Select
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'unread', label: 'Unread' },
                { value: 'read', label: 'Read' },
              ]}
              className="w-full"
            />
          </div>

          {/* Quick filter pills */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => { setStatusFilter(statusFilter === 'unread' ? 'all' : 'unread'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${statusFilter === 'unread'
                ? 'bg-[var(--warning)]/20 border-[var(--warning)] text-[var(--warning)]'
                : 'bg-[var(--bg-deep)] border-[var(--border-glass)] text-[var(--text-muted)] hover:border-[var(--warning)]/50'
                }`}
            >
              Unread ({notifications.filter(n => !n.read).length})
            </Button>
            <Button
              variant="secondary"
              onClick={() => { setTypeFilter(typeFilter === 'reminder' ? 'all' : 'reminder'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${typeFilter === 'reminder'
                ? 'bg-[var(--warning)]/20 border-[var(--warning)] text-[var(--warning)]'
                : 'bg-[var(--bg-deep)] border-[var(--border-glass)] text-[var(--text-muted)] hover:border-[var(--warning)]/50'
                }`}
            >
              Reminders ({notifications.filter(n => n.type === 'reminder').length})
            </Button>
            <Button
              variant="secondary"
              onClick={() => { setTypeFilter(typeFilter === 'interview' ? 'all' : 'interview'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${typeFilter === 'interview'
                ? 'bg-[var(--danger)]/20 border-[var(--danger)] text-[var(--danger)]'
                : 'bg-[var(--bg-deep)] border-[var(--border-glass)] text-[var(--text-muted)] hover:border-[var(--danger)]/50'
                }`}
            >
              Interviews ({notifications.filter(n => n.type === 'interview').length})
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-12 border border-dashed border-[var(--border-glass)] rounded-2xl"
            >
              <div className="w-16 h-16 bg-[var(--bg-surface)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-[var(--text-muted)]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No notifications found</h3>
              <p className="text-[var(--text-muted)]">
                {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters to see more notifications'
                  : "You're all caught up! New notifications will appear here."
                }
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {paginatedNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`relative p-4 rounded-xl border transition-all cursor-pointer group ${notification.read
                    ? 'bg-[var(--bg-surface)]/30 border-[var(--border-glass)] hover:border-[var(--primary)]/30'
                    : 'bg-[var(--primary)]/5 border-[var(--primary)]/20 hover:border-[var(--primary)]/50'
                    }`}
                  onClick={() => notificationService.markAsRead(notification.id)}
                >
                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="absolute left-0 top-4 bottom-4 w-1 bg-[var(--primary)] rounded-r-full"></div>
                  )}

                  <div className="flex items-start gap-4 pl-2">
                    <div className={`p-2.5 rounded-lg border ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className={`font-semibold text-lg ${notification.read ? 'text-[var(--text-main)]' : 'text-white'}`}>
                          {notification.title}
                        </h4>
                        <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 whitespace-nowrap">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>

                      <p className="text-sm text-[var(--text-muted)] mb-3 leading-relaxed">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); notificationService.markAsRead(notification.id); }}
                            className="p-1.5 text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                            title="Mark as read"
                            aria-label="Mark as read"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); notificationService.deleteNotification(notification.id); }}
                          className="p-1.5 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
                          title="Delete notification"
                          aria-label="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <Button
              variant="ghost"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-[var(--bg-surface)] disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="text-[var(--text-muted)]">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="ghost"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-[var(--bg-surface)] disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;