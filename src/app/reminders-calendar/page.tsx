'use client';

import React, { useState, useEffect, useCallback } from 'react';
import WeekGantt from '@/components/ui/WeekGantt';
import dayjs, { Dayjs } from 'dayjs';
import AppLayout from '@/components/AppLayout';
import Button from '@/components/ui/Button';
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
  Target,
  X,
  Filter
} from 'lucide-react';
import { RiDeleteBin6Line } from 'react-icons/ri';
import CalendarSkeleton from '@/components/ui/CalendarSkeleton';
import CreateReminderModal from '@/components/modals/CreateReminderModal';
import CreateEventModal from '@/components/modals/CreateEventModal';
import DayViewModal from './DayViewModal';

interface ReminderResponse {
  _id: string;
  title: string;
  dueDate: string;
  dueTime: string;
  status: string;
  color: string;
  priority: string;
  description?: string;
  jobId?: {
    title: string;
    company: string;
  };
}

interface EventResponse {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  status: string;
  color: string;
  priority: string;
  description?: string;
  location?: {
    address: string;
  };
  attendees?: unknown[];
  jobId?: {
    title: string;
    company: string;
  };
}

interface CalendarItem {
  id: string;
  title: string;
  date: Dayjs;
  type: 'event' | 'reminder';
  status?: string;
  time?: string;
  color?: string;
  priority?: string;
  description?: string;
  location?: string;
  attendeesCount?: number;
  jobTitle?: string;
  jobCompany?: string;
}

const RemindersCalendarPage = () => {
  const [reminders, setReminders] = useState<CalendarItem[]>([]);
  const [events, setEvents] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'reminder' | 'event'>('reminder');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingReminder, setEditingReminder] = useState<CalendarItem | undefined>(undefined);
  const [editingEvent, setEditingEvent] = useState<CalendarItem | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [showDayViewModal, setShowDayViewModal] = useState(false);
  const [dayViewItems, setDayViewItems] = useState<CalendarItem[]>([]);
  const [dayViewDate, setDayViewDate] = useState<Dayjs | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch reminders
      const remindersResponse = await fetch('/api/reminders?page=1&limit=500');
      if (remindersResponse.ok) {
        const remindersData = await remindersResponse.json();
        const mappedReminders: CalendarItem[] = (remindersData.reminders || []).map((r: unknown) => {
          const rem = r as ReminderResponse;
          return {
            id: rem._id,
            title: rem.title,
            date: dayjs(rem.dueDate),
            type: 'reminder' as const,
            status: rem.status,
            time: rem.dueTime,
            color: rem.color,
            priority: rem.priority,
            description: rem.description,
            jobTitle: rem.jobId?.title,
            jobCompany: rem.jobId?.company
          };
        });
        setReminders(mappedReminders);
      }

      // Fetch calendar events
      const eventsResponse = await fetch('/api/calendar/events');
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        const mappedEvents: CalendarItem[] = (eventsData.events || []).map((e: unknown) => {
          const ev = e as EventResponse;
          return {
            id: ev._id,
            title: ev.title,
            date: dayjs(ev.startDate),
            type: 'event' as const,
            status: ev.status,
            time: ev.isAllDay ? 'All day' : dayjs(ev.startDate).format('h:mm A') + ' - ' + dayjs(ev.endDate).format('h:mm A'),
            color: ev.color,
            priority: ev.priority,
            description: ev.description,
            location: ev.location?.address,
            attendeesCount: ev.attendees?.length,
            jobTitle: ev.jobId?.title,
            jobCompany: ev.jobId?.company
          };
        });
        setEvents(mappedEvents);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Combine and filter items based on active filter and search
  const getFilteredItems = (): CalendarItem[] => {
    const allItems = [...reminders, ...events];

    let filtered = allItems;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply date filter
    const now = dayjs().startOf('day');
    const tomorrow = dayjs(now).add(1, 'day');

    switch (activeFilter) {
      case 'today':
        filtered = filtered.filter(item => {
          const itemDate = item.date.clone().startOf('day');
          return itemDate.isSame(now);
        });
        break;
      case 'upcoming':
        filtered = filtered.filter(item => {
          const itemDate = item.date.clone().startOf('day');
          return itemDate.isAfter(tomorrow);
        });
        break;
      case 'overdue':
        filtered = filtered.filter(item => {
          const itemDate = item.date.clone().startOf('day');
          return itemDate.isBefore(now) && item.status !== 'completed';
        });
        break;
    }

    return filtered.sort((a, b) => a.date.valueOf() - b.date.valueOf());
  };

  const filteredItems = getFilteredItems();

  // Group items by date string for calendar rendering
  // Week start (Monday) for the Gantt view
  const weekStart = (() => {
    const day = selectedDate.day();
    const diff = day === 0 ? 6 : day - 1;
    return selectedDate.startOf('day').subtract(diff, 'day');
  })();

  if (loading) {
    return (
      <AppLayout showFooter={false}>
        <div className="p-6 lg:p-8 bg-[var(--bg-deep)] min-h-screen">
          <CalendarSkeleton />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showFooter={false}>
      <div className="p-6 lg:p-8 bg-[var(--bg-deep)] min-h-screen">
        {/* Header (compact, like application-tracking) */}
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-main)] flex items-center gap-3">
              <div className="p-2 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)]">
                <Target className="w-8 h-8 text-[var(--primary)]" />
              </div>
              My Schedule
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setCreateType('reminder');
                setEditingReminder(undefined);
                setShowCreateModal(true);
              }}
              leftIcon={<Bell className="w-5 h-5" />}
              className="px-5 py-2.5"
            >
              Add Reminder
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setCreateType('event');
                setEditingEvent(undefined);
                setShowCreateModal(true);
              }}
              leftIcon={<Calendar className="w-5 h-5" />}
              className="px-5 py-2.5"
            >
              Add Event
            </Button>
          </div>
        </div>

        {/* Search and Filters (same UI as the Jobs Agent / job-search page) */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)]">
            <div className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 flex items-center bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg transition-colors">
                  <Search className="ml-3 w-4 h-4 text-[var(--text-muted)] flex-shrink-0 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search your reminders and events..."
                    className="w-full h-8 pl-2 pr-8 bg-transparent border-none outline-none text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                  />
                  {searchQuery && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 w-7 h-7 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setShowFilters(v => !v)}
                  className="shrink-0 h-8 px-4 rounded-lg flex items-center justify-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  <span>{showFilters ? 'Hide filters' : 'Filters'}</span>
                </Button>
              </div>

              {showFilters && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-3 border-t border-[var(--border)]">
                  {[
                    { key: 'all', label: 'All', icon: Target },
                    { key: 'today', label: 'Today', icon: Zap },
                    { key: 'upcoming', label: 'Upcoming', icon: Clock },
                    { key: 'overdue', label: 'Overdue', icon: Bell }
                  ].map(({ key, label, icon: Icon }) => (
                    <Button
                      key={key}
                      type="button"
                      variant={activeFilter === key ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveFilter(key as 'all' | 'today' | 'upcoming' | 'overdue')}
                      leftIcon={<Icon className="w-4 h-4" />}
                      className="px-3 py-1.5 rounded-lg justify-start"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Week Gantt / Schedule view */}
        <div className="max-w-6xl mx-auto">
          <WeekGantt
            items={filteredItems}
            weekStart={weekStart}
            onNavigate={(weeks) => setSelectedDate((d) => d.add(weeks, 'week'))}
            onToday={() => setSelectedDate(dayjs())}
            onOpenDay={(items, date) => {
              setSelectedDate(date);
              setDayViewItems(items as CalendarItem[]);
              setDayViewDate(date);
              setShowDayViewModal(true);
            }}
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            editingReminder={editingReminder as any}
            defaultDate={selectedDate.format('YYYY-MM-DD')}
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            editingEvent={editingEvent as any}
            defaultStartDate={selectedDate}
            defaultEndDate={selectedDate.add(1, 'hour')}
          />
        )}

        {/* Day View Modal */}
        {showDayViewModal && dayViewDate && (
          <DayViewModal
            isOpen={showDayViewModal}
            onClose={() => setShowDayViewModal(false)}
            date={dayViewDate}
            items={dayViewItems}
            onAddNew={(type) => {
              setCreateType(type);
              if (type === 'reminder') {
                setEditingReminder(undefined);
              } else {
                setEditingEvent(undefined);
              }
              setShowCreateModal(true);
              setShowDayViewModal(false);
            }}
            onEditItem={(item) => {
              if (item.type === 'reminder') {
                setEditingReminder(item);
                setCreateType('reminder');
              } else {
                setEditingEvent(item);
                setCreateType('event');
              }
              setShowCreateModal(true);
              setShowDayViewModal(false);
            }}
            onRefresh={() => fetchData()}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default RemindersCalendarPage;
