import express from 'express';
import multer from 'multer';
import { submitProof, getAllSubmissions, reviewSubmission } from '../controller/questSubmissionController.js';
import { protect, admin } from '../middleware/auth.js';
import { buildDiskUploadOptions, imageOnlyFileFilter, maxImageUploadBytes } from '../middleware/uploadConfig.js';

const router = express.Router();
const upload = multer(buildDiskUploadOptions('uploads/temp/', {
  fileSize: maxImageUploadBytes,
  files: 1,
  fileFilter: imageOnlyFileFilter,
}));

// User routes
router.post('/submit', protect, upload.single('image'), submitProof);

// Admin routes
router.get('/admin/all', protect, admin, getAllSubmissions);
router.patch('/admin/:submissionId/review', protect, admin, reviewSubmission);

export default router;
