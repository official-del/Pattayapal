import express from 'express';
import { getActiveQuests, createQuest, acceptQuest, claimQuest, updateQuest, deleteQuest } from '../controller/questController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getActiveQuests);
router.post('/', protect, admin, createQuest);
router.put('/:questId', protect, admin, updateQuest);
router.delete('/:questId', protect, admin, deleteQuest);
router.post('/:questId/accept', protect, acceptQuest);
router.post('/:questId/claim', protect, claimQuest);

export default router;
