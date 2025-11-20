import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  // Job Details
  jobId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false,
    default: 'No description provided'
  },
  salary: {
    type: String
  },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship'],
    default: 'full-time'
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'executive'],
    default: 'mid'
  },
  skills: [{
    type: String
  }],
  
  // Source Information
  source: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  applyUrl: {
    type: String
  },
  datePosted: {
    type: Date,
    default: Date.now
  },
  
  // User Interaction
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['saved', 'applied', 'interviewing', 'rejected', 'offered'],
    default: 'saved'
  },
  appliedDate: {
    type: Date
  },
  notes: {
    type: String
  },
  
  // AI Analysis
  aiScore: {
    type: Number,
    min: 0,
    max: 100
  },
  aiReasons: [{
    type: String
  }],
  matchingSkills: [{
    type: String
  }],
  
  // Tracking
  isActive: {
    type: Boolean,
    default: true
  },
  isBookmarked: {
    type: Boolean,
    default: false
  },
  isSkipped: {
    type: Boolean,
    default: false
  },
  skippedBy: {
    type: String
  },
  skippedAt: {
    type: Date
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
JobSchema.index({ userId: 1, status: 1 });
JobSchema.index({ userId: 1, datePosted: -1 });
JobSchema.index({ userId: 1, aiScore: -1 });
// Compound unique index for jobId per user
JobSchema.index({ jobId: 1, userId: 1 }, { unique: true });

export const Job = mongoose.models.Job || mongoose.model('Job', JobSchema);
export default Job;
