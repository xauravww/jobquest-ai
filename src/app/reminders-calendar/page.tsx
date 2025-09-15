'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input, Pagination } from 'antd';
import AppLayout from '@/components/AppLayout';
import {
  Calendar,
  Clock,
  Bell,
  CheckCircle,
  Edit,
  PauseCircle,
  Users,
  MapPin,
  FileText,
  Search,
  Zap,
  Target
} from 'lucide-react';
import { RiDeleteBin6Line } from 'react-icons/ri';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import CreateReminderModal from '@/components/modals/CreateReminderModal';
import CreateEventModal from '@/components/modals/CreateEventModal';

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

interface CalendarEvent {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  type: string;
  status: string;
  location?: {
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    isVirtual: boolean;
    meetingLink?: string;
    meetingId?: string;
    meetingPassword?: string;
  };
  attendees: Array<{
    name: string;
    email: string;
    role: string;
    company: string;
  }>;
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
  priority: string;
  agenda: string[];
}

const RemindersCalendarPage = () => {
  const [reminders, setReminders] = useState<(Reminder & { tags: string[] })[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'reminder' | 'event'>('reminder');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingReminder, setEditingReminder] = useState<(Reminder & { tags: string[] }) | undefined>(undefined);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | string | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const fetchData = useCallback(async (page = 1) => {
    try {
      setLoading(true);

      // Fetch reminders with pagination
      const remindersResponse = await fetch(`/api/reminders?page=${page}&limit=${itemsPerPage}`);
      if (remindersResponse.ok) {
        const remindersData = await remindersResponse.json();
        setReminders(remindersData.reminders || []);
        setTotalPages(remindersData.pagination.pages || 1);
      }

      // Fetch calendar events (no pagination assumed)
      const eventsResponse = await fetch('/api/calendar/events');
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData.events || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  useEffect(() => {
    fetchData(currentPage);
  }, [fetchData, currentPage]);

  const handleCompleteReminder = async (reminderId: string) => {
    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      
      if (response.ok) {
        fetchData(currentPage);
      }
    } catch (error) {
      console.error('Error completing reminder:', error);
    }
  };

  const handleSnoozeReminder = async (reminderId: string, snoozeUntil: Date) => {
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
        fetchData(currentPage);
      }
    } catch (error) {
      console.error('Error snoozing reminder:', error);
    }
  };

  const handleDeleteItem = async (id: string, type: 'reminder' | 'event') => {
    try {
      const endpoint = type === 'reminder' ? `/api/reminders/${id}` : `/api/calendar/events/${id}`;
      const response = await fetch(endpoint, { method: 'DELETE' });
      
      if (response.ok) {
        fetchData(currentPage);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // Filter items based on active filter and search
  const getFilteredItems = () => {
    const allItems = [
      ...reminders.map(r => ({ ...r, type: 'reminder' as const })),
      ...events.map(e => ({ ...e, type: 'event' as const, dueDate: e.startDate }))
    ];

    let filtered = allItems;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    switch (activeFilter) {
      case 'today':
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.dueDate);
          return itemDate >= today && itemDate < tomorrow;
        });
        break;
      case 'upcoming':
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.dueDate);
          return itemDate >= tomorrow;
        });
        break;
      case 'overdue':
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.dueDate);
          return itemDate < today && item.status !== 'completed';
        });
        break;
    }

    return filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  };

  const filteredItems = getFilteredItems();

  const getItemIcon = (item: (Reminder & { type: 'reminder' }) | (CalendarEvent & { type: 'event'; dueDate: string })) => {
    if (item.type === 'reminder') {
      return <Bell className="w-5 h-5 text-primary" />;
    }
    return <Calendar className="w-5 h-5 text-success" />;
  };

  const getTimeDisplay = (item: (Reminder & { type: 'reminder' }) | (CalendarEvent & { type: 'event'; dueDate: string })) => {
    const date = new Date(item.dueDate);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

    const time = 'dueTime' in item ? item.dueTime : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return `Today at ${time}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${time}`;
    } else {
      return `${date.toLocaleDateString()} at ${time}`;
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
      case 'scheduled': return 'text-white bg-blue-600';
      case 'confirmed': return 'text-white bg-green-600';
      default: return 'text-white bg-gray-600';
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8 bg-bg min-h-screen flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-text-muted">Loading reminders and calendar...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showFooter={false}>
      <div className="p-8 bg-bg min-h-screen">
        {/* Simple Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl border border-primary/30">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              My Schedule
            </h1>
          </div>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Keep track of your job search activities, interviews, and important deadlines
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => {
              setCreateType('reminder');
              setEditingReminder(undefined);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <Bell className="w-5 h-5" />
            Add Reminder
          </button>

          <button
            onClick={() => {
              setCreateType('event');
              setEditingEvent(undefined);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <Calendar className="w-5 h-5" />
            Add Event
          </button>
        </div>

        {/* Simple Search and Filters */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="filter-panel rounded-xl p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search */}
              <div className="flex-1 w-full">
                <AntSearch
                  placeholder="Search your reminders and events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="large"
                  allowClear
                  enterButton={<Search className="w-5 h-5" />}
                  className="max-w-full rounded-lg"
                  style={{ maxWidth: '100%' }}
                />
              </div>

              {/* Quick Filters */}
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${activeFilter === key
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
              {activeFilter === 'all' && `All Items (${filteredItems.length})`}
              {activeFilter === 'today' && `Today (${filteredItems.length})`}
              {activeFilter === 'upcoming' && `Upcoming (${filteredItems.length})`}
              {activeFilter === 'overdue' && `Overdue (${filteredItems.length})`}
            </h2>
            {searchQuery && (
              <span className="text-text-muted text-sm">
                Searching for &#34;{searchQuery}&#34;
              </span>
            )}
          </div>
        </div>

        {/* Unified Content */}
        <div className="max-w-4xl mx-auto">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/30">
                {activeFilter === 'overdue' ? (
                  <Bell className="w-12 h-12 text-primary" />
                ) : (
                  <Target className="w-12 h-12 text-primary" />
                )}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                {searchQuery ? 'No matches found' :
                  activeFilter === 'today' ? 'Nothing scheduled for today' :
                    activeFilter === 'upcoming' ? 'No upcoming items' :
                      activeFilter === 'overdue' ? 'No overdue items' :
                        'No reminders or events yet'}
              </h3>
              <p className="text-text-muted text-lg max-w-md mx-auto leading-relaxed mb-6">
                {searchQuery ? 'Try adjusting your search terms' :
                  'Start by adding your first reminder or calendar event to stay organized'}
              </p>
              {!searchQuery && (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => {
                      setCreateType('reminder');
                      setEditingReminder(undefined);
                      setShowCreateModal(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    <Bell className="w-4 h-4" />
                    Add Reminder
                  </button>
                  <button
                    onClick={() => {
                      setCreateType('event');
                      setEditingEvent(undefined);
                      setShowCreateModal(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    <Calendar className="w-4 h-4" />
                    Add Event
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div
                  key={item._id}
                  className={`bg-gradient-to-r from-bg-card to-bg-card/80 backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${item.status === 'completed' ? 'border-green-500/30 bg-green-500/5' :
                      activeFilter === 'overdue' && new Date(item.dueDate) < new Date() ? 'border-red-500/50 bg-red-500/10' :
                        'border-border hover:border-primary/50'
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getItemIcon(item)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-lg font-semibold ${item.status === 'completed' ? 'line-through text-text-muted' : 'text-white'
                          }`}>
                          {item.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-text-muted mb-3 leading-relaxed">{item.description}</p>
                      )}

                      <div className="flex items-center gap-6 text-sm text-text-muted">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="font-medium">{getTimeDisplay(item)}</span>
                        </div>

                        {item.jobId && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span>{item.jobId.title} at {item.jobId.company}</span>
                          </div>
                        )}

                        {'location' in item && item.location?.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-400" />
                            <span>{item.location.address}</span>
                          </div>
                        )}

                        {'attendees' in item && item.attendees && item.attendees.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-400" />
                            <span>{item.attendees.length} attendee{item.attendees.length > 1 ? 's' : ''}</span>
                          </div>
                        )}
                  </div>
                </div>

                    <div className="flex items-center gap-2">
                      {item.type === 'reminder' && item.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleCompleteReminder(item._id)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-600/30 rounded-lg transition-all duration-200 hover:scale-105"
                            title="Mark as Complete"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSnoozeReminder(item._id, new Date(Date.now() + 24 * 60 * 60 * 1000))}
                            className="flex items-center gap-2 px-3 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 hover:text-yellow-300 border border-yellow-600/30 rounded-lg transition-all duration-200 hover:scale-105"
                            title="Snooze for 24 hours"
                          >
                            <PauseCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                          <button
                            onClick={() => {
                              if (item.type === 'reminder') {
                                // Fix for title and tags to be strings
                                const fixedReminder = {
                                  ...item,
                                  title: typeof item.title === 'object' ? JSON.stringify(item.title) : item.title,
                              tags: Array.isArray(item.tags) ? item.tags : (typeof item.tags === 'string' ? (item.tags as string).split(',').map((tag: string) => tag.trim()) : [])
                                };
                                setEditingReminder(fixedReminder as Reminder);
                                setCreateType('reminder');
                              } else {
                                setEditingEvent(item as CalendarEvent);
                                setCreateType('event');
                              }
                              setShowCreateModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 rounded-lg transition-all duration-200 hover:scale-105"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                            <span className="sr-only">Edit</span>
                          </button>
                      <button
                        onClick={() => handleDeleteItem(item._id, item.type)}
                        className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white border border-red-700 rounded-lg transition-all duration-200 hover:scale-105"
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

          {/* Pagination Controls */}
          <div className="flex justify-center mt-8">
          <Pagination
            current={currentPage}
            total={totalPages * 10}
            pageSize={10}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
            showQuickJumper
            className="bg-bg-card rounded-lg p-4"
            disabled={totalPages <= 1}
          />
          </div>
          {filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/30">
                {activeFilter === 'overdue' ? (
                  <Bell className="w-12 h-12 text-primary" />
                ) : (
                  <Target className="w-12 h-12 text-primary" />
                )}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                {searchQuery ? 'No matches found' :
                 activeFilter === 'today' ? 'Nothing scheduled for today' :
                 activeFilter === 'upcoming' ? 'No upcoming items' :
                 activeFilter === 'overdue' ? 'No overdue items' :
                 'No reminders or events yet'}
              </h3>
              <p className="text-text-muted text-lg max-w-md mx-auto leading-relaxed mb-6">
                {searchQuery ? 'Try adjusting your search terms' :
                 'Start by adding your first reminder or calendar event to stay organized'}
              </p>
              {!searchQuery && (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => {
                      setCreateType('reminder');
                      setEditingReminder(undefined);
                      setShowCreateModal(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    <Bell className="w-4 h-4" />
                    Add Reminder
                  </button>
                  <button
                    onClick={() => {
                      setCreateType('event');
                      setEditingEvent(undefined);
                      setShowCreateModal(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    <Calendar className="w-4 h-4" />
                    Add Event
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div
                  key={item._id}
                  className={`bg-gradient-to-r from-bg-card to-bg-card/80 backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                    item.status === 'completed' ? 'border-green-500/30 bg-green-500/5' :
                    activeFilter === 'overdue' && new Date(item.dueDate) < new Date() ? 'border-red-500/50 bg-red-500/10' :
                    'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getItemIcon(item)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-lg font-semibold ${
                          item.status === 'completed' ? 'line-through text-text-muted' : 'text-white'
                        }`}>
                          {item.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-text-muted mb-3 leading-relaxed">{item.description}</p>
                      )}

                      <div className="flex items-center gap-6 text-sm text-text-muted">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="font-medium">{getTimeDisplay(item)}</span>
                        </div>

                        {item.jobId && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span>{item.jobId.title} at {item.jobId.company}</span>
                          </div>
                        )}

                        {'location' in item && item.location?.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-400" />
                            <span>{item.location.address}</span>
                          </div>
                        )}

                        {'attendees' in item && item.attendees && item.attendees.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-400" />
                            <span>{item.attendees.length} attendee{item.attendees.length > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.type === 'reminder' && item.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleCompleteReminder(item._id)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-600/30 rounded-lg transition-all duration-200 hover:scale-105"
                            title="Mark as Complete"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSnoozeReminder(item._id, new Date(Date.now() + 24 * 60 * 60 * 1000))}
                            className="flex items-center gap-2 px-3 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 hover:text-yellow-300 border border-yellow-600/30 rounded-lg transition-all duration-200 hover:scale-105"
                            title="Snooze for 24 hours"
                          >
                            <PauseCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          if (item.type === 'reminder') {
                            // Fix for title and tags to be strings
                            const fixedReminder = {
                              ...item,
                              title: typeof item.title === 'object' ? JSON.stringify(item.title) : item.title,
                              tags: Array.isArray(item.tags) ? item.tags : (typeof item.tags === 'string' ? (item.tags as string).split(',').map((tag: string) => tag.trim()) : [])
                             } as Reminder;
                             setEditingReminder(fixedReminder);
                             setCreateType('reminder');
                           } else {
                             setEditingEvent(item as CalendarEvent);
                             setCreateType('event');
                           }
                           setShowCreateModal(true);
                         }}
                         className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 rounded-lg transition-all duration-200 hover:scale-105"
                         title="Edit"
                       >
                         <Edit className="w-5 h-5" />
                         <span className="sr-only">Edit</span>
                       </button>
                      <button
                        onClick={() => handleDeleteItem(item._id, item.type)}
                        className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white border border-red-700 rounded-lg transition-all duration-200 hover:scale-105"
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

          {/* Pagination Controls */}
          <div className="flex justify-center mt-8">
            <Pagination
              current={currentPage}
              total={totalPages * 10}
              pageSize={10}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
              showQuickJumper
              className="bg-bg-card rounded-lg p-4"
            />
          </div>

        {/* Modals */}
        {showCreateModal && createType === 'reminder' && (
          <CreateReminderModal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              setEditingReminder(undefined);
            }}
            onSuccess={() => {
              fetchData();
              setEditingReminder(undefined);
            }}
            editingReminder={editingReminder}
          />
        )}

        {showCreateModal && createType === 'event' && (
          <CreateEventModal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              setEditingEvent(undefined);
            }}
            onSuccess={() => {
              fetchData();
              setEditingEvent(undefined);
            }}
            editingEvent={editingEvent}
          />
        )}
      </div>
      </div>
    </AppLayout>
  );
};

export default RemindersCalendarPage;