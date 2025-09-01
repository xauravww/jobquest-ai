import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  benefits: string[];
  jobType: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  educationLevel: 'high-school' | 'bachelor' | 'master' | 'phd';
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  sourceUrl: string;
  postedDate: Date;
  applicationDeadline?: Date;
  source: string;
  isRemote: boolean;
  isHiring: boolean;
  applicationCount: number;
  views: number;
  metadata: {
    engine?: string;
    category?: string;
    tags: string[];
    confidence?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    requirements: [String],
    responsibilities: [String],
    skills: [String],
    benefits: [String],
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship'],
      default: 'full-time',
    },
    experienceLevel: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'executive'],
      default: 'mid',
    },
    educationLevel: {
      type: String,
      enum: ['high-school', 'bachelor', 'master', 'phd'],
      default: 'bachelor',
    },
    salaryRange: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'USD' },
    },
    sourceUrl: {
      type: String,
      required: [true, 'Source URL is required'],
      trim: true,
    },
    postedDate: {
      type: Date,
      default: Date.now,
    },
    applicationDeadline: Date,
    source: {
      type: String,
      required: [true, 'Source is required'],
      default: 'manual',
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
    metadata: {
      engine: String,
      category: String,
      tags: [String],
      confidence: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
JobSchema.index({ title: 'text', company: 'text', description: 'text' });
JobSchema.index({ location: 1 });
JobSchema.index({ postedDate: -1 });
JobSchema.index({ company: 1 });
JobSchema.index({ isRemote: 1 });
JobSchema.index({ jobType: 1 });
JobSchema.index({ experienceLevel: 1 });

export default mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);
