import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (userEmail, token) => {
  try {
    let transporter;

    // Use actual SMTP if provided
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      // Fallback to Ethereal Email for testing
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('⚠️ Using Ethereal Email for testing. Check console for email preview link.');
    }

    // Use FRONTEND_URL if provided, else fallback to localhost for testing
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify-email/${token}`;

    const mailOptions = {
      from: process.env.SMTP_USER || '"Pattayapal Team" <no-reply@pattayapal.com>',
      to: userEmail,
      subject: 'Verify your Pattayapal account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px; text-align: center; background-color: #0a0a0a; color: #fff; border: 1px solid #333; border-radius: 15px;">
          <h1 style="color: #ff5733; margin-bottom: 10px; letter-spacing: 2px;">PATTAYAPAL</h1>
          <h2 style="font-weight: 400; color: #ddd; margin-bottom: 30px;">Welcome to the community!</h2>
          <p style="color: #aaa; margin-bottom: 40px; line-height: 1.6;">Please click the button below to verify your email address and activate your account.</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 15px 40px; background-color: #ff5733; color: #fff; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; letter-spacing: 1px;">VERIFY EMAIL</a>
          <p style="color: #666; font-size: 12px; margin-top: 40px;">If you did not request this account, please ignore this email.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (!process.env.SMTP_USER) {
      console.log('📧 Email sent! Verification URL Preview: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('❌ [SMTP Error] Detailed Error:', error);
    if (error.code === 'EAUTH') {
      console.error('🔑 [SMTP Error] Authentication failed! Please check your SMTP_USER and SMTP_PASS (App Password).');
    }
    return false;
  }
};
