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
          <button
            onClick={() => notificationService.markAllAsRead()}
            disabled={notificationService.getUnreadCount() === 0}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-muted)] hover:text-white hover:border-[var(--primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Mark All Read</span>
          </button>
          <button
            onClick={() => notificationService.clearAll()}
            disabled={notifications.length === 0}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] hover:bg-[var(--danger)]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear All</span>
          </button>
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

            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none transition-colors appearance-none"
            >
              <option value="all">All Types</option>
              <option value="reminder">Reminders</option>
              <option value="interview">Interviews</option>
              <option value="follow_up">Follow-ups</option>
              <option value="success">Success</option>
              <option value="warning">Warnings</option>
              <option value="error">Errors</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none transition-colors appearance-none"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>

          {/* Quick filter pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setStatusFilter(statusFilter === 'unread' ? 'all' : 'unread'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${statusFilter === 'unread'
                ? 'bg-[var(--warning)]/20 border-[var(--warning)] text-[var(--warning)]'
                : 'bg-[var(--bg-deep)] border-[var(--border-glass)] text-[var(--text-muted)] hover:border-[var(--warning)]/50'
                }`}
            >
              Unread ({notifications.filter(n => !n.read).length})
            </button>
            <button
              onClick={() => { setTypeFilter(typeFilter === 'reminder' ? 'all' : 'reminder'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${typeFilter === 'reminder'
                ? 'bg-[var(--warning)]/20 border-[var(--warning)] text-[var(--warning)]'
                : 'bg-[var(--bg-deep)] border-[var(--border-glass)] text-[var(--text-muted)] hover:border-[var(--warning)]/50'
                }`}
            >
              Reminders ({notifications.filter(n => n.type === 'reminder').length})
            </button>
            <button
              onClick={() => { setTypeFilter(typeFilter === 'interview' ? 'all' : 'interview'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${typeFilter === 'interview'
                ? 'bg-[var(--danger)]/20 border-[var(--danger)] text-[var(--danger)]'
                : 'bg-[var(--bg-deep)] border-[var(--border-glass)] text-[var(--text-muted)] hover:border-[var(--danger)]/50'
                }`}
            >
              Interviews ({notifications.filter(n => n.type === 'interview').length})
            </button>
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
                    <div className="absolute left-0 top-4 bottom-4 w-1 bg-[var(--primary)] rounded-r-full shadow-[0_0_10px_var(--primary-glow)]"></div>
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
                          <button
                            onClick={(e) => { e.stopPropagation(); notificationService.markAsRead(notification.id); }}
                            className="p-1.5 text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); notificationService.deleteNotification(notification.id); }}
                          className="p-1.5 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-[var(--bg-surface)] disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-[var(--text-muted)]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-[var(--bg-surface)] disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;