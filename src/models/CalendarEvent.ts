import mongoose from 'mongoose';

const CalendarEventSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Related Entity References
  reminderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reminder'
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  
  // Event Details
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Timing
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isAllDay: {
    type: Boolean,
    default: false
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  
  // Location
  location: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    isVirtual: {
      type: Boolean,
      default: false
    },
    meetingLink: String,
    meetingId: String,
    meetingPassword: String
  },
  
  // Event Type
  type: {
    type: String,
    enum: [
      'interview',
      'phone_screening',
      'technical_interview',
      'final_interview',
      'networking_event',
      'job_fair',
      'follow_up_call',
      'deadline',
      'meeting',
      'other'
    ],
    required: true
  },
  
  // Attendees
  attendees: [{
    name: String,
    email: String,
    role: {
      type: String,
      enum: ['interviewer', 'hr', 'recruiter', 'hiring_manager', 'team_member', 'other']
    },
    company: String,
    phone: String,
    responseStatus: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'tentative'],
      default: 'pending'
    }
  }],
  
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'cancelled', 'completed', 'rescheduled'],
    default: 'scheduled'
  },
  
  // External Calendar Integration
  externalCalendar: {
    eventId: String,
    calendarId: String,
    provider: {
      type: String,
      enum: ['google', 'outlook', 'apple', 'ical', 'other']
    },
    synced: {
      type: Boolean,
      default: false
    },
    lastSyncAt: Date,
    syncError: String
  },
  
  // Reminders & Notifications
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'push', 'sms', 'popup']
    },
    timing: {
      type: Number, // minutes before event
      required: true
    },
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date
  }],
  
  // Preparation & Notes
  preparationNotes: String,
  agenda: [String],
  documents: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['resume', 'cover_letter', 'portfolio', 'presentation', 'other']
    }
  }],
  
  // Follow-up
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  followUpNotes: String,
  
  // Outcome (for completed events)
  outcome: {
    result: {
      type: String,
      enum: ['positive', 'negative', 'neutral', 'pending']
    },
    feedback: String,
    nextSteps: String,
    followUpScheduled: Boolean
  },
  
  // Metadata
  tags: [String],
  color: {
    type: String,
    default: '#3b82f6'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes
CalendarEventSchema.index({ userId: 1, startDate: 1 });
CalendarEventSchema.index({ userId: 1, status: 1 });
CalendarEventSchema.index({ userId: 1, type: 1 });
CalendarEventSchema.index({ applicationId: 1 });
CalendarEventSchema.index({ jobId: 1 });
CalendarEventSchema.index({ startDate: 1, endDate: 1 });
CalendarEventSchema.index({ 'externalCalendar.eventId': 1 });

export const CalendarEvent = mongoose.models.CalendarEvent || mongoose.model('CalendarEvent', CalendarEventSchema);
export default CalendarEvent;