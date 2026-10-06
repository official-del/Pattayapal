import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createJob,
  getMySentJobs,
  getMyReceivedJobs,
  updateJobStatus,
  updateJobProgress
} from '../controller/jobController.js';
import { jobCreateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/', protect, jobCreateLimiter, createJob);
router.get('/sent', protect, getMySentJobs);
router.get('/received', protect, getMyReceivedJobs);
router.patch('/:jobId/status', protect, updateJobStatus);
router.patch('/:jobId/progress', protect, updateJobProgress);

export default router;
