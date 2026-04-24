import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// 📝 1. API สมัครสมาชิก (Register)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, profession } = req.body;

    // เช็คว่ามีอีเมลนี้ในระบบหรือยัง
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว!' });

    // สร้าง User ใหม่ พร้อมบันทึกสายอาชีพ
    const newUser = new User({ 
      name, 
      email, 
      password, 
      role: 'user',
      profession: profession || 'General'
    });
    await newUser.save();

    res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ' });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์', error: error.message });
  }
});

// 🔐 2. API เข้าสู่ระบบ (Login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // หา User จากอีเมล
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้งานนี้' });

    // เทียบรหัสผ่านที่พิมพ์มา กับรหัสที่เข้ารหัสไว้ใน Database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'รหัสผ่านไม่ถูกต้อง!' });

    // สร้าง Token (บัตรผ่านประตู)
    const token = jwt.sign(
      { id: user._id, role: user.role, tokenVersion: user.tokenVersion || 0 }, 
      process.env.JWT_SECRET || 'pattayapal_secret_key', 
      { expiresIn: '3650d' } // 👈 อยู่ยาวๆ 10 ปี จนกว่าจะกด Logout เอง
    );

    res.status(200).json({
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: { 
        id: user._id, 
        _id: user._id, // ✅ คืนค่า _id เพื่อให้ระบบเดิมและ Navbar ทำงานได้สมบูรณ์
        name: user.name, 
        email: user.email, 
        role: user.role,
        profession: user.profession,
        isAvailableForHire: user.isAvailableForHire,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์', error: error.message });
  }
});

export default router;