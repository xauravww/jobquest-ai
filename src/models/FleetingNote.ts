import mongoose from 'mongoose';

const FleetingNoteSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    index: true
  },
  source: {
    type: String,
    enum: ['web', 'telegram', 'api'],
    default: 'web'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  tags: [{
    type: String,
    trim: true
  }],
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better performance
FleetingNoteSchema.index({ userEmail: 1, createdAt: -1 });
FleetingNoteSchema.index({ userEmail: 1, isArchived: 1 });

export const FleetingNote = mongoose.models.FleetingNote || mongoose.model('FleetingNote', FleetingNoteSchema);
export default FleetingNote;