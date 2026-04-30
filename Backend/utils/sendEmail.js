import nodemailer from 'nodemailer';

/**
 * Send a verification email to a user.
 * @param {string} userEmail - Recipient email.
 * @param {string} token - Verification token.
 * @param {object} req - Optional Express request object for dynamic URL detection.
 */
export const sendVerificationEmail = async (userEmail, token, req = null) => {
  try {
    let transporter;

    // SMTP Configuration from Environment Variables
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT);

    if (smtpUser && smtpPass) {
      const smtpOptions = {
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      };

      if (smtpHost) {
        // Use custom SMTP host (e.g., Hostinger, GoDaddy, etc.)
        smtpOptions.host = smtpHost;
        smtpOptions.port = smtpPort || 465;
        smtpOptions.secure = process.env.SMTP_SECURE === 'true' || smtpOptions.port === 465;
        
        // Fix for some shared hosts that have certificate issues
        smtpOptions.tls = {
          rejectUnauthorized: false
        };
      } else {
        // Default to Gmail service
        smtpOptions.service = 'gmail';
      }

      transporter = nodemailer.createTransport(smtpOptions);
    } else {
      // Fallback to Ethereal Email for testing if no SMTP is provided
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
    }

    // Determine Frontend URL dynamically
    let frontendUrl = process.env.FRONTEND_URL;
    
    // If not in .env, try to detect from the request headers
    if (!frontendUrl && req) {
      frontendUrl = req.headers.origin || `${req.protocol}://${req.get('host')}`;
    }
    
    // Ultimate fallback
    if (!frontendUrl || frontendUrl.includes('localhost') && req?.headers.origin) {
      frontendUrl = req.headers.origin;
    }
    if (!frontendUrl) frontendUrl = 'https://pattayapal.com';

    const verificationUrl = `${frontendUrl}/verify-email/${token}`;

    const mailOptions = {
      from: smtpUser || '"Pattayapal Team" <no-reply@pattayapal.com>',
      to: userEmail,
      subject: 'Verify your Pattayapal account',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px; text-align: center; background-color: #050505; color: #fff; border: 1px solid #1a1a1a; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
          <div style="margin-bottom: 30px;">
             <h1 style="color: #ff5733; margin: 0; font-size: 28px; letter-spacing: 4px; font-weight: 900;">PATTAYAPAL</h1>
             <div style="height: 2px; width: 50px; background: #ff5733; margin: 10px auto;"></div>
          </div>
          
          <h2 style="font-weight: 600; color: #fff; margin-bottom: 20px; font-size: 22px;">Verify Your Identity</h2>
          <p style="color: #888; margin-bottom: 35px; line-height: 1.6; font-size: 16px;">Welcome to the elite circle of creators. Please verify your email to unlock all platform features.</p>
          
          <a href="${verificationUrl}" style="display: inline-block; padding: 18px 50px; background: linear-gradient(135deg, #ff5733 0%, #e64a19 100%); color: #fff; text-decoration: none; border-radius: 100px; font-weight: 800; font-size: 16px; letter-spacing: 1px; box-shadow: 0 10px 20px rgba(255, 87, 51, 0.3); transition: transform 0.3s ease;">VERIFY ACCOUNT</a>
          
          <div style="margin-top: 45px; padding-top: 30px; border-top: 1px solid #1a1a1a;">
            <p style="color: #444; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
            <p style="color: #ff5733; font-size: 11px; font-weight: 700; margin-top: 10px;">&copy; 2026 PATTAYAPAL LUXURY PORTFOLIO</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('❌ [SMTP Error] Failed to send email:', error.message);
    return false;
  }
};
