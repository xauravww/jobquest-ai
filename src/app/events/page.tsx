'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input, Pagination } from 'antd';
import AppLayout from '@/components/AppLayout';
import {
  Calendar,
  Clock,
  Edit,
  Trash2,
  Search,
  Target,
  Zap,
  FileText,
  MapPin,
  Users
} from 'lucide-react';
import { RiDeleteBin6Line } from 'react-icons/ri';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
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
    address?: string;
    isVirtual?: boolean;
    meetingLink?: string;
  };
  attendees: Array<{
    name: string;
    email: string;
    role: string;
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
}

const EventsPage = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue'>('all');

  const fetchData = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/calendar/events?page=${page}&limit=${itemsPerPage}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  useEffect(() => {
    fetchData(currentPage);
  }, [fetchData, currentPage]);

  const handleDeleteEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/calendar/events/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchData(currentPage);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  // Filter events based on active filter and search
  const getFilteredEvents = () => {
    let filtered = events;

    if (searchQuery) {
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    switch (activeFilter) {
      case 'today':
        filtered = filtered.filter(e => {
          const itemDate = new Date(e.startDate);
          return itemDate >= today && itemDate < tomorrow;
        });
        break;
      case 'upcoming':
        filtered = filtered.filter(e => {
          const itemDate = new Date(e.startDate);
          return itemDate >= tomorrow;
        });
        break;
      case 'overdue':
        filtered = filtered.filter(e => {
          const itemDate = new Date(e.startDate);
          return itemDate < today && e.status !== 'completed';
        });
        break;
    }

    return filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  };

  const filteredEvents = getFilteredEvents();

  const getTimeDisplay = (event: CalendarEvent) => {
    const date = new Date(event.startDate);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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
            <p className="text-text-muted">Loading events...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showFooter={false}>
      <div className="p-8 bg-bg min-h-screen">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600/20 to-blue-600/10 rounded-xl border border-blue-600/30">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              My Events
            </h1>
          </div>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Manage your job search events and important dates
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => {
              setEditingEvent(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <Calendar className="w-5 h-5" />
            Add Event
          </button>
        </div>

        {/* Search and Filters */}
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
                  style={{ maxWidth: '100%' }}
                />
              </div>
              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'All', icon: Target },
                  { key: 'today', label: 'Today', icon: Zap },
                  { key: 'upcoming', label: 'Upcoming', icon: Clock },
                  { key: 'overdue', label: 'Overdue', icon: Calendar }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key as 'all' | 'today' | 'upcoming' | 'overdue')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${activeFilter === key
                      ? 'bg-blue-600 text-white shadow-lg'
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
              {activeFilter === 'all' && `All Events (${filteredEvents.length})`}
              {activeFilter === 'today' && `Today (${filteredEvents.length})`}
              {activeFilter === 'upcoming' && `Upcoming (${filteredEvents.length})`}
              {activeFilter === 'overdue' && `Overdue (${filteredEvents.length})`}
            </h2>
            {searchQuery && (
              <span className="text-text-muted text-sm">
                Searching for "{searchQuery}"
              </span>
            )}
          </div>
        </div>

        {/* Events List */}
        <div className="max-w-4xl mx-auto">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600/20 to-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-600/30">
                {activeFilter === 'overdue' ? (
                  <Calendar className="w-12 h-12 text-blue-600" />
                ) : (
                  <Target className="w-12 h-12 text-blue-600" />
                )}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                {searchQuery ? 'No matches found' :
                  activeFilter === 'today' ? 'Nothing scheduled for today' :
                    activeFilter === 'upcoming' ? 'No upcoming items' :
                      activeFilter === 'overdue' ? 'No overdue items' :
                        'No events yet'}
              </h3>
              <p className="text-text-muted text-lg max-w-md mx-auto leading-relaxed mb-6">
                {searchQuery ? 'Try adjusting your search terms' :
                  'Start by adding your first event to stay organized'}
              </p>
              {!searchQuery && (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => {
                      setEditingEvent(null);
                      setShowCreateModal(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    <Calendar className="w-4 h-4" />
                    Add Event
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div
                  key={event._id}
                  className={`bg-gradient-to-r from-bg-card to-bg-card/80 backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${event.status === 'completed' ? 'border-green-500/30 bg-green-500/5' :
                    activeFilter === 'overdue' && new Date(event.startDate) < new Date() ? 'border-red-500/50 bg-red-500/10' :
                      'border-border hover:border-blue-600/50'
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-lg font-semibold ${event.status === 'completed' ? 'line-through text-text-muted' : 'text-white'
                          }`}>
                          {event.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(event.priority)}`}>
                          {event.priority}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                      </div>

                      {event.description && (
                        <p className="text-text-muted mb-3 leading-relaxed">{event.description}</p>
                      )}

                      <div className="flex items-center gap-6 text-sm text-text-muted">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{getTimeDisplay(event)}</span>
                        </div>

                        {event.jobId && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span>{event.jobId.title} at {event.jobId.company}</span>
                          </div>
                        )}

                        {'location' in event && event.location?.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-400" />
                            <span>{event.location.address}</span>
                          </div>
                        )}

                        {'attendees' in event && event.attendees && event.attendees.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-400" />
                            <span>{event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingEvent(event);
                          setShowCreateModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 rounded-lg transition-all duration-200 hover:scale-105"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                        <span className="sr-only">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event._id)}
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
          {showCreateModal && (
            <CreateEventModal
              isOpen={showCreateModal}
              onClose={() => {
                setShowCreateModal(false);
                setEditingEvent(null);
              }}
              onSuccess={() => {
                fetchData();
                setEditingEvent(null);
              }}
              editingEvent={editingEvent}
            />
          )}
      </div>
      </div>
    </AppLayout>
  );
};

export default EventsPage;
