'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from 'antd';
import AppLayout from '@/components/AppLayout';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Filter, 
  Bell, 
  CheckCircle, 
  Trash2, 
  Edit, 
  PauseCircle,
  Users,
  MapPin,
  FileText,
  Tag,
  Grid,
  List
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import CreateReminderModal from '@/components/modals/CreateReminderModal';
import CreateEventModal from '@/components/modals/CreateEventModal';

const { Search } = Input;

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

const RemindersCalendarPage = () => {
  const [activeTab, setActiveTab] = useState<'reminders' | 'calendar' | 'combined'>('combined');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'calendar'>('list');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'reminder' | 'event'>('reminder');
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    priority: 'all',
    dateRange: 'all'
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch reminders
      const remindersParams = new URLSearchParams();
      if (filters.status !== 'all') remindersParams.set('status', filters.status);
      if (filters.type !== 'all') remindersParams.set('type', filters.type);
      if (filters.priority !== 'all') remindersParams.set('priority', filters.priority);
      
      const remindersResponse = await fetch(`/api/reminders?${remindersParams}`);
      if (remindersResponse.ok) {
        const remindersData = await remindersResponse.json();
        setReminders(remindersData.reminders || []);
      }
      
      // Fetch calendar events
      const eventsParams = new URLSearchParams();
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      eventsParams.set('startDate', startOfMonth.toISOString());
      eventsParams.set('endDate', endOfMonth.toISOString());
      if (filters.status !== 'all') eventsParams.set('status', filters.status);
      if (filters.type !== 'all') eventsParams.set('type', filters.type);
      
      const eventsResponse = await fetch(`/api/calendar/events?${eventsParams}`);
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData.events || []);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCompleteReminder = async (reminderId: string) => {
    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      
      if (response.ok) {
        fetchData();
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
        fetchData();
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
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedItems.length === 0) return;
    
    try {
      const response = await fetch('/api/reminders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reminderIds: selectedItems,
          updateData: action === 'snooze' ? { 
            snoozedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() 
          } : undefined
        })
      });
      
      if (response.ok) {
        setSelectedItems([]);
        fetchData();
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const filteredReminders = reminders.filter(reminder => {
    if (searchQuery && !reminder.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const filteredEvents = events.filter(event => {
    if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

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
    <AppLayout>
      <div className="p-4 md:p-8 bg-bg min-h-screen">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary" />
              Reminders & Calendar
            </h1>
            <p className="text-text-muted">Manage your job search reminders and schedule</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setCreateType('reminder');
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Reminder
            </button>
            
            <button
              onClick={() => {
                setCreateType('event');
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-success hover:bg-success/80 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </button>
          </div>
        </div>

        {/* Tabs and Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2  bg-bg-card rounded-lg p-1">
            {(['combined', 'reminders', 'calendar'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-primary text-white'
                    : 'text-dark hover:bg-bg-light'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search */}
            <Search
              placeholder="Search reminders and events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border)',
              }}
              styles={{
                input: {
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text)',
                  '::placeholder': {
                    color: 'var(--text-muted) !important',
                  }
                }
              }}
            />
            
            {/* View Mode */}
            <div className="flex items-center gap-1 bg-bg-card rounded-lg p-1">
              {(['list', 'grid', 'calendar'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === mode
                      ? 'bg-primary text-white'
                      : 'text-dark hover:bg-bg-light'
                  }`}
                >
                  {mode === 'list' && <List className="w-4 h-4" />}
                  {mode === 'grid' && <Grid className="w-4 h-4" />}
                  {mode === 'calendar' && <Calendar className="w-4 h-4" />}
                </button>
              ))}
            </div>
            
            {/* Filters */}
            <button className="p-2 bg-bg-card hover:bg-bg-light border border-border rounded-lg transition-colors">
              <Filter className="w-4 h-4 text-text" />
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="mb-6 p-4 bg-bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction('complete')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Complete
                </button>
                <button
                  onClick={() => handleBulkAction('snooze')}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Snooze
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-6">
          {/* Reminders Section */}
          {(activeTab === 'reminders' || activeTab === 'combined') && (
            <div className="bg-bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Reminders ({filteredReminders.length})
                </h2>
              </div>
              
              {filteredReminders.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-text-muted mx-auto mb-4" />
                  <p className="text-text-muted">No reminders found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredReminders.map((reminder) => (
                    <div
                      key={reminder._id}
                      className="flex items-center gap-4 p-4 bg-bg-light rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(reminder._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems([...selectedItems, reminder._id]);
                          } else {
                            setSelectedItems(selectedItems.filter(id => id !== reminder._id));
                          }
                        }}
                        className="w-4 h-4 text-primary"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-medium ${reminder.status === 'completed' ? 'line-through text-text-muted' : 'text-white'}`}>
                            {reminder.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(reminder.priority)}`}>
                            {reminder.priority}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reminder.status)}`}>
                            {reminder.status}
                          </span>
                        </div>
                        
                        {reminder.description && (
                          <p className="text-text-muted text-sm mb-2">{reminder.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-primary" />
                            {new Date(reminder.dueDate).toLocaleDateString()} at {reminder.dueTime}
                          </span>
                          
                          {reminder.jobId && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4 text-success" />
                              {reminder.jobId.title} at {reminder.jobId.company}
                            </span>
                          )}
                          
                          {reminder.tags.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-4 h-4 text-warning" />
                              {reminder.tags.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {reminder.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleCompleteReminder(reminder._id)}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Complete"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSnoozeReminder(reminder._id, new Date(Date.now() + 24 * 60 * 60 * 1000))}
                              className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
                              title="Snooze"
                            >
                              <PauseCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => {
                            setEditingReminder(reminder);
                            setCreateType('reminder');
                            setShowCreateModal(true);
                          }}
                          className="p-2 text-text-muted hover:text-primary hover:bg-bg rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteItem(reminder._id, 'reminder')}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Calendar Events Section */}
          {(activeTab === 'calendar' || activeTab === 'combined') && (
            <div className="bg-bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-success" />
                  Calendar Events ({filteredEvents.length})
                </h2>
              </div>
              
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-text-muted mx-auto mb-4" />
                  <p className="text-text-muted">No events found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEvents.map((event) => (
                    <div
                      key={event._id}
                      className="flex items-center gap-4 p-4 bg-bg-light rounded-lg border border-border hover:border-success/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-white">{event.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(event.priority)}`}>
                            {event.priority}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                            {event.status}
                          </span>
                        </div>
                        
                        {event.description && (
                          <p className="text-text-muted text-sm mb-2">{event.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-primary" />
                            {new Date(event.startDate).toLocaleDateString()} {new Date(event.startDate).toLocaleTimeString()}
                          </span>
                          
                          {event.location?.address && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-warning" />
                              {event.location.address}
                            </span>
                          )}
                          
                          {event.attendees.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4 text-info" />
                              {event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}
                            </span>
                          )}
                          
                          {event.jobId && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4 text-success" />
                              {event.jobId.title} at {event.jobId.company}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingEvent(event);
                            setCreateType('event');
                            setShowCreateModal(true);
                          }}
                          className="p-2 text-text-muted hover:text-success hover:bg-bg rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteItem(event._id, 'event')}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        {showCreateModal && createType === 'reminder' && (
          <CreateReminderModal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              setEditingReminder(null);
            }}
            onSuccess={() => {
              fetchData();
              setEditingReminder(null);
            }}
            editingReminder={editingReminder}
          />
        )}

        {showCreateModal && createType === 'event' && (
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
    </AppLayout>
  );
};

export default RemindersCalendarPage;