import express from 'express';
import { createPost, getPosts, likePost, commentPost, deleteComment, deletePost, replyCommentPost } from '../controller/postController.js';
import { protect } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // ✅ ใช้ MemoryStorage เพื่อส่งไป GCS ต่อ

router.route('/')
  .get(getPosts)
  .post(protect, upload.array('media', 4), createPost);

router.route('/:id')
  .delete(protect, deletePost);

router.route('/:id/like')
  .post(protect, likePost);

router.route('/:id/comment')
  .post(protect, commentPost);

router.route('/:id/comment/:commentId')
  .delete(protect, deleteComment);

router.route('/:id/comment/:commentId/reply')
  .post(protect, replyCommentPost);

export default router;
