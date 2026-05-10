import express from 'express';
import multer from 'multer';
import { protect, admin } from '../middleware/auth.js';
import { adminAdjustCoins, adminAdjustGas, getWalletTransactions, requestWithdrawal, getAdminWithdrawals, updateWithdrawalStatus, getAuditLogs, submitManualTopup, getAdminTopups, updateTopupStatus, refillGas } from '../controller/walletController.js';
import { topupLimiter } from '../middleware/rateLimiter.js';
import rateLimit from 'express-rate-limit';
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

// Refill Gas (User)
const gasRefillLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'คุณเติม Gas บ่อยเกินไป กรุณารอ 1 ชั่วโมงก่อนลองใหม่' },
  validate: { default: false },
  keyGenerator: (req) => req.user?.id || req.ip,
});
router.post('/refill-gas', protect, gasRefillLimiter, refillGas);

// Admin: Manage Topups
router.get('/admin/topups', protect, admin, getAdminTopups);
router.patch('/admin/topups/:id/status', protect, admin, updateTopupStatus);

// Admin: Get all withdrawals
router.get('/admin/withdrawals', protect, admin, getAdminWithdrawals);

// Admin: Approve or reject a withdrawal (Supports optional proofImage upload)
router.patch('/admin/withdrawals/:id', protect, admin, diskUpload.single('proofImage'), updateWithdrawalStatus);

// Admin: Manual Balance Adjustment (Send coins directly)
router.post('/admin/adjust-balance', protect, admin, adminAdjustCoins);

// Admin: Manual Gas Adjustment (Send gas directly)
router.post('/admin/adjust-gas', protect, admin, adminAdjustGas);

// Admin: Get security audit logs
router.get('/admin/audit-logs', protect, admin, getAuditLogs);

export default router;
