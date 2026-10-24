import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      isArchived: { type: Boolean, default: false },
      isMuted: { type: Boolean, default: false },
      lastReadMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
    }
  ],
  isGroup: {
    type: Boolean,
    default: false
  },
  groupName: {
    type: String,
    trim: true
  },
  groupImage: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' }
  },
  admins: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
