'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  Calendar,
  Clock,
  Edit,
  Search,
  Target,
  Zap,
  FileText,
  MapPin,
  Video,
  Plus,
  Trash2
} from 'lucide-react';
import EventsSkeleton from '@/components/ui/EventsSkeleton';
import CreateEventModal from '@/components/modals/CreateEventModal';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

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
    isVirtual: boolean;
    address?: string;
    meetingLink?: string;
    meetingId?: string;
  };
  jobId?: string | {
    _id: string;
    title: string;
    company: string;
  };
  attendees: Array<{
    name: string;
    email: string;
    role: string;
    company: string;
  }>;
  tags: string[];
  color: string;
  priority: string;
  agenda: string[];
}

const EventsPage = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue'>('all');
  const [refreshCounter, setRefreshCounter] = useState(0);

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
        const response = await fetch(`/api/calendar/events?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
          setTotal(data.pagination?.total || 0);
        } else {
          setEvents([]);
          setTotal(0);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
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

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      const response = await fetch(`/api/calendar/events/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Event deleted successfully');
        refetchData();
      } else {
        toast.error('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Error deleting event');
    }
  };

  const getFilteredEvents = () => {
    const filtered = events;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    switch (activeFilter) {
      case 'today':
        return filtered.filter((e: CalendarEvent) => {
          const itemDate = new Date(e.startDate);
          return itemDate >= today && itemDate < tomorrow;
        });
      case 'upcoming':
        return filtered.filter((e: CalendarEvent) => new Date(e.startDate) >= tomorrow);
      case 'overdue':
        return filtered.filter((e: CalendarEvent) => new Date(e.startDate) < today && e.status !== 'completed');
      default:
        return filtered;
    }
  };

  const filteredEvents = getFilteredEvents();

  const getTimeDisplay = (event: CalendarEvent) => {
    const date = new Date(event.startDate);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (date.toDateString() === tomorrow.toDateString()) return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/20';
      case 'pending': return 'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/20';
      case 'snoozed': return 'text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/20';
      case 'cancelled': return 'text-[var(--danger)] bg-[var(--danger)]/10 border-[var(--danger)]/20';
      case 'scheduled': return 'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/20';
      case 'confirmed': return 'text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/20';
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
                <Calendar className="w-8 h-8 text-[var(--primary)]" />
              </div>
              My Events
            </h1>
            <p className="text-[var(--text-muted)] mt-2 ml-16">Manage your job search events and important deadlines</p>
          </div>

          <button
            onClick={() => { setEditingEvent(undefined); setShowCreateModal(true); }}
            className="px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold rounded-xl shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Event</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-[var(--bg-surface)]/50 backdrop-blur-xl rounded-2xl p-6 border border-[var(--border-glass)] space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search your events..."
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
                { key: 'overdue', label: 'Overdue', icon: Calendar }
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
            All Events ({filteredEvents.length})
          </h2>
          {debouncedQuery && <span className="text-[var(--text-muted)] text-sm">Searching for &quot;{debouncedQuery}&quot;</span>}
        </div>

        {/* Events List */}
        {loading ? (
          <EventsSkeleton count={5} />
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[var(--border-glass)] rounded-2xl bg-[var(--bg-surface)]/20">
            <div className="w-20 h-20 bg-[var(--bg-surface)] rounded-full flex items-center justify-center mx-auto mb-6 border border-[var(--border-glass)]">
              <Target className="w-10 h-10 text-[var(--text-muted)]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {debouncedQuery ? 'No matches found' : 'No events yet'}
            </h3>
            <p className="text-[var(--text-muted)] max-w-md mx-auto mb-6">
              {debouncedQuery ? 'Try adjusting your search terms' : 'Start by adding your first event to stay organized'}
            </p>
            {!debouncedQuery && (
              <button
                onClick={() => { setEditingEvent(undefined); setShowCreateModal(true); }}
                className="px-6 py-2 bg-[var(--primary)] text-black font-bold rounded-xl hover:bg-[var(--primary)]/90 transition-all"
              >
                Add Your First Event
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredEvents.map((event) => (
                <motion.div
                  key={event._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`rounded-xl p-6 border transition-all duration-300 hover:shadow-lg hover:shadow-[var(--primary)]/5 group ${event.status === 'completed'
                      ? 'bg-[var(--success)]/5 border-[var(--success)]/20'
                      : 'bg-[var(--bg-surface)]/50 border-[var(--border-glass)] hover:border-[var(--primary)]/50'
                    }`}
                >
                  <div className="flex flex-col md:flex-row items-start gap-4">
                    <div className="flex-shrink-0 mt-1 p-3 bg-[var(--bg-deep)] rounded-xl border border-[var(--border-glass)]">
                      <Calendar className="w-6 h-6 text-[var(--primary)]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className={`text-xl font-bold ${event.status === 'completed' ? 'line-through text-[var(--text-muted)]' : 'text-white'}`}>
                          {event.title}
                        </h3>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getStatusColor(event.status)}`}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${event.priority === 'high' ? 'text-[var(--danger)] bg-[var(--danger)]/10 border-[var(--danger)]/20' :
                            event.priority === 'medium' ? 'text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/20' :
                              'text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/20'
                          }`}>
                          {event.priority.charAt(0).toUpperCase() + event.priority.slice(1)} Priority
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6 text-sm text-[var(--text-muted)] mt-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[var(--secondary)]" />
                          <span className="font-medium text-white">{getTimeDisplay(event)}</span>
                        </div>

                        {event.location && (
                          <div className="flex items-center gap-2">
                            {event.location.isVirtual ? <Video className="w-4 h-4 text-[var(--primary)]" /> : <MapPin className="w-4 h-4 text-[var(--primary)]" />}
                            <span>
                              {event.location.isVirtual
                                ? 'Virtual Meeting'
                                : event.location.address || 'No location specified'}
                            </span>
                          </div>
                        )}

                        {event.jobId && typeof event.jobId === 'object' && (
                          <div className="flex items-center gap-2 md:col-span-2">
                            <FileText className="w-4 h-4 text-[var(--warning)]" />
                            <span>{event.jobId.title} at <span className="text-white font-medium">{event.jobId.company}</span></span>
                          </div>
                        )}
                      </div>

                      {event.description && (
                        <p className="mt-3 text-[var(--text-muted)] text-sm line-clamp-2">{event.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                      <button
                        onClick={() => { setEditingEvent(event); setShowCreateModal(true); }}
                        className="flex-1 md:flex-none p-2 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event._id)}
                        className="flex-1 md:flex-none p-2 bg-[var(--danger)]/10 hover:bg-[var(--danger)]/20 text-[var(--danger)] border border-[var(--danger)]/20 rounded-lg transition-colors"
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
          <CreateEventModal
            isOpen={showCreateModal}
            onClose={() => { setShowCreateModal(false); setEditingEvent(undefined); }}
            onSuccess={() => { refetchData(); setEditingEvent(undefined); }}
            editingEvent={editingEvent}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default EventsPage;
