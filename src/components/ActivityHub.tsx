'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as AntCalendar, Input, Select, Tag, Button, Modal, DatePicker, TimePicker, Pagination } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import {
  Calendar,
  Clock,
  Bell,
  Edit,
  Users,
  MapPin,
  FileText,
  Target,
  Plus,
  Filter,
  MoreHorizontal,
  Phone,
  Video,
  AlertCircle,
  TrendingUp,
  CheckCircle,
  Trash2
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ActivitySkeleton from '@/components/ui/ActivitySkeleton';
import toast from 'react-hot-toast';

const { Search: AntSearch } = Input;
const { Option } = Select;

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
  followUpHistory?: Array<{
    date: string;
    type: string;
    notes: string;
  }>;
}

interface ActivityHubProps {
  className?: string;
}

const ActivityHub: React.FC<ActivityHubProps> = ({ className = '' }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Form state for creating activities
  const [activityForm, setActivityForm] = useState({
    type: 'reminder',
    title: '',
    description: '',
    date: null as Dayjs | null,
    time: null as Dayjs | null,
    priority: 'medium',
    location: ''
  });

  // Fetch all activities (reminders, events, follow-ups)
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

  // Filter activities
  const getFilteredActivities = () => {
    let filtered = activities;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(activity => activity.type === filterType);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(activity => activity.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.jobId?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.jobId?.company.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => a.date.valueOf() - b.date.valueOf());
  };

  const filteredActivities = getFilteredActivities();
  
  // Pagination helpers
  const getPaginatedActivities = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredActivities.slice(startIndex, endIndex);
  };

  // Group activities by date for calendar
  const activitiesByDate = filteredActivities.reduce<Record<string, ActivityItem[]>>((acc, activity) => {
    const dateStr = activity.date.format('YYYY-MM-DD');
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(activity);
    return acc;
  }, {});

  // Calendar cell renderer
  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const dayActivities = activitiesByDate[dateStr] || [];

    if (dayActivities.length === 0) return null;

    return (
      <div className="space-y-1 p-1">
        {dayActivities.slice(0, 2).map((activity) => (
          <div
            key={activity.id}
            className={`text-xs px-2 py-1 rounded-md truncate cursor-pointer transition-all hover:scale-105 border ${
              activity.type === 'reminder' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
              activity.type === 'interview' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
              activity.type === 'event' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
              activity.type === 'follow_up' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
              'bg-gray-500/20 text-gray-300 border-gray-500/30'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleActivityClick(activity);
            }}
            title={`${activity.title} - ${activity.time || 'All day'}`}
          >
            <div className="flex items-center gap-1">
              {getActivityIcon(activity.type)}
              <span className="truncate">{activity.title}</span>
            </div>
          </div>
        ))}
        {dayActivities.length > 2 && (
          <div className="text-xs text-gray-400 text-center py-1 bg-gray-700/30 rounded-md">
            +{dayActivities.length - 2} more
          </div>
        )}
      </div>
    );
  };

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);

  const handleActivityClick = (activity: ActivityItem) => {
    setEditingActivity(activity);
    setActivityForm({
      type: activity.type,
      title: activity.title,
      description: activity.description || '',
      date: activity.date,
      time: activity.time ? dayjs(activity.time, 'HH:mm') : null,
      priority: activity.priority,
      location: activity.location || ''
    });
    setShowEditModal(true);
  };

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
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete activity');
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
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
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update activity');
      }
    } catch (error) {
      console.error('Error updating activity:', error);
      toast.error('Failed to update activity');
    }
  };

  const [isCreating, setIsCreating] = useState(false);
  
  const handleUpdateActivity = async () => {
    if (!editingActivity) return;
    
    try {
      // Enhanced validation
      if (!activityForm.title?.trim()) {
        toast.error('Please enter a title');
        return;
      }
      
      if (!activityForm.date) {
        toast.error('Please select a date');
        return;
      }
      
      if (activityForm.title.trim().length < 3) {
        toast.error('Title must be at least 3 characters long');
        return;
      }
      
      setIsCreating(true);

      // Determine the API endpoint based on activity type
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
          dueDate: activityForm.date.toISOString(),
          dueTime: activityForm.time ? activityForm.time.format('HH:mm') : '09:00',
          type: 'custom',
          status: editingActivity.status
        };
      } else {
        endpoint = '/api/calendar/events';
        const startDate = activityForm.date.clone();
        if (activityForm.time) {
          startDate.hour(activityForm.time.hour()).minute(activityForm.time.minute());
        }
        
        payload = {
          ...payload,
          startDate: startDate.toISOString(),
          endDate: startDate.add(1, 'hour').toISOString(),
          type: activityForm.type,
          status: editingActivity.status,
          isAllDay: !activityForm.time,
          location: activityForm.location ? { address: activityForm.location } : undefined
        };
      }

      const response = await fetch(`${endpoint}?id=${editingActivity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success('Activity updated successfully!');
        setShowEditModal(false);
        setEditingActivity(null);
        setActivityForm({
          type: 'reminder',
          title: '',
          description: '',
          date: null,
          time: null,
          priority: 'medium',
          location: ''
        });
        // Refresh activities
        fetchActivities();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update activity');
      }
    } catch (error) {
      console.error('Error updating activity:', error);
      toast.error('Failed to update activity');
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleCreateActivity = async () => {
    try {
      // Enhanced validation
      if (!activityForm.title?.trim()) {
        toast.error('Please enter a title');
        return;
      }
      
      if (!activityForm.date) {
        toast.error('Please select a date');
        return;
      }
      
      if (activityForm.title.trim().length < 3) {
        toast.error('Title must be at least 3 characters long');
        return;
      }
      
      if (activityForm.title.trim().length > 100) {
        toast.error('Title must be less than 100 characters');
        return;
      }
      
      setIsCreating(true);

      // Determine the API endpoint based on activity type
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
          dueDate: activityForm.date.toISOString(),
          dueTime: activityForm.time ? activityForm.time.format('HH:mm') : '09:00',
          type: 'custom',
          status: 'pending'
        };
      } else {
        endpoint = '/api/calendar/events';
        const startDate = activityForm.date.clone();
        if (activityForm.time) {
          startDate.hour(activityForm.time.hour()).minute(activityForm.time.minute());
        }
        
        payload = {
          ...payload,
          startDate: startDate.toISOString(),
          endDate: startDate.add(1, 'hour').toISOString(),
          type: activityForm.type,
          status: 'scheduled',
          isAllDay: !activityForm.time,
          location: activityForm.location ? { address: activityForm.location } : undefined
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(`${activityForm.type.charAt(0).toUpperCase() + activityForm.type.slice(1)} created successfully!`);
        setShowCreateModal(false);
        setActivityForm({
          type: 'reminder',
          title: '',
          description: '',
          date: null,
          time: null,
          priority: 'medium',
          location: ''
        });
        // Refresh activities
        fetchActivities();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create activity');
      }
    } catch (error) {
      console.error('Error creating activity:', error);
      toast.error('Failed to create activity');
    } finally {
      setIsCreating(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'reminder': return <Bell className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'interview': return <Video className="w-4 h-4" />;
      case 'follow_up': return <Phone className="w-4 h-4" />;
      case 'deadline': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'snoozed': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-gray-700 rounded loading-skeleton w-48"></div>
            <div className="h-4 bg-gray-700 rounded loading-skeleton w-64"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 bg-gray-700 rounded loading-skeleton w-32"></div>
            <div className="h-10 bg-gray-700 rounded loading-skeleton w-36"></div>
          </div>
        </div>
        
        {/* Filters skeleton */}
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="space-y-4">
            <div className="h-5 bg-gray-700 rounded loading-skeleton w-32"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-10 bg-gray-700 rounded loading-skeleton"></div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Content skeleton */}
        <ActivitySkeleton count={5} />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg border border-primary/30">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            Activity Hub
          </h2>
          <p className="text-gray-400 mt-1">
            Manage all your job search activities in one place
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select
            value={viewMode}
            onChange={setViewMode}
            className="w-32"
          >
            <Option value="list">List</Option>
            <Option value="calendar">Calendar</Option>
          </Select>
          
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-primary/80"
          >
            Add Activity
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Filters & Search</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AntSearch
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              className="w-full"
              allowClear
            />
            
            <Select
              value={filterType}
              onChange={(value) => {
                setFilterType(value);
                setCurrentPage(1);
              }}
              className="w-full"
              placeholder="Filter by type"
            >
              <Option value="all">All Types</Option>
              <Option value="reminder">Reminders</Option>
              <Option value="event">Events</Option>
              <Option value="interview">Interviews</Option>
              <Option value="follow_up">Follow-ups</Option>
              <Option value="deadline">Deadlines</Option>
            </Select>
            
            <Select
              value={filterStatus}
              onChange={(value) => {
                setFilterStatus(value);
                setCurrentPage(1);
              }}
              className="w-full"
              placeholder="Filter by status"
            >
              <Option value="all">All Status</Option>
              <Option value="pending">Pending</Option>
              <Option value="completed">Completed</Option>
              <Option value="snoozed">Snoozed</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
            
            <div className="flex items-center justify-between bg-gray-700/30 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-400">Total:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{filteredActivities.length} activities</span>
              </div>
            </div>
          </div>
          
          {/* Quick filter buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="small"
              type={filterStatus === 'pending' ? 'primary' : 'default'}
              onClick={() => {
                setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending');
                setCurrentPage(1);
              }}
              className={filterStatus === 'pending' ? 'bg-primary' : ''}
            >
              Pending ({activities.filter(a => a.status === 'pending').length})
            </Button>
            <Button
              size="small"
              type={filterType === 'interview' ? 'primary' : 'default'}
              onClick={() => {
                setFilterType(filterType === 'interview' ? 'all' : 'interview');
                setCurrentPage(1);
              }}
              className={filterType === 'interview' ? 'bg-primary' : ''}
            >
              Interviews ({activities.filter(a => a.type === 'interview').length})
            </Button>
            <Button
              size="small"
              type={filterType === 'reminder' ? 'primary' : 'default'}
              onClick={() => {
                setFilterType(filterType === 'reminder' ? 'all' : 'reminder');
                setCurrentPage(1);
              }}
              className={filterType === 'reminder' ? 'bg-primary' : ''}
            >
              Reminders ({activities.filter(a => a.type === 'reminder').length})
            </Button>
            {(searchQuery || filterType !== 'all' || filterStatus !== 'all') && (
              <Button
                size="small"
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                  setFilterStatus('all');
                  setCurrentPage(1);
                }}
                className="text-gray-400 hover:text-white"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {/* Pagination Info */}
          {filteredActivities.length > 0 && (
            <div className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3 border border-gray-700">
              <div className="text-sm text-gray-400">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredActivities.length)} of {filteredActivities.length} activities
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Items per page:</span>
                <Select
                  value={pageSize}
                  onChange={(value) => {
                    setPageSize(value);
                    setCurrentPage(1);
                  }}
                  size="small"
                  className="w-20"
                >
                  <Option value={10}>10</Option>
                  <Option value={20}>20</Option>
                  <Option value={50}>50</Option>
                  <Option value={100}>100</Option>
                </Select>
              </div>
            </div>
          )}
          
          {filteredActivities.length === 0 ? (
            <div className="empty-state">
              <div className="mb-6">
                <Target className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No activities found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || filterType !== 'all' || filterStatus !== 'all' 
                    ? 'Try adjusting your filters or search terms'
                    : 'Create your first activity to get started with tracking your job search progress'
                  }
                </p>
              </div>
              
              {(!searchQuery && filterType === 'all' && filterStatus === 'all') && (
                <div className="space-y-3">
                  <Button
                    type="primary"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary hover:bg-primary/80"
                    size="large"
                  >
                    Create Your First Activity
                  </Button>
                  <div className="text-sm text-gray-400">
                    Track interviews, reminders, follow-ups, and deadlines
                  </div>
                </div>
              )}
              
              {(searchQuery || filterType !== 'all' || filterStatus !== 'all') && (
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setFilterStatus('all');
                    setCurrentPage(1);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {getPaginatedActivities().map((activity) => (
                <div
                  key={activity.id}
                  className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg flex items-center justify-center ${
                        activity.type === 'reminder' ? 'bg-yellow-500/20 text-yellow-400' :
                        activity.type === 'interview' ? 'bg-red-500/20 text-red-400' :
                        activity.type === 'event' ? 'bg-blue-500/20 text-blue-400' :
                        activity.type === 'follow_up' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-white truncate">{activity.title}</h4>
                          <Tag className={`text-xs ${getPriorityColor(activity.priority)}`}>
                            {activity.priority}
                          </Tag>
                          <Tag className={`text-xs ${getStatusColor(activity.status)}`}>
                            {activity.status}
                          </Tag>
                        </div>
                        
                        {activity.description && (
                          <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {activity.date.format('MMM DD, YYYY')}
                              {activity.time && ` at ${activity.time}`}
                              {activity.endTime && ` - ${activity.endTime}`}
                            </span>
                          </div>
                          
                          {activity.jobId && (
                            <div className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              <span>{activity.jobId.title} at {activity.jobId.company}</span>
                            </div>
                          )}
                          
                          {activity.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{activity.location}</span>
                            </div>
                          )}
                          
                          {activity.attendees && activity.attendees.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{activity.attendees.length} attendees</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {activity.status === 'pending' && (
                        <Button
                          type="text"
                          size="small"
                          className="text-green-400 hover:text-green-300 hover:bg-green-500/10 flex items-center justify-center w-8 h-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteActivity(activity);
                          }}
                          title="Mark as completed"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        type="text"
                        size="small"
                        className="text-gray-400 hover:text-white hover:bg-gray-500/10 flex items-center justify-center w-8 h-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivityClick(activity);
                        }}
                        title="Edit activity"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        type="text"
                        size="small"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center justify-center w-8 h-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteActivity(activity);
                        }}
                        title="Delete activity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Pagination Controls */}
              {filteredActivities.length > pageSize && (
                <div className="flex justify-center mt-6">
                  <Pagination
                    current={currentPage}
                    total={filteredActivities.length}
                    pageSize={pageSize}
                    onChange={(page, size) => {
                      setCurrentPage(page);
                      if (size) setPageSize(size);
                    }}
                    onShowSizeChange={(current, size) => {
                      setCurrentPage(1);
                      setPageSize(size);
                    }}
                    showSizeChanger
                    showQuickJumper
                    showTotal={(total, range) => 
                      `${range[0]}-${range[1]} of ${total} activities`
                    }
                    className="custom-dark-pagination"
                    pageSizeOptions={['10', '20', '50', '100']}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {viewMode === 'calendar' && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700">
          <AntCalendar
            className="custom-dark-calendar"
            dateCellRender={dateCellRender}
            onSelect={(date) => {
              setSelectedDate(date);
              const dateStr = date.format('YYYY-MM-DD');
              const dayActivities = activitiesByDate[dateStr] || [];
              if (dayActivities.length > 0) {
                toast(`${dayActivities.length} activities on ${date.format('MMM DD, YYYY')}`);
              } else {
                toast(`No activities on ${date.format('MMM DD, YYYY')}`);
              }
            }}
            value={selectedDate}
          />
        </div>
      )}

      {/* Edit Activity Modal */}
      <Modal
        title={editingActivity ? "Edit Activity" : "Create New Activity"}
        open={showEditModal}
        onCancel={() => {
          setShowEditModal(false);
          setEditingActivity(null);
          setActivityForm({
            type: 'reminder',
            title: '',
            description: '',
            date: null,
            time: null,
            priority: 'medium',
            location: ''
          });
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setShowEditModal(false);
            setEditingActivity(null);
          }}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={isCreating}
            onClick={editingActivity ? handleUpdateActivity : handleCreateActivity}
            className="bg-primary hover:bg-primary/80"
          >
            {editingActivity ? 'Update Activity' : 'Create Activity'}
          </Button>
        ]}
        className="custom-dark-modal"
        width={600}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Activity Type *
            </label>
            <Select
              value={activityForm.type}
              onChange={(value) => setActivityForm(prev => ({ ...prev, type: value }))}
              className="w-full"
              placeholder="Select activity type"
            >
              <Option value="reminder">Reminder</Option>
              <Option value="event">Event</Option>
              <Option value="interview">Interview</Option>
              <Option value="follow_up">Follow-up</Option>
              <Option value="deadline">Deadline</Option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title *
            </label>
            <Input
              value={activityForm.title}
              onChange={(e) => setActivityForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter activity title"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <Input.TextArea
              value={activityForm.description}
              onChange={(e) => setActivityForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter activity description"
              rows={3}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date *
              </label>
              <DatePicker
                value={activityForm.date}
                onChange={(date) => setActivityForm(prev => ({ ...prev, date }))}
                className="w-full"
                placeholder="Select date"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Time
              </label>
              <TimePicker
                value={activityForm.time}
                onChange={(time) => setActivityForm(prev => ({ ...prev, time }))}
                className="w-full"
                placeholder="Select time"
                format="HH:mm"
                use12Hours={false}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Priority
              </label>
              <Select
                value={activityForm.priority}
                onChange={(value) => setActivityForm(prev => ({ ...prev, priority: value }))}
                className="w-full"
                placeholder="Select priority"
              >
                <Option value="low">Low</Option>
                <Option value="medium">Medium</Option>
                <Option value="high">High</Option>
                <Option value="urgent">Urgent</Option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location
              </label>
              <Input
                value={activityForm.location}
                onChange={(e) => setActivityForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter location (optional)"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        title="Create New Activity"
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>,
          <Button
            key="create"
            type="primary"
            loading={isCreating}
            onClick={handleCreateActivity}
            className="bg-primary hover:bg-primary/80"
          >
            Create Activity
          </Button>
        ]}
        className="custom-modal"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Activity Type
            </label>
            <Select
              value={activityForm.type}
              onChange={(value) => setActivityForm(prev => ({ ...prev, type: value }))}
              className="w-full"
            >
              <Option value="reminder">Reminder</Option>
              <Option value="event">Event</Option>
              <Option value="interview">Interview</Option>
              <Option value="follow_up">Follow-up</Option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title *
            </label>
            <Input
              value={activityForm.title}
              onChange={(e) => setActivityForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter activity title"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <Input.TextArea
              value={activityForm.description}
              onChange={(e) => setActivityForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter activity description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date *
              </label>
              <DatePicker
                value={activityForm.date}
                onChange={(date) => setActivityForm(prev => ({ ...prev, date }))}
                className="w-full"
                format="YYYY-MM-DD"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Time
              </label>
              <TimePicker
                value={activityForm.time}
                onChange={(time) => setActivityForm(prev => ({ ...prev, time }))}
                className="w-full"
                format="HH:mm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Priority
            </label>
            <Select
              value={activityForm.priority}
              onChange={(value) => setActivityForm(prev => ({ ...prev, priority: value }))}
              className="w-full"
            >
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
              <Option value="urgent">Urgent</Option>
            </Select>
          </div>

          {(activityForm.type === 'event' || activityForm.type === 'interview') && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location
              </label>
              <Input
                value={activityForm.location}
                onChange={(e) => setActivityForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter location or meeting link"
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ActivityHub;
