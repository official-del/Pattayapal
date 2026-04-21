import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import {
  getOrCreateConversation,
  createGroup,
  getMyConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  toggleArchiveConversation
} from '../controller/chatController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// 🔒 ทุกเส้นทางต้องผ่านการตรวจสอบ Token (protect)
router.post('/conversation', protect, getOrCreateConversation);
router.post('/groups', protect, createGroup);
router.get('/conversations', protect, getMyConversations);
router.get('/:conversationId/messages', protect, getMessages);
router.patch('/:conversationId/read', protect, markMessagesAsRead);
router.patch('/:conversationId/archive', protect, toggleArchiveConversation);
router.post('/message', protect, upload.array('attachments', 10), sendMessage);

export default router;
