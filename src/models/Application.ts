import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  status: 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn';
  applicationDate: Date;
  notes?: string;
  followUpDate?: Date;
  resumeVersion?: string;
  coverLetter?: string;
  appliedThrough: string;
  responseDate?: Date;
  interviewDates: Date[];
  feedback?: string;
  rating?: number; // 1-5 stars
  timeline: {
    date: Date;
    action: string;
    notes?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
    },
    status: {
      type: String,
      enum: ['saved', 'applied', 'interviewing', 'offered', 'rejected', 'withdrawn'],
      default: 'saved',
    },
    applicationDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    followUpDate: Date,
    resumeVersion: String,
    coverLetter: String,
    appliedThrough: {
      type: String,
      default: 'manual',
    },
    responseDate: Date,
    interviewDates: [Date],
    feedback: {
      type: String,
      maxlength: [500, 'Feedback cannot exceed 500 characters'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    timeline: [{
      date: { type: Date, default: Date.now },
      action: { type: String, required: true },
      notes: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
ApplicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });
ApplicationSchema.index({ userId: 1, status: 1 });
ApplicationSchema.index({ userId: 1, applicationDate: -1 });
ApplicationSchema.index({ followUpDate: 1 });

// Prevent duplicate applications for the same job by the same user
ApplicationSchema.pre('save', async function (next) {
  const application = this as IApplication;

  if (application.isNew) {
    const existingApplication = await mongoose.models.Application.findOne({
      userId: application.userId,
      jobId: application.jobId,
    });

    if (existingApplication) {
      const error = new Error('Application already exists for this job');
      return next(error);
    }
  }

  next();
});

export default mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);
