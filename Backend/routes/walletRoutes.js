import express from 'express';
import multer from 'multer';
import { protect, admin } from '../middleware/auth.js';
import { topupWallet, getWalletTransactions, requestWithdrawal, getAdminWithdrawals, updateWithdrawalStatus, getAuditLogs } from '../controller/walletController.js';
import { topupLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();
import path from 'path';
import fs from 'fs';

// 🚀 Memory Storage for slip verification (bypasses disk/GCS issues on Hostinger)
const memoryUpload = multer({ storage: multer.memoryStorage() });

// Disk storage for admin proof uploads (only used internally)
const tempDir = path.join(process.cwd(), 'uploads/temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
const diskUpload = multer({ dest: tempDir });

// Topup with Slip - use memory storage so buffer is always available
router.post('/topup', protect, topupLimiter, memoryUpload.single('slip'), topupWallet);

// Get Transaction History
router.get('/transactions', protect, getWalletTransactions);

// Request Withdrawal (Freelancer)
router.post('/withdraw', protect, requestWithdrawal);

// Admin: Get all withdrawals
router.get('/admin/withdrawals', protect, admin, getAdminWithdrawals);

// Admin: Approve or reject a withdrawal (Supports optional proofImage upload)
router.patch('/admin/withdrawals/:id', protect, admin, diskUpload.single('proofImage'), updateWithdrawalStatus);

// Admin: Get security audit logs
router.get('/admin/audit-logs', protect, admin, getAuditLogs);

export default router;

