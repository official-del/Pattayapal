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
  toggleArchiveConversation,
  getConversationById
} from '../controller/chatController.js';

const router = express.Router();
import path from 'path';
import fs from 'fs';
const tempDir = path.join(process.cwd(), 'uploads/temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
const upload = multer({ dest: tempDir });

// 🔒 ทุกเส้นทางต้องผ่านการตรวจสอบ Token (protect)
router.post('/conversation', protect, getOrCreateConversation);
router.post('/groups', protect, createGroup);
router.get('/conversations', protect, getMyConversations);
router.get('/:conversationId', protect, getConversationById);
router.get('/:conversationId/messages', protect, getMessages);
router.patch('/:conversationId/read', protect, markMessagesAsRead);
router.patch('/:conversationId/archive', protect, toggleArchiveConversation);
router.post('/message', protect, upload.array('attachments', 10), sendMessage);

export default router;
