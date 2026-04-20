import mongoose from 'mongoose';

const workSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'กรุณาระบุชื่อผลงาน'],
    trim: true
  },
  slug: {
    type: String,
    lowercase: true,
    index: true
  },
  description: { type: String },
  shortDescription: {
    type: String,
    maxlength: [160, 'คำอธิบายสั้นต้องไม่เกิน 160 ตัวอักษร']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    index: true
  },
  client: { type: String },
  projectDate: { type: Date, default: Date.now },
  link: { type: String },
  technologies: {
    type: [String],
    default: []
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  mainImage: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  album: [
    {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      caption: { type: String, default: '' }
    }
  ],
  videoUrl: { type: String, default: '' },
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'draft',
    index: true
  },
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  showOnSlider: {
    type: Boolean,
    default: false,
    index: true
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  viewedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  // ✅ ตรวจสอบ Comments Array
  comments: [
    {
      user: { type: String, required: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      text: { type: String, required: true },
      profileImage: { type: String, default: "" },
      replies: [{
        user: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        text: { type: String, required: true },
        profileImage: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now }
      }],
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

workSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  }
  next();
});

export default mongoose.model('Work', workSchema);