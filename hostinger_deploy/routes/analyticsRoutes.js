import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getViewTrend,
  getPlatformBreakdown,
  getProfileAnalytics,
} from '../controller/analyticsController.js';

const router = express.Router();

// GET /api/analytics/views      -> เทรนด์ยอดเข้าชม 7 วันล่าสุด (ของ user ที่ login)
router.get('/views', protect, getViewTrend);

// GET /api/analytics/platforms  -> สัดส่วนแพลตฟอร์ม (Facebook, IG, TikTok)
router.get('/platforms', protect, getPlatformBreakdown);

// GET /api/analytics/profile    -> ข้อมูลสรุปโปรไฟล์ผู้ใช้ (เปิดใช้ใน Dashboard)
router.get('/profile', protect, getProfileAnalytics);

export default router;
