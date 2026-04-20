import express from 'express';
import multer from 'multer';

// ✅ นำเข้าฟังก์ชันสุดเทพจาก Controller ที่เราเพิ่งแก้ไป
import { register, login, getProfile } from '../controller/authController.js';
import { protect } from '../middleware/auth.js';
import { uploadToGCS } from '../utils/gcs.js';
import User from '../models/User.js';
import path from 'path';

const router = express.Router();

// ── 📸 ตั้งค่า Multer สำหรับอัปโหลดรูปโปรไฟล์ ──
const upload = multer({ storage: multer.memoryStorage() });


// ==========================================
// 🚀 AUTH ROUTES (โยนงานให้ authController จัดการ)
// ==========================================
router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile); // 👈 ตัวนี้แหละที่ Navbar จะวิ่งมาขอข้อมูลล่าสุด!


// ==========================================
// 📸 PROFILE IMAGE UPLOAD ROUTE
// ==========================================
router.patch('/profile-image', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "กรุณาเลือกรูปภาพ" });
    }

    // อัปโหลดขึ้น GCS
    const imageUrl = await uploadToGCS(req.file); 

    // หา User จาก ID ที่แนบมากับ Token
    // (req.user มาจาก middleware protect)
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้งานในระบบ" });
    }

    // อัปเดตฟิลด์ profileImage
    user.profileImage = { url: imageUrl, publicId: path.basename(imageUrl) };
    await user.save();

    res.status(200).json({
      message: "อัปเดตรูปโปรไฟล์สำเร็จ",
      profileImage: user.profileImage
    });
  } catch (err) {
    console.error("Profile Image Upload Error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่ Server: " + err.message });
  }
});

export default router;