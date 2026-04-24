import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'pattayapal_secret_key'; // 👈 เพิ่ม Fallback ให้ตรงกับตอน Login
      const decoded = jwt.verify(token, secret);
      
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return res.status(401).json({ message: 'ไม่พบผู้ใช้งานนี้ในระบบ' });

      req.user = user;
      next();
    } catch (error) {
      console.error('🛡️ Auth Middleware Error:', error.message);
      return res.status(401).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
  }
  if (!token) return res.status(401).json({ message: 'ไม่มีสิทธิ์เข้าถึง, กรุณาล็อกอิน' });
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึง, สำหรับผู้ดูแลระบบเท่านั้น' });
  }
};