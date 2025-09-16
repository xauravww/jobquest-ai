import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAIConfig extends Document {
  userId: mongoose.Types.ObjectId;
  provider: 'lm-studio' | 'ollama' | 'gemini';
  apiKey?: string;
  apiUrl?: string;
  aiModel: string;
  isActive: boolean;
  lastSelectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AIConfigSchema = new Schema<IAIConfig>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: String,
      enum: ['lm-studio', 'ollama', 'gemini'],
      required: true,
    },
    apiKey: String,
    apiUrl: String,
    aiModel: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    lastSelectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to ensure only one active config per user
AIConfigSchema.pre('save', async function (next) {
  if (this.isActive) {
    const model = this.constructor as Model<IAIConfig>;
    await model.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isActive: false }
    );
  }
  next();
});

delete mongoose.models['AIConfig'];
export default mongoose.model<IAIConfig>('AIConfig', AIConfigSchema);
