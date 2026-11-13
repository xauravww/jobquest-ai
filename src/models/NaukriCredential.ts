import mongoose, { Document, Schema } from 'mongoose';

export interface INaukriCredential extends Document {
  userId: mongoose.Types.ObjectId;
  naukriEmail: string;
  naukriPassword: string;
  lastLoginAt?: Date;
  lastLoginOk?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NaukriCredentialSchema = new Schema<INaukriCredential>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    naukriEmail: { type: String, required: true },
    naukriPassword: { type: String, required: true },
    lastLoginAt: Date,
    lastLoginOk: Boolean,
  },
  {
    timestamps: true,
  }
);

NaukriCredentialSchema.index({ userId: 1 }, { unique: true });

delete mongoose.models['NaukriCredential'];
export default mongoose.model<INaukriCredential>('NaukriCredential', NaukriCredentialSchema);
