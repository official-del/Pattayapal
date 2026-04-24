import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // ✅ รับ Token จาก Authorization header (มาตรฐาน)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 🔄 Fallback: รับจาก x-auth-token (กรณี Proxy สกัด Authorization header)
  else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }

  if (!token || token === 'null' || token === 'undefined') {
    console.error('🛡️ Auth Middleware Error: Token missing or null from headers');
    return res.status(401).json({ message: 'ไม่มีสิทธิ์เข้าถึง, Token เป็นค่าว่าง', tokenValue: token });
  }

  try {
    const secret = process.env.JWT_SECRET || 'pattayapal_secret_key';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.error(`🛡️ Auth Middleware Error: User not found for ID ${decoded.id}`);
      return res.status(401).json({ message: `ไม่พบผู้ใช้งานนี้ในระบบ (ID: ${decoded.id})` });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('🛡️ Auth Middleware Error: JWT verify failed', error.message);
    return res.status(401).json({ message: `Token ไม่ถูกต้องหรือหมดอายุ: ${error.message}`, tokenStart: token.substring(0, 10) });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึง, สำหรับผู้ดูแลระบบเท่านั้น' });
  }
};