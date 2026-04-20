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
