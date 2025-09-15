'use client';

import React, { useState, useEffect } from 'react';
import { Input, Pagination, Select } from 'antd';
import AppLayout from '@/components/AppLayout';
import {
  Bell,
  CheckCircle,
  PauseCircle,
  Edit,
  Trash2,
  Search,
  Target,
  Zap,
  Clock,
  FileText,
  MapPin,
  Users
} from 'lucide-react';
import { RiDeleteBin6Line } from 'react-icons/ri';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import CreateReminderModal from '@/components/modals/CreateReminderModal';
const { Search: AntSearch } = Input;

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
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue'>('all');

  // Debounce effect to update the search query after user stops typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1); // Reset to page 1 whenever the search query changes
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Effect to fetch data when the page or the debounced query changes
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
          setTotal(data.pagination.total || 0);
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
  }, [debouncedQuery, currentPage, itemsPerPage]);

  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  const handleCompleteReminder = async (reminderId: string) => {
    setActionLoading(reminderId);
    setActionError(null);
    setActionSuccess(null);
    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      setActionSuccess('Reminder marked as completed');
      // Refetch data after action
      const event = new Event('refetchReminders');
      window.dispatchEvent(event);
    } catch (error) {
      setActionError('Error completing reminder');
      console.error('Error completing reminder:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusUpdate = async (reminderId: string, newStatus: string) => {
    setActionLoading(reminderId);
    setActionError(null);
    setActionSuccess(null);
    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      setActionSuccess('Reminder status updated');
      const event = new Event('refetchReminders');
      window.dispatchEvent(event);
    } catch (error) {
      setActionError('Error updating status');
      console.error('Error updating status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSnoozeReminder = async (reminderId: string, snoozeUntil: Date) => {
    setActionLoading(reminderId);
    setActionError(null);
    setActionSuccess(null);
    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'snoozed',
          snoozedUntil: snoozeUntil.toISOString()
        })
      });
      if (!response.ok) {
        throw new Error('Failed to snooze reminder');
      }
      setActionSuccess('Reminder snoozed for 24 hours');
      // Refetch data after action
      const event = new Event('refetchReminders');
      window.dispatchEvent(event);
    } catch (error) {
      setActionError('Error snoozing reminder');
      console.error('Error snoozing reminder:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
      // Refetch data after action
      const event = new Event('refetchReminders');
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  // Client-side filtering for date ranges is still useful
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
    return filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
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
      case 'urgent': return 'text-white bg-red-600 border-red-600';
      case 'high': return 'text-white bg-orange-600 border-orange-600';
      case 'medium': return 'text-white bg-yellow-600 border-yellow-600';
      case 'low': return 'text-white bg-blue-600 border-blue-600';
      default: return 'text-white bg-gray-600 border-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-white bg-green-600';
      case 'pending': return 'text-white bg-blue-600';
      case 'snoozed': return 'text-white bg-yellow-600';
      case 'cancelled': return 'text-white bg-red-600';
      default: return 'text-white bg-gray-600';
    }
  };

  // Add an effect to listen for the refetch event
  useEffect(() => {
    const refetchData = () => {
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
            setTotal(data.pagination.total || 0);
          }
        } catch (error) {
          console.error('Error refetching reminders:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    };

    window.addEventListener('refetchReminders', refetchData);
    return () => {
      window.removeEventListener('refetchReminders', refetchData);
    };
  }, [currentPage, debouncedQuery, itemsPerPage]);

  return (
    <AppLayout showFooter={false}>
      <div className="p-8 bg-bg min-h-screen">
        {/* Header */}
        <div className="text-center mb-8 mt-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl border border-primary/30">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              My Reminders
            </h1>
          </div>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Manage your job search reminders and important deadlines
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => {
              setEditingReminder(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <Bell className="w-5 h-5" />
            Add Reminder
          </button>
        </div>

        {/* Notifications */}
        {(actionSuccess || actionError) && (
          <div className="max-w-4xl mx-auto mb-4">
            <div className={`p-4 rounded-lg ${actionSuccess ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
              {actionSuccess || actionError}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="filter-panel rounded-xl p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <AntSearch
                  placeholder="Search your reminders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="large"
                  allowClear
                  enterButton={<Search className="w-5 h-5" />}
                  className="max-w-full rounded-lg"
                  style={{ maxWidth: '100%' }}
                />
              </div>
              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'All', icon: Target },
                  { key: 'today', label: 'Today', icon: Zap },
                  { key: 'upcoming', label: 'Upcoming', icon: Clock },
                  { key: 'overdue', label: 'Overdue', icon: Bell }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key as 'all' | 'today' | 'upcoming' | 'overdue')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                      activeFilter === key
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-bg-light hover:bg-bg-card text-text-secondary hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              {activeFilter === 'all' && `All Reminders (${filteredReminders.length})`}
              {activeFilter === 'today' && `Today (${filteredReminders.length})`}
              {activeFilter === 'upcoming' && `Upcoming (${filteredReminders.length})`}
              {activeFilter === 'overdue' && `Overdue (${filteredReminders.length})`}
            </h2>
            {debouncedQuery && (
              <span className="text-text-muted text-sm">
                Searching for "{debouncedQuery}"
              </span>
            )}
          </div>
        </div>

        {/* Reminders List */}
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="text-center py-20">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-text-muted">
                {searchQuery ? `Searching for "${searchQuery}"...` : 'Loading reminders...'}
              </p>
            </div>
           ) : filteredReminders.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/30">
                {activeFilter === 'overdue' ? (
                  <Bell className="w-12 h-12 text-primary" />
                ) : (
                  <Target className="w-12 h-12 text-primary" />
                )}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                {debouncedQuery ? 'No matches found' :
                  activeFilter === 'today' ? 'Nothing scheduled for today' :
                    activeFilter === 'upcoming' ? 'No upcoming items' :
                      activeFilter === 'overdue' ? 'No overdue items' :
                        'No reminders yet'}
              </h3>
              <p className="text-text-muted text-lg max-w-md mx-auto leading-relaxed mb-6">
                {debouncedQuery ? 'Try adjusting your search terms' :
                  'Start by adding your first reminder to stay organized'}
              </p>
              {!debouncedQuery && (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => {
                      setEditingReminder(null);
                      setShowCreateModal(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    <Bell className="w-4 h-4" />
                    Add Reminder
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReminders.map((reminder) => (
                <div
                  key={reminder._id}
                  className={`bg-gradient-to-r from-bg-card to-bg-card/80 backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                    reminder.status === 'completed' ? 'border-green-500/30 bg-green-500/5' :
                    activeFilter === 'overdue' && new Date(reminder.dueDate) < new Date() ? 'border-red-500/50 bg-red-500/10' :
                    'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <Bell className="w-5 h-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-lg font-semibold ${reminder.status === 'completed' ? 'line-through text-text-muted' : 'text-white'}`}>
                          {reminder.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(reminder.priority)}`}>
                          {reminder.priority}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(reminder.status)}`}>
                          {reminder.status}
                        </span>
                      </div>

                      {reminder.description && (
                        <p className="text-text-muted mb-3 leading-relaxed">{reminder.description}</p>
                      )}

                      <div className="flex items-center gap-6 text-sm text-text-muted">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="font-medium">{getTimeDisplay(reminder)}</span>
                        </div>
                        {reminder.jobId && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span>{reminder.jobId.title} at {reminder.jobId.company}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={reminder.status}
                        onChange={(value) => handleStatusUpdate(reminder._id, value)}
                        disabled={actionLoading === reminder._id}
                        className="w-32"
                        size="small"
                      >
                        <Select.Option value="pending">Pending</Select.Option>
                        <Select.Option value="completed">Completed</Select.Option>
                        <Select.Option value="snoozed">Snoozed</Select.Option>
                        <Select.Option value="cancelled">Cancelled</Select.Option>
                      </Select>
                      {reminder.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleCompleteReminder(reminder._id)}
                            disabled={actionLoading === reminder._id}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-600/30 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50"
                            title="Mark as Complete"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSnoozeReminder(reminder._id, new Date(Date.now() + 24 * 60 * 60 * 1000))}
                            disabled={actionLoading === reminder._id}
                            className="flex items-center gap-2 px-3 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 hover:text-yellow-300 border border-yellow-600/30 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50"
                            title="Snooze for 24 hours"
                          >
                            <PauseCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setEditingReminder(reminder);
                          setShowCreateModal(true);
                        }}
                        disabled={actionLoading === reminder._id}
                        className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                        <span className="sr-only">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteReminder(reminder._id)}
                        disabled={actionLoading === reminder._id}
                        className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white border border-red-700 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50"
                        title="Delete"
                      >
                        <RiDeleteBin6Line className="w-5 h-5" />
                        <span className="sr-only">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-center mt-8">
          <Pagination
            current={currentPage}
            total={total}
            pageSize={itemsPerPage}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
            showQuickJumper
            className="rounded-lg p-4"
          />
        </div>

        {/* Modals */}
        {showCreateModal && (
          <CreateReminderModal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              setEditingReminder(null);
            }}
            onSuccess={() => {
              // Instead of direct fetch, dispatch event
              const event = new Event('refetchReminders');
              window.dispatchEvent(event);
              setEditingReminder(null);
            }}
            editingReminder={editingReminder}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default RemindersPage;
