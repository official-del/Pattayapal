import express from 'express';
import { getActiveQuests, createQuest, acceptQuest, claimQuest, updateQuest, deleteQuest } from '../controller/questController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getActiveQuests);
router.post('/', protect, createQuest);
router.put('/:questId', protect, updateQuest);
router.delete('/:questId', protect, deleteQuest);
router.post('/:questId/accept', protect, acceptQuest);
router.post('/:questId/claim', protect, claimQuest);

export default router;
