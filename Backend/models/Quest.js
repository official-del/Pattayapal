import mongoose from 'mongoose';

const questSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },

  taskType: {
    type:    String,
    enum:    ['MANUAL', 'PROFILE_FULL', 'POST_WORK', 'DAILY_LOGIN', 'PROOF_SUBMISSION'],
    default: 'MANUAL',
  },

  rewardType:  { type: String, enum: ['COIN', 'XP'], required: true },
  coinReward:  { type: Number, default: 0, min: 0 },
  xpReward:    { type: Number, default: 0, min: 0 },

  requiredRank: {
    type:    String,
    enum:    ['All', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Conqueror'],
    default: 'All',
  },

  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  maxClaims:     { type: Number, default: 0 },   // 0 = unlimited
  currentClaims: { type: Number, default: 0 },
  isActive:      { type: Boolean, default: true },
  expiresAt:     { type: Date, default: null },  // null = never expires

}, { timestamps: true });

export default mongoose.model('Quest', questSchema);
