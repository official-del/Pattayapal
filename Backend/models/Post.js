import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  content: { 
    type: String, 
    default: '' 
  },
  postType: { 
    type: String, 
    enum: ['hiring', 'looking_for_work', 'general'], 
    default: 'general' 
  },
  media: [{
    url: String,
    publicId: String
  }],
  sharedPackage: {
    title: { type: String },
    price: { type: Number },
    description: { type: String },
    deliveryTime: { type: Number },
    features: [{ type: String }],
    coverImages: [{
      url: { type: String },
      publicId: { type: String }
    }],
    ownerName: { type: String },
    ownerUsername: { type: String },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  likes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    replies: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: String,
      createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);
export default Post;
