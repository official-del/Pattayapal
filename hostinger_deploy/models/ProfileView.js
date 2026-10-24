import mongoose from 'mongoose';

const profileViewSchema = new mongoose.Schema({
  viewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  viewerIp: { type: String },
  targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  viewedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure unique view per User ID
profileViewSchema.index(
  { viewerId: 1, targetId: 1 }, 
  { unique: true, partialFilterExpression: { viewerId: { $exists: true } } }
);

// Ensure unique view per IP (for guests)
profileViewSchema.index(
  { viewerIp: 1, targetId: 1 }, 
  { unique: true, partialFilterExpression: { viewerIp: { $exists: true } } }
);

const ProfileView = mongoose.model('ProfileView', profileViewSchema);
export default ProfileView;
