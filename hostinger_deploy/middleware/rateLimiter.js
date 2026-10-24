import rateLimit from 'express-rate-limit';

// ── Topup: สูงสุด 5 ครั้ง / ชั่วโมง / IP
export const topupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hr
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'คุณเติม Coin บ่อยเกินไป กรุณารอ 1 ชั่วโมงก่อนลองใหม่' },
  validate: { default: false }, // 💡 ปิดการเตือนเรื่อง IPv6 เพื่อให้รันได้
  keyGenerator: (req) => req.user?.id || req.ip, 
  skip: (req) => req.user?.role === 'admin',
});

// ── Job Create: สูงสุด 15 ครั้ง / ชั่วโมง / user
export const jobCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'คุณสร้างงานบ่อยเกินไป กรุณารอสักครู่' },
  validate: { default: false },
  keyGenerator: (req) => req.user?.id || req.ip,
  skip: (req) => req.user?.role === 'admin',
});

// ── Auth: สูงสุด 10 ครั้ง / 15 นาที / IP (กัน brute force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false },
  message: { message: 'คุณ Login ผิดบ่อยเกินไป กรุณารอ 15 นาทีก่อนลองใหม่' },
});

// ── API General: สูงสุด 200 requests / นาที / IP
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false },
  message: { message: 'Too many requests, please slow down.' },
});
