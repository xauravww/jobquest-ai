'use client';

import React from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  FileText,
  Video,
  Phone,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface EventCardProps {
  event: {
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
      meetingId?: string;
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
    preparationNotes?: string;
  };
  onEdit?: (event: any) => void;
  onDelete?: (id: string) => void;
  onJoin?: (event: any) => void;
  compact?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onEdit,
  onDelete,
  onJoin,
  compact = false
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500 bg-red-50 border-red-200';
      case 'high': return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-500 bg-green-50 border-green-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      case 'rescheduled': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'phone_screening': return <Phone className="w-4 h-4" />;
      case 'technical_interview': return <FileText className="w-4 h-4" />;
      case 'final_interview': return <Users className="w-4 h-4" />;
      case 'interview': return <Calendar className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const formatDateTime = (startDate: string, endDate: string, isAllDay: boolean) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dateLabel = '';
    if (start.toDateString() === today.toDateString()) {
      dateLabel = 'Today';
    } else if (start.toDateString() === tomorrow.toDateString()) {
      dateLabel = 'Tomorrow';
    } else {
      dateLabel = start.toLocaleDateString();
    }

    if (isAllDay) {
      return `${dateLabel} (All Day)`;
    }

    const startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `${dateLabel} ${startTime} - ${endTime}`;
  };

  const isUpcoming = () => {
    const startTime = new Date(event.startDate);
    const now = new Date();
    const oneHour = 60 * 60 * 1000;
    
    return startTime > now && startTime <= new Date(now.getTime() + oneHour);
  };

  const canJoin = () => {
    const startTime = new Date(event.startDate);
    const now = new Date();
    const fifteenMinutes = 15 * 60 * 1000;
    
    return event.location?.isVirtual && 
           event.location?.meetingLink && 
           startTime <= new Date(now.getTime() + fifteenMinutes) &&
           event.status === 'confirmed';
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-3 bg-bg-light rounded-lg border border-border hover:border-success/50 transition-colors ${
        isUpcoming() ? 'border-success/50 bg-success/5' : ''
      }`}>
        <div className="flex-shrink-0">
          <div className={`p-2 rounded-lg ${getPriorityColor(event.priority)}`}>
            {getTypeIcon(event.type)}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm text-white truncate">
              {event.title}
            </h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
              {event.status}
            </span>
            {isUpcoming() && (
              <span className="px-2 py-1 rounded-full text-xs font-medium text-success bg-success/20">
                Starting Soon
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDateTime(event.startDate, event.endDate, event.isAllDay)}
            </span>
            
            {event.location?.isVirtual ? (
              <span className="flex items-center gap-1">
                <Video className="w-3 h-3" />
                Virtual
              </span>
            ) : event.location?.address && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3" />
                {event.location.address}
              </span>
            )}
          </div>
        </div>
        
        {canJoin() && onJoin && (
          <button
            onClick={() => onJoin(event)}
            className="px-3 py-1 bg-success hover:bg-success/80 text-white rounded text-xs font-medium transition-colors"
          >
            Join
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`p-4 bg-bg-light rounded-lg border border-border hover:border-success/50 transition-colors ${
      isUpcoming() ? 'border-success/50 bg-success/5' : ''
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${getPriorityColor(event.priority)}`}>
            {getTypeIcon(event.type)}
          </div>
          <div>
            <h3 className="font-medium text-white">{event.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(event.priority)}`}>
                {event.priority}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                {event.status}
              </span>
              {isUpcoming() && (
                <span className="px-2 py-1 rounded-full text-xs font-medium text-success bg-success/20">
                  Starting Soon
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {canJoin() && onJoin && (
            <button
              onClick={() => onJoin(event)}
              className="px-3 py-1 bg-success hover:bg-success/80 text-white rounded text-sm font-medium transition-colors mr-2"
            >
              Join Meeting
            </button>
          )}
          
          {onEdit && (
            <button
              onClick={() => onEdit(event)}
              className="p-2 text-text-muted hover:text-success hover:bg-bg rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={() => onDelete(event._id)}
              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {event.description && (
        <p className="text-text-muted text-sm mb-3">{event.description}</p>
      )}
      
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDateTime(event.startDate, event.endDate, event.isAllDay)}
          </span>
          
          {event.location?.isVirtual ? (
            <span className="flex items-center gap-1">
              <Video className="w-3 h-3" />
              Virtual Meeting
              {event.location.meetingId && ` (ID: ${event.location.meetingId})`}
            </span>
          ) : event.location?.address && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {event.location.address}
            </span>
          )}
        </div>
        
        {event.attendees.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Users className="w-3 h-3" />
            <span>
              {event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}: {' '}
              {event.attendees.slice(0, 2).map(a => a.name).join(', ')}
              {event.attendees.length > 2 && ` +${event.attendees.length - 2} more`}
            </span>
          </div>
        )}
        
        {event.jobId && (
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <FileText className="w-3 h-3" />
            <span>{event.jobId.title} at {event.jobId.company}</span>
          </div>
        )}
      </div>
      
      {event.preparationNotes && (
        <div className="p-3 bg-bg rounded-lg border border-border">
          <h4 className="text-xs font-medium text-text-muted mb-1">Preparation Notes:</h4>
          <p className="text-xs text-text">{event.preparationNotes}</p>
        </div>
      )}
    </div>
  );
};

export default EventCard;