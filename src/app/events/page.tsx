'use client';

import React, { useState, useEffect } from 'react';
import { Input, Pagination } from 'antd';
import AppLayout from '@/components/AppLayout';
import {
  Calendar,
  Clock,
  Edit,
  Search,
  Target,
  Zap,
  FileText
} from 'lucide-react';
import { RiDeleteBin6Line } from 'react-icons/ri';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EventsSkeleton from '@/components/ui/EventsSkeleton';
import CreateEventModal from '@/components/modals/CreateEventModal';
const { Search: AntSearch } = Input;

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

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch data from backend on page load, search, page change, or refreshCounter change
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
      } catch (error: unknown) {
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
    // Increment refreshCounter to trigger fetch useEffect
    setRefreshCounter(prev => prev + 1);
  };

  // Add an effect to listen for the refetch event
  useEffect(() => {
    const refetchDataListener = () => {
      refetchData();
    };
    window.addEventListener('refetchEvents', refetchDataListener);
    return () => {
      window.removeEventListener('refetchEvents', refetchDataListener);
    };
  }, []);

  const handleDeleteEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/calendar/events/${id}`, { method: 'DELETE' });
      if (response.ok) {
        // Dispatch event to trigger refetch
        const event = new Event('refetchEvents');
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
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
      case 'completed': return 'text-white bg-green-600';
      case 'pending': return 'text-white bg-blue-600';
      case 'snoozed': return 'text-white bg-yellow-600';
      case 'cancelled': return 'text-white bg-red-600';
      case 'scheduled': return 'text-white bg-blue-600';
      case 'confirmed': return 'text-white bg-green-600';
      default: return 'text-white bg-gray-600';
    }
  };

  return (
    <AppLayout showFooter={false}>
      <div className="p-8 bg-bg min-h-screen">
        {/* Header and Search/Filter controls are now always visible */}
        <div className="text-center mb-8 mt-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-600/20 to-blue-600/10 rounded-xl border border-blue-600/30">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                My Events
              </h1>
            </div>
            <p className="text-text-muted text-lg max-w-2xl mx-auto">
              Manage your job search events and important deadlines
            </p>
        </div>
        <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => { setEditingEvent(undefined); setShowCreateModal(true); }}
              className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <Calendar className="w-5 h-5" /> Add Event
            </button>
        </div>
        <div className="max-w-4xl mx-auto mb-8">
            <div className="filter-panel rounded-xl p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                  <AntSearch
                    placeholder="Search your events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="large"
                    allowClear
                    enterButton={<Search className="w-5 h-5" />}
                    className="max-w-full rounded-lg"
                  />
                </div>
                <div className="flex gap-2">
                  {[ { key: 'all', label: 'All', icon: Target }, { key: 'today', label: 'Today', icon: Zap }, { key: 'upcoming', label: 'Upcoming', icon: Clock }, { key: 'overdue', label: 'Overdue', icon: Calendar } ]
                  .map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setActiveFilter(key as 'all' | 'today' | 'upcoming' | 'overdue')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${activeFilter === key ? 'bg-blue-600 text-white shadow-lg' : 'bg-bg-light hover:bg-bg-card text-text-secondary hover:text-white'}`}>
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
        </div>
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
                All Events ({filteredEvents.length})
            </h2>
            {debouncedQuery && <span className="text-text-muted text-sm">Searching for &quot;{debouncedQuery}&quot;</span>}
          </div>
        </div>

        {/* This section now handles the loading, empty, and data states */}
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <EventsSkeleton count={5} />
           ) : filteredEvents.length === 0 ? (
            <div className="text-center py-20">
               <div className="w-24 h-24 bg-gradient-to-br from-blue-600/20 to-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-600/30">
                 <Target className="w-12 h-12 text-blue-600" />
               </div>
               <h3 className="text-2xl font-bold text-white mb-4">
                 {debouncedQuery ? 'No matches found' : 'No events yet'}
               </h3>
               <p className="text-text-muted text-lg max-w-md mx-auto leading-relaxed mb-6">
                 {debouncedQuery ? 'Try adjusting your search terms' : 'Start by adding your first event to stay organized'}
               </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div key={event._id}
                  className={`bg-gradient-to-r from-bg-card to-bg-card/80 backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${event.status === 'completed' ? 'border-green-500/30 bg-green-500/5' : 'border-border hover:border-blue-600/50'}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1"><Calendar className="w-5 h-5 text-blue-600" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-lg font-semibold ${event.status === 'completed' ? 'line-through text-text-muted' : 'text-white'}`}>{event.title}</h3>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusColor(event.status)}`}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-text-muted mt-2">
                        <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600" /><span className="font-medium">{getTimeDisplay(event)}</span></div>
                        {event.jobId && typeof event.jobId === 'object' && <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" /><span>{event.jobId.title} at {event.jobId.company}</span></div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingEvent(event); setShowCreateModal(true); }}
                        className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 rounded-lg transition-all duration-200 hover:scale-105" title="Edit">
                        <Edit className="w-5 h-5" /><span className="sr-only">Edit</span>
                      </button>
                      <button onClick={() => handleDeleteEvent(event._id)}
                        className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white border border-red-700 rounded-lg transition-all duration-200 hover:scale-105" title="Delete">
                        <RiDeleteBin6Line className="w-5 h-5" /><span className="sr-only">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Conditional Pagination */}
          {total > 0 && (
            <div className="flex justify-center mt-8">
              <Pagination
                current={currentPage}
                total={total}
                pageSize={itemsPerPage}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
                showQuickJumper
                className="rounded-lg p-4"
                style={{ display: 'block' }}
              />
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
      </div>
    </AppLayout>
  );
};

export default EventsPage;
