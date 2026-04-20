import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getOrCreateConversation,
  getMyConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead
} from '../controller/chatController.js';

const router = express.Router();

// 🔒 ทุกเส้นทางต้องผ่านการตรวจสอบ Token (protect)
router.post('/conversation', protect, getOrCreateConversation);
router.get('/conversations', protect, getMyConversations);
router.get('/:conversationId/messages', protect, getMessages);
router.patch('/:conversationId/read', protect, markMessagesAsRead);
router.post('/message', protect, sendMessage);

export default router;
