import mongoose, { Document, Schema } from 'mongoose';

export interface IJobCache extends Document {
  jobId: string;
  fingerprint: string;
  title: string;
  company: string;
  location: string;
  experience?: string;
  salary?: string;
  url: string;
  skills: string[];
  postedAgo?: string;
  description?: string;

  matchScore: number;
  reasons: string[];
  matchingSkills: string[];
  missingSkills: string[];

  status: 'new' | 'queued' | 'applied' | 'failed' | 'skipped' | 'tracked';
  platformApplied: boolean;
  platformSource: 'apply-response' | 'hide-apply-button' | 'manual-browse' | 'extension-event' | null;
  lastPlatformCheckAt?: Date;

  apply: {
    attempts: number;
    lastAttemptAt?: Date;
    success: boolean;
    httpStatus?: number;
    errorSnippet?: string;
    runId?: mongoose.Types.ObjectId;
    resumeUsed?: string;
  };

  questionnaire: Array<{
    questionId: string;
    question: string;
    answer: string;
    source: 'ai' | 'fallback';
    model?: string;
    answeredAt: Date;
  }>;

  firstSeenAt: Date;
  lastSeenAt: Date;
  harvestRuns: mongoose.Types.ObjectId[];
}

const QuestionnaireEntrySchema = new Schema(
  {
    questionId: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    source: { type: String, enum: ['ai', 'fallback'], required: true },
    model: String,
    answeredAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const JobCacheSchema = new Schema<IJobCache>(
  {
    jobId: { type: String, required: true },
    fingerprint: { type: String, required: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, default: 'India' },
    experience: String,
    salary: String,
    url: { type: String, required: true },
    skills: { type: [String], default: [] },
    postedAgo: String,
    description: String,

    matchScore: { type: Number, default: 0 },
    reasons: { type: [String], default: [] },
    matchingSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },

    status: {
      type: String,
      enum: ['new', 'queued', 'applied', 'failed', 'skipped', 'tracked'],
      default: 'new',
    },
    platformApplied: { type: Boolean, default: false },
    platformSource: {
      type: String,
      enum: ['apply-response', 'hide-apply-button', 'manual-browse', 'extension-event', null],
      default: null,
    },
    lastPlatformCheckAt: Date,

    apply: {
      attempts: { type: Number, default: 0 },
      lastAttemptAt: Date,
      success: { type: Boolean, default: false },
      httpStatus: Number,
      errorSnippet: String,
      runId: { type: mongoose.Schema.Types.ObjectId, ref: 'AgentRun' },
      resumeUsed: String,
    },

    questionnaire: { type: [QuestionnaireEntrySchema], default: [] },

    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    harvestRuns: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  },
  {
    timestamps: true,
  }
);

JobCacheSchema.index({ jobId: 1 }, { unique: true });
JobCacheSchema.index({ fingerprint: 1 }, { unique: true, sparse: true });
JobCacheSchema.index({ matchScore: -1 });
JobCacheSchema.index({ status: 1 });

delete mongoose.models['JobCache'];
export default mongoose.model<IJobCache>('JobCache', JobCacheSchema);
