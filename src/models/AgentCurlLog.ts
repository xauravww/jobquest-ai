import mongoose from 'mongoose';

export interface IAgentCurlLog {
  _id?: string;
  userEmail: string;
  method: string;
  url: string;
  hostname: string;
  pathname: string;
  curl: string;
  headers?: Record<string, string>;
  requestBody?: string;
  responseStatus?: number;
  responseStatusText?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  source?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const AgentCurlLogSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    method: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    hostname: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    pathname: {
      type: String,
      required: true,
      trim: true,
    },
    curl: {
      type: String,
      required: true,
    },
    headers: {
      type: Map,
      of: String,
      default: {},
    },
    requestBody: {
      type: String,
      default: '',
    },
    responseStatus: {
      type: Number,
      default: null,
    },
    responseStatusText: {
      type: String,
      default: '',
    },
    responseHeaders: {
      type: Map,
      of: String,
      default: {},
    },
    responseBody: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      default: 'extension',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

AgentCurlLogSchema.index({ userEmail: 1, createdAt: -1 });
AgentCurlLogSchema.index({ hostname: 1, createdAt: -1 });

export const AgentCurlLog =
  mongoose.models.AgentCurlLog ||
  mongoose.model('AgentCurlLog', AgentCurlLogSchema);

export default AgentCurlLog;
