import express from 'express';
import multer from 'multer';
import { protect, admin } from '../middleware/auth.js';
import { adminAdjustCoins, getWalletTransactions, requestWithdrawal, getAdminWithdrawals, updateWithdrawalStatus, getAuditLogs, submitManualTopup, getAdminTopups, updateTopupStatus } from '../controller/walletController.js';
import { topupLimiter } from '../middleware/rateLimiter.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 🚀 Memory Storage for slip verification (bypasses disk/GCS issues on Hostinger)
const memoryUpload = multer({ storage: multer.memoryStorage() });

// Disk storage for admin proof uploads (only used internally)
const tempDir = path.join(process.cwd(), 'uploads/temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
const diskUpload = multer({ dest: tempDir });

// User: Submit Manual Topup (Slip upload)
router.post('/topup-manual', protect, topupLimiter, diskUpload.single('slip'), submitManualTopup);

// Get Transaction History
router.get('/transactions', protect, getWalletTransactions);

// Request Withdrawal (Freelancer)
router.post('/withdraw', protect, requestWithdrawal);

// Admin: Manage Topups
router.get('/admin/topups', protect, admin, getAdminTopups);
router.patch('/admin/topups/:id/status', protect, admin, updateTopupStatus);

// Admin: Get all withdrawals
router.get('/admin/withdrawals', protect, admin, getAdminWithdrawals);

// Admin: Approve or reject a withdrawal (Supports optional proofImage upload)
router.patch('/admin/withdrawals/:id', protect, admin, diskUpload.single('proofImage'), updateWithdrawalStatus);

// Admin: Manual Balance Adjustment (Send coins directly)
router.post('/admin/adjust-balance', protect, admin, adminAdjustCoins);

// Admin: Get security audit logs
router.get('/admin/audit-logs', protect, admin, getAuditLogs);

export default router;
