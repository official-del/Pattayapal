import express from 'express';
import multer from 'multer';
import { protect, admin } from '../middleware/auth.js';
import { topupWallet, getWalletTransactions, requestWithdrawal, getAdminWithdrawals, updateWithdrawalStatus, getAuditLogs } from '../controller/walletController.js';
import { topupLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Topup with Slip
router.post('/topup', protect, topupLimiter, upload.single('slip'), topupWallet);

// Get Transaction History
router.get('/transactions', protect, getWalletTransactions);

// Request Withdrawal (Freelancer)
router.post('/withdraw', protect, requestWithdrawal);

// Admin: Get all withdrawals
router.get('/admin/withdrawals', protect, admin, getAdminWithdrawals);

// Admin: Approve or reject a withdrawal (Supports optional proofImage upload)
router.patch('/admin/withdrawals/:id', protect, admin, upload.single('proofImage'), updateWithdrawalStatus);

// Admin: Get security audit logs
router.get('/admin/audit-logs', protect, admin, getAuditLogs);

export default router;

