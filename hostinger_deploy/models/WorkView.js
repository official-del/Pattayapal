import mongoose from 'mongoose';

const workViewSchema = new mongoose.Schema({
  viewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  viewerIp: { type: String },
  workId: { type: mongoose.Schema.Types.ObjectId, ref: 'Work', required: true },
  viewedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure unique view per User ID
workViewSchema.index(
  { viewerId: 1, workId: 1 }, 
  { unique: true, partialFilterExpression: { viewerId: { $exists: true } } }
);

// Ensure unique view per IP (for guests)
workViewSchema.index(
  { viewerIp: 1, workId: 1 }, 
  { unique: true, partialFilterExpression: { viewerIp: { $exists: true } } }
);

const WorkView = mongoose.model('WorkView', workViewSchema);
export default WorkView;
