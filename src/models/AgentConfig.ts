import mongoose, { Document, Schema } from 'mongoose';

export interface IAgentConfig extends Document {
  userId: mongoose.Types.ObjectId;
  autoApplyEnabled: boolean;
  applyThreshold: number;
  dailyApplyCap: number;
  maxSearchCallsPerRun: number;
  companyBlacklist: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULTS = {
  autoApplyEnabled: true,
  applyThreshold: 70,
  dailyApplyCap: 15,
  maxSearchCallsPerRun: 12,
};

const AgentConfigSchema = new Schema<IAgentConfig>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    autoApplyEnabled: { type: Boolean, default: DEFAULTS.autoApplyEnabled },
    applyThreshold: { type: Number, default: DEFAULTS.applyThreshold },
    dailyApplyCap: { type: Number, default: DEFAULTS.dailyApplyCap },
    maxSearchCallsPerRun: { type: Number, default: DEFAULTS.maxSearchCallsPerRun },
    companyBlacklist: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

AgentConfigSchema.index({ userId: 1 }, { unique: true });

export async function getOrCreateAgentConfig(userId: string | mongoose.Types.ObjectId) {
  let config = await AgentConfigModel.findOne({ userId });
  if (!config) {
    config = await AgentConfigModel.create({ userId });
  }
  return config;
}

const AgentConfigModel =
  mongoose.models['AgentConfig'] || mongoose.model<IAgentConfig>('AgentConfig', AgentConfigSchema);
export default AgentConfigModel;
