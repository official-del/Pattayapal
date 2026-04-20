import Post from '../models/Post.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { updateUserStats } from '../utils/rankHandler.js';
import { uploadToGCS } from '../utils/gcs.js';
import path from 'path';

export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name profileImage profession rank')
      .populate('comments.user', 'name profileImage')
      .populate('comments.replies.user', 'name profileImage')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createPost = async (req, res) => {
  try {
    const { content, postType } = req.body;
    const author = req.user.id;

    const media = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToGCS(file);
        media.push({ url, publicId: path.basename(url) });
      }
    }

    const newPost = new Post({
      author,
      content,
      postType,
      media
    });

    await newPost.save();
    
    // Reward for posting
    const io = req.app.get('io');
    updateUserStats(author, 'POST', {}, io).catch(err => console.error(err));

    const populatedPost = await Post.findById(newPost._id).populate('author', 'name profileImage profession rank');
    res.status(201).json(populatedPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const index = post.likes.indexOf(req.user.id);
    if (index === -1) {
      post.likes.push(req.user.id);
      
      // 🏆 Reward Author for the like
      const io = req.app.get('io');
      updateUserStats(post.author, 'LIKE', {}, io).catch(err => console.error(err));
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();
    res.json({ likes: post.likes, isLiked: index === -1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const commentPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const newComment = {
      user: req.user.id,
      text: req.body.text
    };

    post.comments.push(newComment);
    await post.save();

    // 🔔 Send Notification to Post Author
    if (post.author.toString() !== req.user.id) {
       try {
         const commentingUser = await User.findById(req.user.id);
         const textPreview = req.body.text.length > 30 ? req.body.text.substring(0, 30) + '...' : req.body.text;
         const note = new Notification({
           recipient: post.author,
           sender: req.user.id,
           type: 'comment',
           referenceId: post._id,
           text: `${commentingUser.name} ได้แสดงความคิดเห็นในโพสต์ของคุณ: "${textPreview}"`,
           link: '/feed'
         });
         await note.save();

         const io = req.app.get('io');
         if (io) {
           io.to(post.author.toString()).emit('new_notification', {
             ...note._doc,
             sender: { name: commentingUser.name, profileImage: commentingUser.profileImage }
           });
         }
       } catch (err) {
         console.error('Comment Notification Error:', err);
       }
    }

    const populatedPost = await Post.findById(post._id)
       .populate('comments.user', 'name profileImage')
       .populate('comments.replies.user', 'name profileImage');

    res.json(populatedPost.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== req.user.id) {
       // Allow admins to also delete in the future, for now protect it
       const user = await User.findById(req.user.id);
       if (user.role !== 'admin') {
         return res.status(403).json({ message: "Not authorized" });
       }
    }

    // ลบไฟล์ Media จาก GCS
    if (post.media && post.media.length > 0) {
      for (const item of post.media) {
        if (item.url) await deleteFromGCS(item.url);
      }
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.find(c => c._id.toString() === req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    let canDelete = false;
    const currentUserId = String(req.user.id);
    const commentOwnerId = comment.user ? String(comment.user) : null;
    const postOwnerId = post.author ? String(post.author) : null;

    if (commentOwnerId === currentUserId || postOwnerId === currentUserId) {
      canDelete = true;
    } else {
      const user = await User.findById(req.user.id);
      if (user && user.role === 'admin') canDelete = true;
    }

    if (!canDelete) return res.status(403).json({ message: "Not authorized to delete this comment" });

    post.comments = post.comments.filter(c => c._id.toString() !== req.params.commentId);
    await post.save();

    const populatedPost = await Post.findById(post._id)
       .populate('comments.user', 'name profileImage')
       .populate('comments.replies.user', 'name profileImage');

    res.json(populatedPost.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const replyCommentPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id ? post.comments.id(req.params.commentId) : post.comments.find(c => c._id.toString() === req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const newReply = {
      user: req.user.id,
      text: req.body.text
    };

    comment.replies.push(newReply);
    await post.save();

    // 🔔 Send Notification to parent comment Author
    if (comment.user && comment.user.toString() !== req.user.id) {
       try {
         const replyingUser = await User.findById(req.user.id);
         const textPreview = req.body.text.length > 30 ? req.body.text.substring(0, 30) + '...' : req.body.text;
         const note = new Notification({
           recipient: comment.user,
           sender: req.user.id,
           type: 'comment',
           referenceId: post._id,
           text: `${replyingUser.name} ได้ตอบกลับคอมเมนต์ของคุณ: "${textPreview}"`,
           link: '/feed'
         });
         await note.save();

         const io = req.app.get('io');
         if (io) {
           io.to(comment.user.toString()).emit('new_notification', {
             ...note._doc,
             sender: { name: replyingUser.name, profileImage: replyingUser.profileImage }
           });
         }
       } catch (err) {
         console.error('Reply Notification Error:', err);
       }
    }

    const populatedPost = await Post.findById(post._id)
       .populate('comments.user', 'name profileImage')
       .populate('comments.replies.user', 'name profileImage');

    res.json(populatedPost.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
