import mongoose, { Document, Schema } from 'mongoose';

export interface INaukriSession extends Document {
  userId: mongoose.Types.ObjectId;
  authorization: string;
  cookies: string;
  capturedAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NaukriSessionSchema = new Schema<INaukriSession>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorization: { type: String, required: true },
    cookies: { type: String, required: true },
    capturedAt: { type: Date, default: Date.now },
    lastUsedAt: Date,
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

NaukriSessionSchema.index({ userId: 1 }, { unique: true });

delete mongoose.models['NaukriSession'];
export default mongoose.model<INaukriSession>('NaukriSession', NaukriSessionSchema);
