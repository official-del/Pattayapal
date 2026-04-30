import express from 'express';
import multer from 'multer';
import { uploadToGCS } from '../utils/gcs.js';
import { submitProof, getAllSubmissions, reviewSubmission } from '../controller/questSubmissionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// User routes
router.post('/submit', protect, upload.single('image'), submitProof);

// Admin routes
router.get('/admin/all', protect, getAllSubmissions);
router.patch('/admin/:submissionId/review', protect, reviewSubmission);

export default router;
