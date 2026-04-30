import express from 'express';
import { sendVerificationEmail } from '../utils/sendEmail.js';

const router = express.Router();

/**
 * Route สำหรับทดสอบการส่งอีเมล
 * วิธีใช้: GET /api/test/email?email=อีเมลของคุณ
 */
router.get('/email', async (req, res) => {
  const targetEmail = req.query.email;

  if (!targetEmail) {
    return res.status(400).json({
      success: false,
      message: 'กรุณาระบุ email เช่น ?email=test@gmail.com'
    });
  }

  const timeStr = new Date().toLocaleTimeString('th-TH');
  const result = await sendVerificationEmail(
    targetEmail,
    'TEST_TOKEN_' + Date.now(),
    req,
    `🧪 PATTAYAPAL TEST [${timeStr}]`
  );

  if (result.success) {
    res.json({
      success: true,
      message: `เมลทดสอบถูกส่งออกไปแล้ว! โปรดตรวจสอบที่ ${targetEmail} (รวมถึงใน Spam ด้วย)`,
      config_used: {
        user: process.env.SMTP_USER,
        host: process.env.SMTP_HOST || 'gmail (default)',
        port: process.env.SMTP_PORT || 'default'
      }
    });
  } else {
    // ✅ แสดง Error จริงๆ ใน Response
    res.status(500).json({
      success: false,
      message: 'ส่งเมลไม่สำเร็จ!',
      error_detail: result.error,
      error_code: result.code,
      config_used: {
        user: process.env.SMTP_USER,
        host: process.env.SMTP_HOST || 'gmail (default)',
        port: process.env.SMTP_PORT || 'default',
        secure: process.env.SMTP_SECURE || 'not set'
      }
    });
  }
});

export default router;
