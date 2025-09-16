'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as AntCalendar, Input, Pagination, Tooltip, Tag } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
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
import DayViewModal from './DayViewModal';

const { Search: AntSearch } = Input;

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [showDayViewModal, setShowDayViewModal] = useState(false);
  const [dayViewItems, setDayViewItems] = useState<CalendarItem[]>([]);
  const [dayViewDate, setDayViewDate] = useState<Dayjs | null>(null);
  const itemsPerPage = 20;

  const fetchData = useCallback(async (page = 1) => {
    try {
      setLoading(true);

      // Fetch reminders with pagination
      const remindersResponse = await fetch(`/api/reminders?page=${page}&limit=${itemsPerPage}`);
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
        setTotalPages(remindersData.pagination.pages || 1);
      }

      // Fetch calendar events (no pagination assumed)
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
  }, [itemsPerPage]);

  useEffect(() => {
    fetchData(currentPage);
  }, [fetchData, currentPage]);

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
  const itemsByDate = filteredItems.reduce<Record<string, CalendarItem[]>>((acc, item) => {
    const dateStr = item.date.format('YYYY-MM-DD');
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(item);
    return acc;
  }, {});

  // Render items in calendar date cell
  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const items = itemsByDate[dateStr] || [];

    const reminderCount = items.filter(item => item.type === 'reminder').length;
    const eventCount = items.filter(item => item.type === 'event').length;

    const handleEditItem = (item: CalendarItem) => {
      if (item.type === 'reminder') {
        setEditingReminder(item);
        setCreateType('reminder');
      } else {
        setEditingEvent(item);
        setCreateType('event');
      }
      setShowCreateModal(true);
    };

    return (
      <div className="calendar-date-cell cursor-pointer" onClick={() => {
        setSelectedDate(value);
        setDayViewItems(items);
        setDayViewDate(value);
        setShowDayViewModal(true);
      }}>
        <ul>
          {reminderCount > 0 && (
            <li className="cursor-pointer" onClick={(e) => {
              e.stopPropagation();
              setSelectedDate(value);
              setDayViewItems(items.filter(item => item.type === 'reminder'));
              setDayViewDate(value);
              setShowDayViewModal(true);
            }}>
              <Tag color="orange" className="text-xs font-medium">
                {reminderCount} reminder{reminderCount > 1 ? 's' : ''}
              </Tag>
            </li>
          )}
          {eventCount > 0 && (
            <li className="cursor-pointer" onClick={(e) => {
              e.stopPropagation();
              setSelectedDate(value);
              setDayViewItems(items.filter(item => item.type === 'event'));
              setDayViewDate(value);
              setShowDayViewModal(true);
            }}>
              <Tag color="blue" className="text-xs font-medium">
                {eventCount} event{eventCount > 1 ? 's' : ''}
              </Tag>
            </li>
          )}
        </ul>
      </div>
    );
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
        {/* Header */}
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

        {/* Search and Filters */}
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

        {/* Calendar */}
        <div className="max-w-4xl mx-auto">
          <AntCalendar
            dateCellRender={dateCellRender}
            fullscreen={false}
            headerRender={({ value, onChange }) => {
              const current = value.clone();
              // dayjs does not have localeData, so use Intl API for month names
              const month = current.month();
              const year = current.year();

              const monthNames = Array.from({ length: 12 }, (_, i) =>
                new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(year, i))
              );

              return (
                <div style={{ padding: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <select
                    value={month}
                    onChange={e => {
                      const newMonth = parseInt(e.target.value, 10);
                      const newValue = value.clone().month(newMonth);
                      onChange(newValue);
                    }}
                  >
                    {monthNames.map((name, i) => (
                      <option key={i} value={i}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }}
            onSelect={(date) => {
              setSelectedDate(date);
              const dateStr = date.format('YYYY-MM-DD');
              const items = itemsByDate[dateStr] || [];
              setDayViewItems(items);
              setDayViewDate(date);
              setShowDayViewModal(true);
              return null;
            }}
            className="rounded-xl shadow-lg"
          />
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-center mt-8">
          <Pagination
            current={currentPage}
            total={totalPages * itemsPerPage}
            pageSize={itemsPerPage}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
            showQuickJumper
            className="bg-bg-card rounded-lg p-4"
            disabled={totalPages <= 1}
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
        {showDayViewModal && dayViewDate && dayViewItems && (
          <DayViewModal
            isOpen={showDayViewModal}
            onClose={() => setShowDayViewModal(false)}
            date={dayViewDate}
            items={dayViewItems}
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
