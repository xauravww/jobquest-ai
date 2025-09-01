import mongoose, { Document, Schema } from 'mongoose';

export interface IResume extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  title: string;
  isDefault: boolean;
  content: {
    personalInfo: {
      fullName: string;
      email: string;
      phone: string;
      location: string;
      linkedinUrl?: string;
      githubUrl?: string;
      portfolioUrl?: string;
    };
    summary: string;
    experience: {
      company: string;
      position: string;
      location: string;
      startDate: Date;
      endDate?: Date;
      current: boolean;
      description: string;
      achievements: string[];
    }[];
    education: {
      institution: string;
      degree: string;
      field: string;
      location: string;
      startDate: Date;
      endDate?: Date;
      current: boolean;
      gpa?: number;
      honors?: string[];
    }[];
    skills: {
      category: string;
      skills: string[];
    }[];
    projects: {
      name: string;
      description: string;
      technologies: string[];
      url?: string;
      githubUrl?: string;
      startDate: Date;
      endDate?: Date;
      current: boolean;
    }[];
    certifications: {
      name: string;
      issuer: string;
      issueDate: Date;
      expiryDate?: Date;
      credentialId?: string;
      url?: string;
    }[];
  };
  template: string;
  isPublic: boolean;
  views: number;
  downloads: number;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Resume title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    content: {
      personalInfo: {
        fullName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        location: { type: String, required: true },
        linkedinUrl: String,
        githubUrl: String,
        portfolioUrl: String,
      },
      summary: { type: String, maxlength: [500, 'Summary cannot exceed 500 characters'] },
      experience: [{
        company: { type: String, required: true },
        position: { type: String, required: true },
        location: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: Date,
        current: { type: Boolean, default: false },
        description: { type: String, required: true },
        achievements: [String],
      }],
      education: [{
        institution: { type: String, required: true },
        degree: { type: String, required: true },
        field: { type: String, required: true },
        location: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: Date,
        current: { type: Boolean, default: false },
        gpa: Number,
        honors: [String],
      }],
      skills: [{
        category: { type: String, required: true },
        skills: [String],
      }],
      projects: [{
        name: { type: String, required: true },
        description: { type: String, required: true },
        technologies: [String],
        url: String,
        githubUrl: String,
        startDate: { type: Date, required: true },
        endDate: Date,
        current: { type: Boolean, default: false },
      }],
      certifications: [{
        name: { type: String, required: true },
        issuer: { type: String, required: true },
        issueDate: { type: Date, required: true },
        expiryDate: Date,
        credentialId: String,
        url: String,
      }],
    },
    template: {
      type: String,
      default: 'modern',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
ResumeSchema.index({ userId: 1 });
ResumeSchema.index({ userId: 1, isDefault: 1 });

export default mongoose.models.Resume || mongoose.model<IResume>('Resume', ResumeSchema);
