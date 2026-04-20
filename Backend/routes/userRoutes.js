import express from 'express';
import multer from 'multer';
import { uploadToGCS, deleteFromGCS } from '../utils/gcs.js';
import fs from 'fs';
import path from 'path';

import { register, login, getProfile } from '../controller/authController.js';
import { protect, admin } from '../middleware/auth.js';
import User from '../models/User.js';
import {
  getPublicProfile,
  getFriendStatus,
  sendFriendRequest,
  respondFriendRequest,
  removeFriend,
  cancelFriendRequest,
  updateProfile,
  getMyFriendRequests,
  searchUsers,
  getDashboardSummary,
  getAdminStats,
  getAllUsersAdmin,
  getOnlineUsers,
  getLeaderboard,
  getRankProgress
} from '../controller/userController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Auth Routes
router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);

// ==========================================
// 📸 PROFILE IMAGE UPLOAD ROUTE
// ==========================================
router.patch('/profile-image', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "กรุณาเลือกรูปภาพ" });
    
    // อัปโหลดขึ้น GCS
    const imageUrl = await uploadToGCS(req.file);
    
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้งานในระบบ" });

    // ลบรูปเก่า (ถ้ามี)
    if (user.profileImage?.url) await deleteFromGCS(user.profileImage.url);

    user.profileImage = { url: imageUrl, publicId: path.basename(imageUrl) };
    await user.save();
    res.status(200).json({ message: "อัปเดตสำเร็จ", profileImage: user.profileImage });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด: " + err.message });
  }
});

router.patch('/cover-image', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "กรุณาเลือกรูปภาพ" });
    
    // อัปโหลดขึ้น GCS
    const imageUrl = await uploadToGCS(req.file);
    
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้งานในระบบ" });
    
    // ลบรูปเก่า (ถ้ามี)
    if (user.coverImage?.url) await deleteFromGCS(user.coverImage.url);
    
    user.coverImage = { url: imageUrl, publicId: path.basename(imageUrl) };
    await user.save();
    res.status(200).json({ message: "อัปเดตสำเร็จ", coverImage: user.coverImage });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด: " + err.message });
  }
});

// ✅ Route สำหรับลบรูปโปรไฟล์
router.delete('/profile-image', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    
    // ลบจาก GCS
    if (user.profileImage?.url) {
      await deleteFromGCS(user.profileImage.url);
    }

    user.profileImage = null;
    await user.save();
    res.json({ message: "ลบรูปโปรไฟล์สำเร็จ" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ✅ Route สำหรับลบรูปหน้าปก
router.delete('/cover-image', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    
    // ลบจาก GCS
    if (user.coverImage?.url) {
      await deleteFromGCS(user.coverImage.url);
    }

    user.coverImage = null;
    await user.save();
    res.json({ message: "ลบรูปพื้นหลังสำเร็จ" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ==========================================
// 🏆 GAMIFICATION ROUTES (Static first to avoid conflicts)
// ==========================================
router.get('/leaderboard', getLeaderboard);
router.get('/me/rank-progress', protect, getRankProgress);
router.get('/me/dashboard-summary', protect, getDashboardSummary);
router.get('/me/friend-requests', protect, getMyFriendRequests);
router.get('/online', protect, getOnlineUsers);

// ==========================================
// 👤 PUBLIC PROFILE ROUTES
// ==========================================
router.get('/:id/public', getPublicProfile);

// ==========================================
// 👥 FRIEND SYSTEM ROUTES (ต้อง login)
// ==========================================
router.get('/:id/friend-status', protect, getFriendStatus);
router.post('/:id/friend-request', protect, sendFriendRequest);
router.put('/:id/friend-request', protect, respondFriendRequest);
router.delete('/:id/friend', protect, removeFriend);
router.delete('/:id/friend-request', protect, cancelFriendRequest);
router.patch('/me/profile', protect, updateProfile);
router.get('/search', protect, searchUsers);
router.get('/admin/stats', protect, admin, getAdminStats);
router.get('/admin/all', protect, admin, getAllUsersAdmin);

export default router;