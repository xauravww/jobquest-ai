import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Job Reference
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  
  // Application Details
  applicationId: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: [
      'draft',
      'applied',
      'submitted',
      'under_review',
      'phone_screening',
      'technical_interview',
      'final_interview',
      'offer_received',
      'accepted',
      'rejected',
      'withdrawn',
      'expired'
    ],
    default: 'draft'
  },
  
  // Application Timeline
  appliedDate: {
    type: Date,
    default: Date.now
  },
  lastStatusUpdate: {
    type: Date,
    default: Date.now
  },
  expectedResponseDate: {
    type: Date
  },
  
  // Application Method
  applicationMethod: {
    type: String,
    enum: ['manual', 'auto_apply', 'referral', 'direct'],
    default: 'manual'
  },
  platform: {
    type: String,
    enum: ['naukri', 'linkedin', 'indeed', 'company_website', 'other'],
    required: true
  },
  
  // Documents Used
  resumeUsed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  coverLetterUsed: {
    type: String
  },
  
  // Communication History
  communications: [{
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['email', 'phone', 'message', 'interview', 'other']
    },
    direction: {
      type: String,
      enum: ['incoming', 'outgoing']
    },
    subject: String,
    content: String,
    contactPerson: String
  }],
  
  // Interview Details
  interviews: [{
    scheduledDate: Date,
    type: {
      type: String,
      enum: ['phone', 'video', 'in_person', 'technical', 'hr']
    },
    duration: Number, // in minutes
    interviewer: String,
    notes: String,
    feedback: String,
    result: {
      type: String,
      enum: ['passed', 'failed', 'pending']
    }
  }],
  
  // Offer Details
  offer: {
    salary: Number,
    currency: {
      type: String,
      default: 'INR'
    },
    benefits: [String],
    startDate: Date,
    responseDeadline: Date,
    negotiationNotes: String
  },
  
  // Tracking & Notes
  notes: String,
  tags: [String],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // Reminders (references to Reminder model)
  reminders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reminder'
  }],
  
  // Calendar Events (references to CalendarEvent model)
  calendarEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CalendarEvent'
  }],
  
  // Automation Data
  automationData: {
    isAutomated: {
      type: Boolean,
      default: false
    },
    automationScript: String,
    lastAutomationRun: Date,
    automationStatus: String
  }
}, {
  timestamps: true
});

// Indexes
ApplicationSchema.index({ userId: 1, status: 1 });
ApplicationSchema.index({ userId: 1, appliedDate: -1 });
ApplicationSchema.index({ userId: 1, priority: 1 });
// Removed duplicate index on applicationId to fix warning
// ApplicationSchema.index({ applicationId: 1 }, { unique: true });

export const Application = mongoose.models.Application || mongoose.model('Application', ApplicationSchema);
export default Application;
