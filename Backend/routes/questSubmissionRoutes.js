import express from 'express';
import { submitProof, getAllSubmissions, reviewSubmission } from '../controller/questSubmissionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// User routes
router.post('/submit', protect, submitProof);

// Admin routes
router.get('/admin/all', protect, getAllSubmissions);
router.patch('/admin/:submissionId/review', protect, reviewSubmission);

export default router;
