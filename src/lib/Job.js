import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    requirements: [{
      type: String,
    }],
    responsibilities: [{
      type: String,
    }],
    salaryRange: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: 'USD',
      },
    },
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship', 'temporary', 'remote'],
      default: 'full-time',
    },
    experienceLevel: {
      type: String,
      enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'],
      default: 'mid',
    },
    educationLevel: {
      type: String,
      enum: ['high-school', 'associate', 'bachelor', 'master', 'doctorate', 'none'],
      default: 'bachelor',
    },
    skills: [{
      type: String,
    }],
    benefits: [{
      type: String,
    }],
    applicationDeadline: Date,
    postedDate: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      required: true,
    },
    sourceUrl: {
      type: String,
      required: true,
      unique: true,
    },
    isRemote: {
      type: Boolean,
      default: false,
    },
    isHiring: {
      type: Boolean,
      default: true,
    },
    applicationCount: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    aiAnalysis: {
      isHiringPost: Boolean,
      confidence: Number,
      urgency: Number,
      quality: Number,
      keywords: [String],
      analysisDate: Date,
    },
    metadata: {
      engine: String,
      category: String,
      publishedDate: Date,
      thumbnail: String,
      favicon: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better search performance
JobSchema.index({ title: 'text', description: 'text', company: 'text' });
JobSchema.index({ location: 1 });
JobSchema.index({ jobType: 1 });
JobSchema.index({ experienceLevel: 1 });
JobSchema.index({ postedDate: -1 });
JobSchema.index({ 'aiAnalysis.isHiringPost': 1 });

module.exports = mongoose.models.Job || mongoose.model('Job', JobSchema);
