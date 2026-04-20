import User from '../models/User.js';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const { name, email, password, profession } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      role: 'user',
      profession: profession || 'General',
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      // 💡 ส่งข้อมูลกลับไปให้หน้าบ้านเก็บลง localStorage
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
        coinBalance: user.coinBalance,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

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
        coinBalance: user.coinBalance,
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
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};