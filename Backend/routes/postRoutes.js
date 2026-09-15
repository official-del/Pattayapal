import express from 'express';
import { createPost, getPosts, getPostById, likePost, commentPost, deleteComment, deletePost, replyCommentPost, getPostsByUser, updatePost, searchPosts } from '../controller/postController.js';
import { protect } from '../middleware/auth.js';
import { buildDiskUploadOptions, mediaFileFilter } from '../middleware/uploadConfig.js';
import multer from 'multer';

const router = express.Router();
import path from 'path';
import fs from 'fs';
const tempDir = path.join(process.cwd(), 'uploads/temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
const upload = multer(buildDiskUploadOptions(tempDir, {
  files: 5,
  fileFilter: mediaFileFilter,
}));

router.route('/')
  .get(getPosts)
  .post(protect, upload.array('media', 5), createPost);

// 🔍 Search route — must be before /:id to avoid conflict
router.route('/search')
  .get(searchPosts);

router.route('/user/:userId')
  .get(getPostsByUser);

router.route('/:id')
  .get(getPostById)
  .put(protect, updatePost)
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
