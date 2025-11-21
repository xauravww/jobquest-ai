'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import {
  Calendar as CalendarIcon,
  Clock,
  Bell,
  Users,
  Target,
  Plus,
  Filter,
  Video,
  AlertCircle,
  TrendingUp,
  CheckCircle,
  Trash2,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  MoreHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/ui/Modal';

// --- Types ---
interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  date: Dayjs;
  type: 'reminder' | 'event' | 'follow_up' | 'interview' | 'deadline';
  status: 'pending' | 'completed' | 'cancelled' | 'snoozed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  time?: string;
  endTime?: string;
  color?: string;
  location?: string;
  attendees?: Array<{
    name: string;
    email: string;
    role: string;
  }>;
  jobId?: {
    _id: string;
    title: string;
    company: string;
  };
  applicationId?: string;
  tags: string[];
  isAllDay?: boolean;
  meetingLink?: string;
  notes?: string;
}

interface ActivityHubProps {
  className?: string;
}

// --- Components ---

const ActivityCard = ({ activity, onClick, onDelete, onComplete }: { activity: ActivityItem; onClick: () => void; onDelete: (e: any) => void; onComplete: (e: any) => void }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reminder': return <Bell className="w-4 h-4" />;
      case 'event': return <CalendarIcon className="w-4 h-4" />;
      case 'interview': return <Video className="w-4 h-4" />;
      case 'follow_up': return <Users className="w-4 h-4" />;
      case 'deadline': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reminder': return 'text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/20';
      case 'interview': return 'text-[var(--danger)] bg-[var(--danger)]/10 border-[var(--danger)]/20';
      case 'event': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'follow_up': return 'text-[var(--secondary)] bg-[var(--secondary)]/10 border-[var(--secondary)]/20';
      default: return 'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/20';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onClick}
      className="group relative bg-[var(--bg-surface)]/50 border border-[var(--border-glass)] hover:border-[var(--primary)]/30 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:shadow-[var(--primary)]/5 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-lg border ${getTypeColor(activity.type)}`}>
            {getTypeIcon(activity.type)}
          </div>
          <div>
            <h4 className="font-semibold text-white group-hover:text-[var(--primary)] transition-colors line-clamp-1">{activity.title}</h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                {activity.date.format('MMM D, YYYY')}
              </span>
              {activity.time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {activity.time}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {activity.status !== 'completed' && (
            <button
              onClick={(e) => { e.stopPropagation(); onComplete(activity); }}
              className="p-2 hover:bg-[var(--success)]/20 text-[var(--text-muted)] hover:text-[var(--success)] rounded-lg transition-colors"
              title="Mark as completed"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(activity); }}
            className="p-2 hover:bg-[var(--danger)]/20 text-[var(--text-muted)] hover:text-[var(--danger)] rounded-lg transition-colors"
            title="Delete activity"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activity.status === 'completed' && (
        <div className="absolute top-2 right-2">
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--success)] bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-full">
            Completed
          </span>
        </div>
      )}
    </motion.div>
  );
};

const CustomCalendar = ({ activities, onDateSelect, selectedDate }: { activities: ActivityItem[], onDateSelect: (date: Dayjs) => void, selectedDate: Dayjs }) => {
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  const daysInMonth = currentMonth.daysInMonth();
  const firstDayOfMonth = currentMonth.startOf('month').day();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const getActivitiesForDate = (day: number) => {
    const date = currentMonth.date(day);
    return activities.filter(a => a.date.isSame(date, 'day'));
  };

  return (
    <div className="bg-[var(--bg-surface)]/30 border border-[var(--border-glass)] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">{currentMonth.format('MMMM YYYY')}</h3>
        <div className="flex gap-2">
          <button onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))} className="p-2 hover:bg-[var(--bg-surface)] rounded-lg text-[var(--text-muted)] hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))} className="p-2 hover:bg-[var(--bg-surface)] rounded-lg text-[var(--text-muted)] hover:text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider py-2">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {blanks.map(i => <div key={`blank-${i}`} className="h-24 rounded-xl bg-transparent" />)}
        {days.map(day => {
          const date = currentMonth.date(day);
          const dayActivities = getActivitiesForDate(day);
          const isSelected = selectedDate.isSame(date, 'day');
          const isToday = date.isSame(dayjs(), 'day');

          return (
            <div
              key={day}
              onClick={() => onDateSelect(date)}
              className={`h-24 rounded-xl border p-2 cursor-pointer transition-all hover:border-[var(--primary)]/50 flex flex-col gap-1 overflow-hidden ${isSelected ? 'bg-[var(--primary)]/10 border-[var(--primary)]' :
                isToday ? 'bg-[var(--bg-surface)] border-[var(--primary)]/30' : 'bg-[var(--bg-surface)]/50 border-[var(--border-glass)]'
                }`}
            >
              <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-[var(--primary)] text-black' : 'text-[var(--text-muted)]'}`}>
                {day}
              </span>
              <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                {dayActivities.map(activity => (
                  <div key={activity.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate ${activity.type === 'interview' ? 'bg-[var(--danger)]/20 text-[var(--danger)]' :
                    activity.type === 'reminder' ? 'bg-[var(--warning)]/20 text-[var(--warning)]' :
                      'bg-[var(--primary)]/20 text-[var(--primary)]'
                    }`}>
                    {activity.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Main Component ---

const ActivityHub: React.FC<ActivityHubProps> = ({ className = '' }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [activityForm, setActivityForm] = useState({
    type: 'reminder',
    title: '',
    description: '',
    date: dayjs().format('YYYY-MM-DD'),
    time: '09:00',
    priority: 'medium'
  });

  const handleCreateActivity = async () => {
    try {
      if (!activityForm.title.trim()) {
        toast.error('Title is required');
        return;
      }

      let endpoint = '';
      let payload: any = {
        title: activityForm.title,
        description: activityForm.description,
        priority: activityForm.priority,
        tags: []
      };

      if (activityForm.type === 'reminder') {
        endpoint = '/api/reminders';
        payload = {
          ...payload,
          dueDate: new Date(activityForm.date).toISOString(),
          dueTime: activityForm.time,
          type: 'custom',
          status: 'pending'
        };
      } else {
        endpoint = '/api/calendar/events';
        const startDate = dayjs(`${activityForm.date}T${activityForm.time}`);
        payload = {
          ...payload,
          startDate: startDate.toISOString(),
          endDate: startDate.add(1, 'hour').toISOString(),
          type: activityForm.type,
          status: 'scheduled',
          isAllDay: false
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success('Activity created successfully');
        setShowCreateModal(false);
        fetchActivities();
        setActivityForm({
          type: 'reminder',
          title: '',
          description: '',
          date: dayjs().format('YYYY-MM-DD'),
          time: '09:00',
          priority: 'medium'
        });
      } else {
        toast.error('Failed to create activity');
      }
    } catch (error) {
      toast.error('Failed to create activity');
    }
  };

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch reminders
      const remindersResponse = await fetch('/api/reminders');
      const remindersData = await remindersResponse.json();

      // Fetch events
      const eventsResponse = await fetch('/api/calendar/events');
      const eventsData = await eventsResponse.json();

      // Transform and combine data
      const reminderActivities: ActivityItem[] = (remindersData.reminders || []).map((r: any) => ({
        id: r._id,
        title: r.title,
        description: r.description,
        date: dayjs(r.dueDate),
        type: 'reminder' as const,
        status: r.status,
        priority: r.priority,
        time: r.dueTime,
        color: r.color || '#f59e0b',
        jobId: r.jobId,
        applicationId: r.applicationId,
        tags: r.tags || [],
        notes: r.description
      }));

      const eventActivities: ActivityItem[] = (eventsData.events || []).map((e: any) => ({
        id: e._id,
        title: e.title,
        description: e.description,
        date: dayjs(e.startDate),
        type: e.type === 'interview' ? 'interview' : 'event' as const,
        status: e.status === 'scheduled' ? 'pending' : e.status,
        priority: e.priority || 'medium',
        time: e.isAllDay ? 'All day' : dayjs(e.startDate).format('HH:mm'),
        endTime: e.isAllDay ? undefined : dayjs(e.endDate).format('HH:mm'),
        color: e.color || '#3b82f6',
        location: e.location?.address,
        attendees: e.attendees,
        jobId: e.jobId,
        applicationId: e.applicationId,
        tags: e.tags || [],
        isAllDay: e.isAllDay,
        meetingLink: e.location?.meetingLink,
        notes: e.description
      }));

      const allActivities = [...reminderActivities, ...eventActivities];
      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleDeleteActivity = async (activity: ActivityItem) => {
    try {
      const endpoint = activity.type === 'reminder' ? '/api/reminders' : '/api/calendar/events';
      const response = await fetch(`${endpoint}?id=${activity.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setActivities(prev => prev.filter(a => a.id !== activity.id));
        toast.success('Activity deleted successfully');
      } else {
        toast.error('Failed to delete activity');
      }
    } catch (error) {
      toast.error('Failed to delete activity');
    }
  };

  const handleCompleteActivity = async (activity: ActivityItem) => {
    try {
      const endpoint = activity.type === 'reminder' ? '/api/reminders' : '/api/calendar/events';
      const response = await fetch(`${endpoint}?id=${activity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });

      if (response.ok) {
        setActivities(prev => prev.map(a =>
          a.id === activity.id
            ? { ...a, status: 'completed' as const }
            : a
        ));
        toast.success('Activity marked as completed');
      } else {
        toast.error('Failed to update activity');
      }
    } catch (error) {
      toast.error('Failed to update activity');
    }
  };

  // Filter logic
  const filteredActivities = activities.filter(activity => {
    if (filterType !== 'all' && activity.type !== filterType) return false;
    if (searchQuery && !activity.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => a.date.valueOf() - b.date.valueOf());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_var(--primary-glow)]"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-[var(--primary)]/20 rounded-xl border border-[var(--primary)]/30">
              <TrendingUp className="w-6 h-6 text-[var(--primary)]" />
            </div>
            Activity Hub
          </h2>
          <p className="text-[var(--text-muted)] mt-1 ml-14">Manage your schedule and tasks</p>
        </div>

        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold rounded-xl shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Activity</span>
          </button>

          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl text-white placeholder-[var(--text-dim)] focus:border-[var(--primary)] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-glass)]">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-[var(--primary)] text-black shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'calendar' ? 'bg-[var(--primary)] text-black shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'reminder', 'interview', 'event', 'follow_up'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${filterType === type
              ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)] shadow-[0_0_10px_var(--primary-glow)]'
              : 'bg-[var(--bg-surface)] border-[var(--border-glass)] text-[var(--text-muted)] hover:border-[var(--primary)]/50 hover:text-white'
              }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredActivities.length > 0 ? (
              filteredActivities.map(activity => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onClick={() => { }}
                  onDelete={handleDeleteActivity}
                  onComplete={handleCompleteActivity}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 border border-dashed border-[var(--border-glass)] rounded-2xl">
                <div className="w-16 h-16 bg-[var(--bg-surface)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-8 h-8 text-[var(--text-muted)]" />
                </div>
                <p className="text-[var(--text-muted)]">No activities found matching your filters.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CustomCalendar
              activities={activities}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Activity"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Type</label>
            <select
              value={activityForm.type}
              onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
            >
              <option value="reminder">Reminder</option>
              <option value="interview">Interview</option>
              <option value="event">Event</option>
              <option value="follow_up">Follow-up</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Title</label>
            <input
              type="text"
              value={activityForm.title}
              onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
              placeholder="e.g., Follow up with Google"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Date</label>
              <input
                type="date"
                value={activityForm.date}
                onChange={(e) => setActivityForm({ ...activityForm, date: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Time</label>
              <input
                type="time"
                value={activityForm.time}
                onChange={(e) => setActivityForm({ ...activityForm, time: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Description</label>
            <textarea
              value={activityForm.description}
              onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none h-24 resize-none"
              placeholder="Add details..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Priority</label>
            <select
              value={activityForm.priority}
              onChange={(e) => setActivityForm({ ...activityForm, priority: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-muted)] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateActivity}
              className="px-4 py-2 rounded-xl bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary)]/90 transition-colors"
            >
              Create Activity
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ActivityHub;
