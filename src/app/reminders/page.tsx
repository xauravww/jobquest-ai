'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  Bell,
  CheckCircle,
  PauseCircle,
  Edit,
  Search,
  Target,
  Zap,
  Clock,
  FileText,
  Trash2,
  Plus
} from 'lucide-react';
import RemindersSkeleton from '@/components/ui/RemindersSkeleton';
import CreateReminderModal from '@/components/modals/CreateReminderModal';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Reminder {
  _id: string;
  title: string;
  description?: string;
  dueDate: string;
  dueTime: string;
  type: string;
  priority: string;
  status: string;
  applicationId?: {
    _id: string;
    status: string;
    jobId: string;
  };
  jobId?: {
    _id: string;
    title: string;
    company: string;
  };
  tags: string[];
  color: string;
  completedAt?: string;
  snoozedUntil?: string;
  snoozeCount: number;
}

const RemindersPage = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue'>('all');
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage),
      });
      if (debouncedQuery) {
        params.append('search', debouncedQuery);
      }
      try {
        const response = await fetch(`/api/reminders?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setReminders(data.reminders || []);
          setTotal(data.pagination?.total || 0);
        } else {
          setReminders([]);
          setTotal(0);
        }
      } catch (error) {
        console.error('Error fetching reminders:', error);
        setReminders([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPage, debouncedQuery, itemsPerPage, refreshCounter]);

  const refetchData = () => {
    setRefreshCounter(prev => prev + 1);
  };

  const handleCompleteReminder = async (reminderId: string) => {
    setActionLoading(reminderId);
    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      if (response.ok) {
        toast.success('Reminder marked as completed');
        refetchData();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error completing reminder:', error);
      toast.error('Error completing reminder');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusUpdate = async (reminderId: string, newStatus: string) => {
    setActionLoading(reminderId);
    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        toast.success('Reminder status updated');
        refetchData();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSnoozeReminder = async (reminderId: string, snoozeUntil: Date) => {
    setActionLoading(reminderId);
    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'snoozed',
          snoozedUntil: snoozeUntil.toISOString()
        })
      });
      if (response.ok) {
        toast.success('Reminder snoozed for 24 hours');
        refetchData();
      } else {
        toast.error('Failed to snooze reminder');
      }
    } catch (error) {
      console.error('Error snoozing reminder:', error);
      toast.error('Error snoozing reminder');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;
    setActionLoading(id);
    try {
      const response = await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Reminder deleted');
        refetchData();
      } else {
        toast.error('Failed to delete reminder');
      }
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast.error('Error deleting reminder');
    } finally {
      setActionLoading(null);
    }
  };

  const getFilteredReminders = () => {
    let filtered = reminders;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    switch (activeFilter) {
      case 'today':
        filtered = filtered.filter(r => {
          const itemDate = new Date(r.dueDate);
          return itemDate >= today && itemDate < tomorrow;
        });
        break;
      case 'upcoming':
        filtered = filtered.filter(r => {
          const itemDate = new Date(r.dueDate);
          return itemDate >= tomorrow;
        });
        break;
      case 'overdue':
        filtered = filtered.filter(r => {
          const itemDate = new Date(r.dueDate);
          return itemDate < today && r.status !== 'completed';
        });
        break;
    }
    return filtered;
  };

  const filteredReminders = getFilteredReminders();

  const getTimeDisplay = (reminder: Reminder) => {
    const date = new Date(reminder.dueDate);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    if (isToday) {
      return `Today at ${reminder.dueTime || date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${reminder.dueTime || date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${date.toLocaleDateString()} at ${reminder.dueTime || date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-[var(--danger)] bg-[var(--danger)]/10 border-[var(--danger)]/20';
      case 'high': return 'text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/20';
      case 'medium': return 'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/20';
      case 'low': return 'text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/20';
      default: return 'text-[var(--text-muted)] bg-[var(--bg-surface)] border-[var(--border-glass)]';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/20';
      case 'pending': return 'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/20';
      case 'snoozed': return 'text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/20';
      case 'cancelled': return 'text-[var(--danger)] bg-[var(--danger)]/10 border-[var(--danger)]/20';
      default: return 'text-[var(--text-muted)] bg-[var(--bg-surface)] border-[var(--border-glass)]';
    }
  };

  return (
    <AppLayout showFooter={false}>
      <div className="p-6 lg:p-8 min-h-screen space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-[var(--primary)]/20 rounded-xl border border-[var(--primary)]/30">
                <Bell className="w-8 h-8 text-[var(--primary)]" />
              </div>
              My Reminders
            </h1>
            <p className="text-[var(--text-muted)] mt-2 ml-16">Manage your job search reminders and important deadlines</p>
          </div>

          <button
            onClick={() => { setEditingReminder(undefined); setShowCreateModal(true); }}
            className="px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold rounded-xl shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Reminder</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-[var(--bg-surface)]/50 backdrop-blur-xl rounded-2xl p-6 border border-[var(--border-glass)] space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search your reminders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white placeholder-[var(--text-dim)] focus:border-[var(--primary)] focus:outline-none transition-colors"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
              {[
                { key: 'all', label: 'All', icon: Target },
                { key: 'today', label: 'Today', icon: Zap },
                { key: 'upcoming', label: 'Upcoming', icon: Clock },
                { key: 'overdue', label: 'Overdue', icon: Bell }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key as 'all' | 'today' | 'upcoming' | 'overdue')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${activeFilter === key
                      ? 'bg-[var(--primary)] text-black shadow-lg shadow-[var(--primary)]/20'
                      : 'bg-[var(--bg-deep)] text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-glass)] border border-[var(--border-glass)]'
                    }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-8 bg-[var(--secondary)] rounded-full"></span>
            All Reminders ({filteredReminders.length})
          </h2>
          {debouncedQuery && <span className="text-[var(--text-muted)] text-sm">Searching for &quot;{debouncedQuery}&quot;</span>}
        </div>

        {/* Reminders List */}
        {loading ? (
          <RemindersSkeleton count={5} />
        ) : filteredReminders.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[var(--border-glass)] rounded-2xl bg-[var(--bg-surface)]/20">
            <div className="w-20 h-20 bg-[var(--bg-surface)] rounded-full flex items-center justify-center mx-auto mb-6 border border-[var(--border-glass)]">
              <Bell className="w-10 h-10 text-[var(--text-muted)]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {debouncedQuery ? 'No matches found' : 'No reminders yet'}
            </h3>
            <p className="text-[var(--text-muted)] max-w-md mx-auto mb-6">
              {debouncedQuery ? 'Try adjusting your search terms' : 'Start by adding your first reminder to stay organized'}
            </p>
            {!debouncedQuery && (
              <button
                onClick={() => { setEditingReminder(undefined); setShowCreateModal(true); }}
                className="px-6 py-2 bg-[var(--primary)] text-black font-bold rounded-xl hover:bg-[var(--primary)]/90 transition-all"
              >
                Add Your First Reminder
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredReminders.map((reminder) => (
                <motion.div
                  key={reminder._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`rounded-xl p-6 border transition-all duration-300 hover:shadow-lg hover:shadow-[var(--primary)]/5 group ${reminder.status === 'completed'
                      ? 'bg-[var(--success)]/5 border-[var(--success)]/20'
                      : activeFilter === 'overdue' && new Date(reminder.dueDate) < new Date()
                        ? 'bg-[var(--danger)]/5 border-[var(--danger)]/20'
                        : 'bg-[var(--bg-surface)]/50 border-[var(--border-glass)] hover:border-[var(--primary)]/50'
                    }`}
                >
                  <div className="flex flex-col md:flex-row items-start gap-4">
                    <div className="flex-shrink-0 mt-1 p-3 bg-[var(--bg-deep)] rounded-xl border border-[var(--border-glass)]">
                      <Bell className="w-6 h-6 text-[var(--primary)]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className={`text-xl font-bold ${reminder.status === 'completed' ? 'line-through text-[var(--text-muted)]' : 'text-white'}`}>
                          {reminder.title}
                        </h3>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getPriorityColor(reminder.priority)}`}>
                          {reminder.priority.charAt(0).toUpperCase() + reminder.priority.slice(1)}
                        </span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getStatusColor(reminder.status)}`}>
                          {reminder.status.charAt(0).toUpperCase() + reminder.status.slice(1)}
                        </span>
                      </div>

                      {reminder.description && (
                        <p className="text-[var(--text-muted)] mb-3 line-clamp-2">{reminder.description}</p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6 text-sm text-[var(--text-muted)]">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[var(--secondary)]" />
                          <span className="font-medium text-white">{getTimeDisplay(reminder)}</span>
                        </div>

                        {reminder.jobId && typeof reminder.jobId === 'object' && (
                          <div className="flex items-center gap-2 md:col-span-2">
                            <FileText className="w-4 h-4 text-[var(--warning)]" />
                            <span>{reminder.jobId.title} at <span className="text-white font-medium">{reminder.jobId.company}</span></span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                      <select
                        value={reminder.status}
                        onChange={(e) => handleStatusUpdate(reminder._id, e.target.value)}
                        disabled={actionLoading === reminder._id}
                        className="bg-[var(--bg-deep)] border border-[var(--border-glass)] text-white text-sm rounded-lg px-2 py-2 focus:border-[var(--primary)] focus:outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="snoozed">Snoozed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      {reminder.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleCompleteReminder(reminder._id)}
                            disabled={actionLoading === reminder._id}
                            className="p-2 bg-[var(--success)]/10 hover:bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/20 rounded-lg transition-colors"
                            title="Mark as Complete"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleSnoozeReminder(reminder._id, new Date(Date.now() + 24 * 60 * 60 * 1000))}
                            disabled={actionLoading === reminder._id}
                            className="p-2 bg-[var(--warning)]/10 hover:bg-[var(--warning)]/20 text-[var(--warning)] border border-[var(--warning)]/20 rounded-lg transition-colors"
                            title="Snooze for 24 hours"
                          >
                            <PauseCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => { setEditingReminder(reminder); setShowCreateModal(true); }}
                        disabled={actionLoading === reminder._id}
                        className="p-2 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteReminder(reminder._id)}
                        disabled={actionLoading === reminder._id}
                        className="p-2 bg-[var(--danger)]/10 hover:bg-[var(--danger)]/20 text-[var(--danger)] border border-[var(--danger)]/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {total > itemsPerPage && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-glass)] text-white disabled:opacity-50 hover:bg-[var(--bg-glass)] transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-[var(--text-muted)]">
                Page {currentPage} of {Math.ceil(total / itemsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(total / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(total / itemsPerPage)}
                className="px-4 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-glass)] text-white disabled:opacity-50 hover:bg-[var(--bg-glass)] transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {showCreateModal && (
          <CreateReminderModal
            isOpen={showCreateModal}
            onClose={() => { setShowCreateModal(false); setEditingReminder(undefined); }}
            onSuccess={() => { refetchData(); setEditingReminder(undefined); }}
            editingReminder={editingReminder}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default RemindersPage;
