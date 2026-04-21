import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: false
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'call_log', 'location'],
    default: 'text'
  },
  attachments: [
    {
      url: { type: String },
      fileType: { type: String },
      fileName: { type: String },
      fileSize: { type: Number }
    }
  ],
  callDuration: { type: Number }, // in seconds
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;
