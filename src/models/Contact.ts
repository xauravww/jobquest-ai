import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  
  // Professional Information
  role: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  
  // Social & Professional Links
  linkedIn: {
    type: String,
    trim: true
  },
  twitter: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  
  // Contact Details
  notes: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Status & Tracking
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // Communication History
  lastContactDate: {
    type: Date,
    default: Date.now
  },
  nextFollowUpDate: {
    type: Date
  },
  contactFrequency: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'as_needed'],
    default: 'as_needed'
  },
  
  // Relationship Context
  relationshipType: {
    type: String,
    enum: ['recruiter', 'hiring_manager', 'colleague', 'referral', 'mentor', 'other'],
    default: 'other'
  },
  howMet: {
    type: String,
    trim: true
  },
  
  // Job Application Context
  relatedApplications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  }],
  relatedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  
  // Communication Log
  communications: [{
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['email', 'phone', 'linkedin', 'meeting', 'interview', 'other']
    },
    direction: {
      type: String,
      enum: ['incoming', 'outgoing']
    },
    subject: String,
    notes: String,
    outcome: String
  }],
  
  // Reminders
  reminders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reminder'
  }]
}, {
  timestamps: true
});

// Indexes
ContactSchema.index({ userId: 1, status: 1 });
ContactSchema.index({ userId: 1, company: 1 });
ContactSchema.index({ userId: 1, lastContactDate: -1 });
ContactSchema.index({ email: 1 });
ContactSchema.index({ userId: 1, tags: 1 });

export const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
export default Contact;