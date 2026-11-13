import mongoose, { Schema } from 'mongoose';

export interface IAgentRunApplication {
  jobId: string;
  title: string;
  company: string;
  matchScore: number;
  outcome: 'applied' | 'already-applied-on-platform' | 'external' | 'failed' | 'dry-run' | 'skipped' | 'questionnaire';
  httpStatus?: number;
  errorSnippet?: string;
  questionnaireCount: number;
  aiAnswers: number;
  fallbackAnswers: number;
  resumeUsed?: string;
}

export interface IAgentRunQuery {
  keyword: string;
  location: string;
  page: number;
  jobsFound: number;
  newJobs: number;
  error?: string;
}

export interface IAgentRun {
  userId: mongoose.Types.ObjectId;
  startedAt: Date;
  finishedAt?: Date;
  trigger: 'manual' | 'schedule';
  dryRun: boolean;
  status: 'running' | 'success' | 'partial' | 'failed';
  currentStep?: string;
  resumeUsed?: string;
  stats: {
    queriesRun: number;
    pagesFetched: number;
    rawJobsSeen: number;
    newJobs: number;
    duplicateJobs: number;
    scoredJobs: number;
    applyAttempts: number;
    applied: number;
    applyFailed: number;
    skippedAppliedOnPlatform: number;
    skippedExternal: number;
    questionnairesAnswered: number;
    aiAnswers: number;
    fallbackAnswers: number;
  };
  queries: IAgentRunQuery[];
  applications: IAgentRunApplication[];
  errors: Array<{ at: Date; context: string; message: string }>;
}

const AgentRunSchema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startedAt: { type: Date, default: Date.now },
    finishedAt: Date,
    trigger: { type: String, enum: ['manual', 'schedule'], default: 'manual' },
    dryRun: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['running', 'success', 'partial', 'failed'],
      default: 'running',
    },
    currentStep: String,
    resumeUsed: String,
    stats: {
      queriesRun: { type: Number, default: 0 },
      pagesFetched: { type: Number, default: 0 },
      rawJobsSeen: { type: Number, default: 0 },
      newJobs: { type: Number, default: 0 },
      duplicateJobs: { type: Number, default: 0 },
      scoredJobs: { type: Number, default: 0 },
      applyAttempts: { type: Number, default: 0 },
      applied: { type: Number, default: 0 },
      applyFailed: { type: Number, default: 0 },
      skippedAppliedOnPlatform: { type: Number, default: 0 },
      skippedExternal: { type: Number, default: 0 },
      questionnairesAnswered: { type: Number, default: 0 },
      aiAnswers: { type: Number, default: 0 },
      fallbackAnswers: { type: Number, default: 0 },
    },
    queries: { type: [Schema.Types.Mixed], default: [] },
    applications: { type: [Schema.Types.Mixed], default: [] },
    errors: { type: [Schema.Types.Mixed], default: [] },
  }  ,
  {
    timestamps: true,
    suppressReservedKeysWarning: true,
  }
);

AgentRunSchema.index({ userId: 1, startedAt: -1 });

export default (mongoose.models.AgentRun || mongoose.model<IAgentRun>('AgentRun', AgentRunSchema)) as mongoose.Model<IAgentRun>;
