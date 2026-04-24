import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'client', 'freelancer', 'admin'], default: 'user' },
  // ✅ ระบบ Role & Community
  profession: { 
    type: String, 
    enum: [
      'Photographer', 'Editor', 'Videographer', 'Director', 
      'Production Design', 'Creative Content', 'Film Production', 
      'Post Production', 'Digital Artist', 'General'
    ], 
    default: 'General' 
  },
  isAvailableForHire: { type: Boolean, default: true },

  // ✅ โบร๋เขียนตรงนี้ถูกเป๊ะแล้ว! Database พร้อมเก็บรูป
  profileImage: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' }
  },
  coverImage: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' }
  },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  bio: { type: String, default: '', maxlength: 300 },
  // ✅ ระบบเพื่อน
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [
    {
      from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
      createdAt: { type: Date, default: Date.now }
    }
  ],

  // 📦 [NEW] Freelance Workspace Features
  serviceTags: [{ type: String }],
  servicePackages: [
    {
      title: { type: String, required: true },
      price: { type: Number, required: true },
      description: { type: String },
      features: [{ type: String }],
      deliveryTime: { type: Number },
      createdAt: { type: Date, default: Date.now }
    }
  ],

  // 🏆 [GAMIFICATION] Ranking System
  points: { type: Number, default: 0 },
  rank: { 
    type: String, 
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Conqueror'], 
    default: 'Bronze' 
  },
  totalEarnings: { type: Number, default: 0 },
  totalViews: { type: Number, default: 0 },
  activeFrame: { type: String, default: 'none' },

  // 💰 [NEW] Wallet & Payments
  coinBalance: { type: Number, default: 0 },
  bankAccount: {
    bankName: { type: String, default: '' },
    accountName: { type: String, default: '' },
    accountNumber: { type: String, default: '' }
  },
  
  // 📍 [NEW] Contact & Basic Info (Redesign Match)
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  birthday: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other', 'None'], default: 'None' },

  // 💼 [NEW] Professional Experience
  experience: [
    {
      company: { type: String },
      role: { type: String },
      duration: { type: String },
      description: { type: String }
    }
  ],
  // 🔬 [NEW] Skills & Proficiency
  skills: [
    {
      name: { type: String },
      level: { type: Number, default: 0, min: 0, max: 100 }
    }
  ],
  // 🛡️ [NEW] Token Versioning for Security
  tokenVersion: { type: Number, default: 0 }
}, { timestamps: true });

// 🔒 เข้ารหัสผ่านอัตโนมัติก่อนบันทึกลง Database
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
    
    // 🛡️ [SECURITY] ถ้ามีการเปลี่ยนรหัสผ่าน ให้ขยับเวอร์ชัน Token 
    // เพื่อเตะ Session เก่าออกทั้งหมดทันที
    if (!this.isNew) {
      this.tokenVersion = (this.tokenVersion || 0) + 1;
    }
  }
  next();
});

// 🚀 [เพิ่มใหม่] ฟังก์ชันสำหรับเช็ครหัสผ่านตอน Login (ห้ามลืมตัวนี้!)
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;