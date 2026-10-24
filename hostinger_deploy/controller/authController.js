import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendVerificationEmail } from '../utils/sendEmail.js';

const normalizeName = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const duplicateMessage = (field) => field === 'nameKey'
  ? 'This user name is already in use.'
  : 'This email address is already in use.';

const signUserToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    { id: user._id, role: user.role, tokenVersion: user.tokenVersion || 0 },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
};

export const register = async (req, res) => {
  try {
    const { name, email, password, profession, phone } = req.body;
    const normalizedName = normalizeName(name);
    const normalizedEmail = normalizeEmail(email);
    const nameKey = normalizedName.toLowerCase();

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const [emailUser, nameUser] = await Promise.all([
      User.findOne({ email: normalizedEmail }).collation({ locale: 'en', strength: 2 }),
      User.findOne({
        $or: [
          { nameKey },
          { name: normalizedName },
        ],
      }).collation({ locale: 'en', strength: 2 }),
    ]);

    if (nameUser && (!emailUser || String(nameUser._id) !== String(emailUser._id))) {
      return res.status(409).json({ message: duplicateMessage('nameKey') });
    }

    let user = emailUser;
    if (user) {
      if (user.isEmailVerified) {
        return res.status(409).json({ message: duplicateMessage('email') });
      } else {
        // User exists but is not verified: Update info and resend email
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.name = normalizedName;
        user.nameKey = nameKey;
        user.email = normalizedEmail;
        user.password = password; 
        user.profession = profession || 'General';
        user.phone = phone || '';
        user.verificationToken = verificationToken;
        user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
        
        await user.save();
        await sendVerificationEmail(user.email, verificationToken, req);
        
        return res.status(200).json({
          message: 'This email was previously registered but not verified. A new verification link has been sent to your inbox.',
        });
      }
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create new user
    user = new User({
      name: normalizedName,
      nameKey,
      email: normalizedEmail,
      password,
      role: 'user',
      profession: profession || 'General',
      phone: phone || '',
      isEmailVerified: false,
      verificationToken,
      verificationTokenExpires
    });

    await user.save();
 
    // Send verification email
    const emailResult = await sendVerificationEmail(user.email, verificationToken, req);
    if (!emailResult.success) {
      console.error('[Register] Email send failed:', emailResult.error);
    }

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
    });
  } catch (error) {
    if (error?.code === 11000) {
      const field = Object.keys(error.keyPattern || error.keyValue || {})[0];
      return res.status(409).json({ message: duplicateMessage(field) });
    }
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Check for user
    const user = await User.findOne({ email }).collation({ locale: 'en', strength: 2 });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check email verification
    if (!user.isEmailVerified) {
      return res.status(401).json({ message: 'Please verify your email before logging in. Check your inbox.' });
    }

    const token = signUserToken(user);

    res.status(200).json({
      token,
      // 💡 จุดสำคัญ: ตอน Login สำเร็จ ต้องส่งรูปกลับไปด้วย
      user: {
        id: user._id,
        _id: user._id, // เพิ่ม _id ให้ชัวร์ว่าหน้าบ้านดึงไปใช้ได้
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        profession: user.profession,
        profileImage: user.profileImage,
        totalViews: user.totalViews,
        totalEarnings: user.totalEarnings,
        coinBalance: user.coinBalance || 0,
        points: user.points,
        gas: user.gas || 0,
        gasBalance: user.gas || 0,
        claimedQuests: user.claimedQuests,
        canCreateQuest: user.canCreateQuest,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    // 💡 .select('-password') เป็นทริคเพิ่มความปลอดภัย ไม่ให้ส่งรหัสผ่านกลับไปหน้าบ้านครับ
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Calculate worksCount dynamically
    const Work = (await import('../models/Work.js')).default;
    const worksCount = await Work.countDocuments({ createdBy: user._id });
    
    const userObj = user.toObject();
    userObj.worksCount = worksCount;
    
    res.status(200).json(userObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
