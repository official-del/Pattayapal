import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['comment', 'message', 'job', 'friend_request', 'rank'],
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId, // ID ของ Work, Job, หรือ Message Room
  },
  text: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  link: {
    type: String // URL สำหรับคลิกไปดู (เช่น /works/123 หรือ /messenger)
  }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
