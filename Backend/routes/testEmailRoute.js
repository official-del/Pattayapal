import express from 'express';
import { sendVerificationEmail } from '../utils/sendEmail.js';

const router = express.Router();

/**
 * Route สำหรับทดสอบการส่งอีเมลโดยเฉพาะ
 * วิธีใช้: GET /api/test/email?email=อีเมลของคุณ
 */
router.get('/email', async (req, res) => {
  const targetEmail = req.query.email;
  
  if (!targetEmail) {
    return res.status(400).json({ 
      success: false, 
      message: 'กรุณาระบุ email ที่ต้องการทดสอบใน query string เช่น ?email=test@gmail.com' 
    });
  }

  console.log(`[Test] Attempting to send test email to: ${targetEmail}`);
  
  const success = await sendVerificationEmail(targetEmail, 'TEST_TOKEN_' + Date.now(), req);
  
  if (success) {
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
    res.status(500).json({ 
      success: false, 
      message: 'ส่งเมลไม่สำเร็จ! กรุณาตรวจสอบ Console Log ของ Backend เพื่อดู Error รายละเอียดครับ',
      hint: 'ตรวจสอบ SMTP_USER และ SMTP_PASS ใน .env ว่าถูกต้องหรือไม่'
    });
  }
});

export default router;
