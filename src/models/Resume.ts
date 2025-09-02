import mongoose from 'mongoose';

const ResumeSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Resume Details
  title: {
    type: String,
    required: true
  },
  description: String,
  
  // Resume Type
  type: {
    type: String,
    enum: ['standard', 'latex', 'ats_optimized', 'creative'],
    default: 'standard'
  },
  
  // File Information
  fileName: String,
  filePath: String,
  fileSize: Number,
  mimeType: String,
  
  // LaTeX specific
  latexSource: String,
  compiledPdfPath: String,
  
  // Resume Content
  personalInfo: {
    fullName: String,
    email: String,
    phone: String,
    location: String,
    website: String,
    linkedin: String,
    github: String
  },
  
  summary: String,
  
  experience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
    description: String,
    achievements: [String],
    technologies: [String]
  }],
  
  education: [{
    institution: String,
    degree: String,
    field: String,
    startDate: Date,
    endDate: Date,
    gpa: String,
    achievements: [String]
  }],
  
  skills: {
    technical: [String],
    soft: [String],
    languages: [String],
    frameworks: [String],
    tools: [String]
  },
  
  projects: [{
    name: String,
    description: String,
    technologies: [String],
    url: String,
    github: String,
    startDate: Date,
    endDate: Date
  }],
  
  certifications: [{
    name: String,
    issuer: String,
    date: Date,
    expiryDate: Date,
    credentialId: String,
    url: String
  }],
  
  // ATS Optimization
  atsScore: {
    type: Number,
    min: 0,
    max: 100
  },
  atsKeywords: [String],
  
  // Usage Tracking
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: Date,
  
  // Version Control
  version: {
    type: Number,
    default: 1
  },
  parentResumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  
  // Templates
  templateId: String,
  customizations: {
    colors: {
      primary: String,
      secondary: String,
      text: String
    },
    fonts: {
      heading: String,
      body: String
    },
    layout: String
  }
}, {
  timestamps: true
});

// Indexes
ResumeSchema.index({ userId: 1, isActive: 1 });
ResumeSchema.index({ userId: 1, isDefault: 1 });
ResumeSchema.index({ userId: 1, lastUsed: -1 });

export default mongoose.models.Resume || mongoose.model('Resume', ResumeSchema);