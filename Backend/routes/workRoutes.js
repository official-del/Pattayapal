import express from 'express';
const router = express.Router();
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import { buildDiskUploadOptions, mediaFileFilter } from '../middleware/uploadConfig.js';
import {
  createWork,
  getWorks,
  getWorkById,
  getWorksByUser,
  updateWork,
  deleteWork
} from '../controller/workController.js';

import Work from '../models/Work.js';
import { updateUserStats } from '../utils/rankHandler.js';

import path from 'path';
import fs from 'fs';
const tempDir = path.join(process.cwd(), 'uploads/temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
const upload = multer(buildDiskUploadOptions(tempDir, {
  files: 11,
  fileFilter: mediaFileFilter,
}));

// ✅ Define upload fields for Multer
const uploadFields = upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'album', maxCount: 10 }
]);

// ✅ Define missing routes
router.get('/', getWorks);
router.post('/', protect, uploadFields, createWork);
router.get('/user/:userId', getWorksByUser);
router.get('/:id', getWorkById);
router.post('/:id/like', protect, async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);
    if (!work) return res.status(404).json({ message: "ไม่พบผลงาน" });

    // ตรวจสอบว่า User คนนี้เคย Like ไปหรือยัง
    const index = work.likes.findIndex((id) => id.toString() === req.user._id.toString());

    if (index === -1) {
      // ยังไม่เคย Like -> ให้เพิ่ม ID เข้าไป
      work.likes.push(req.user._id);
      
      // 🏆 Reward Creator for the like (if not self-like)
      if (work.createdBy.toString() !== req.user._id.toString()) {
        const io = req.app.get('io');
        updateUserStats(work.createdBy, 'LIKE', {}, io).catch(err => console.error(err));
      }
    } else {
      // เคย Like แล้ว -> ให้เอา ID ออก (Unlike)
      work.likes.splice(index, 1);
    }

    await work.save();

    res.json({
      likesCount: work.likes.length,
      isLiked: work.likes.some((id) => id.toString() === req.user._id.toString())
    });
  } catch (err) {
    console.error("🔥 Like Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Increment View Count (Unique)
router.post('/:id/view', async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);
    if (!work) return res.status(404).json({ message: "ไม่พบผลงาน" });

    const viewerId = req.user?.id || req.user?._id;
    const viewerIp = req.ip;
    const isOwner = viewerId && viewerId.toString() === work.createdBy.toString();

    if (!isOwner) {
      try {
        const WorkView = (await import('../models/WorkView.js')).default;
        const viewData = { workId: work._id };
        if (viewerId) viewData.viewerId = viewerId;
        else viewData.viewerIp = viewerIp;

        await WorkView.create(viewData);
        work.views = (work.views || 0) + 1;
        await work.save();
      } catch (err) {
        if (err.code !== 11000) { // Ignore duplicate key errors
          console.error("Work view error:", err);
        }
      }
    }

    res.json({ views: work.views });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ แก้ไข Route Comment ให้เสถียรขึ้น
router.post('/:id/comment', protect, async (req, res) => {
  try {
    // ✅ เพิ่ม userId เพื่อลิงก์ไปหน้า Profile ได้
    const { text } = req.body;
    const commentUserName = req.user.name || 'User';
    const commentUserId = req.user._id;
    const commentProfileImage = req.user.profileImage?.url || "";

    if (!text) return res.status(400).json({ message: "กรุณาพิมพ์ข้อความคอมเมนต์" });
    const work = await Work.findById(req.params.id);
    if (!work) return res.status(404).json({ message: "ไม่พบผลงานนี้ในระบบ" });

    const newComment = {
      user: commentUserName,
      userId: commentUserId,
      profileImage: commentProfileImage,
      text
    };

    if (!work.comments) work.comments = [];
    work.comments.unshift(newComment);
    await work.save();

    // 🔔 สร้างการแจ้งเตือน (Notification)
    if (work.createdBy.toString() !== commentUserId.toString()) {
      try {
        const Notification = (await import('../models/Notification.js')).default;
        const note = new Notification({
          recipient: work.createdBy,
          sender: commentUserId,
          type: 'comment',
          referenceId: work._id,
          text: `${commentUserName} commented on "${work.title}"`,
          link: `/works/${work._id}`
        });
        await note.save();

        // ส่งผ่าน Socket
        const io = req.app.get('io');
        if (io) {
          io.to(work.createdBy.toString()).emit('new_notification', {
            ...note._doc,
            sender: { name: commentUserName, profileImage: commentProfileImage ? { url: commentProfileImage } : null }
          });
        }
      } catch (err) { console.error("Notification Error:", err); }
    }

    res.status(201).json(work.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id/comment/:commentId', protect, async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);
    if (!work) return res.status(404).json({ message: "ไม่พบผลงาน" });

    const comment = work.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "ไม่พบคอมเมนต์" });

    let canDelete = false;
    const currentUserId = String(req.user._id);
    const commentOwnerId = comment.userId ? String(comment.userId) : null;
    const workOwnerId = work.createdBy ? String(work.createdBy) : null;

    if (commentOwnerId === currentUserId || workOwnerId === currentUserId || req.user.role === 'admin') {
      canDelete = true;
    }

    if (!canDelete) {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์ลบคอมเมนต์นี้" });
    }

    work.comments = work.comments.filter(c => c._id.toString() !== req.params.commentId);
    await work.save();
    res.json(work.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/comment/:commentId/reply', protect, async (req, res) => {
  try {
    const { text } = req.body;
    const replyUserName = req.user.name || 'User';
    const replyProfileImage = req.user.profileImage?.url || "";
    if (!text) return res.status(400).json({ message: "กรุณาพิมพ์ข้อความตอบกลับ" });
    
    const work = await Work.findById(req.params.id);
    if (!work) return res.status(404).json({ message: "ไม่พบผลงาน" });

    const comment = work.comments.id ? work.comments.id(req.params.commentId) : work.comments.find(c => c._id.toString() === req.params.commentId);
    if (!comment) return res.status(404).json({ message: "ไม่พบคอมเมนต์" });

    const newReply = {
      user: replyUserName,
      userId: req.user._id,
      profileImage: replyProfileImage,
      text
    };

    comment.replies.push(newReply);
    await work.save();

    // 🔔 สร้างการแจ้งเตือน (Notification) ไปยังเจ้าของคอมเมนต์หลัก
    const recipientId = comment.userId;
    if (recipientId && recipientId.toString() !== String(req.user._id)) {
      try {
        const Notification = (await import('../models/Notification.js')).default;
        const note = new Notification({
          recipient: recipientId,
          sender: req.user._id,
          type: 'comment',
          referenceId: work._id,
          text: `${req.user.name} ได้ตอบกลับคอมเมนต์ของคุณใน "${work.title}"`,
          link: `/works/${work._id}`
        });
        await note.save();

        const io = req.app.get('io');
        if (io) {
          io.to(recipientId.toString()).emit('new_notification', {
            ...note._doc,
            sender: { name: replyUserName, profileImage: replyProfileImage ? { url: replyProfileImage } : null }
          });
        }
      } catch (err) { console.error("Reply Notification Error:", err); }
    }

    res.status(201).json(work.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/comment/:commentId', protect, async (req, res) => {
  try {
    const { text } = req.body;
    const work = await Work.findById(req.params.id);
    if (!work) return res.status(404).json({ message: "ไม่พบผลงาน" });

    const comment = work.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "ไม่พบคอมเมนต์" });

    const currentUserId = String(req.user._id);
    const commentOwnerId = comment.userId ? String(comment.userId) : null;
    const workOwnerId = work.createdBy ? String(work.createdBy) : null;
    const canEdit = commentOwnerId === currentUserId || workOwnerId === currentUserId || req.user.role === 'admin';

    if (!canEdit) {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์แก้ไขคอมเมนต์นี้" });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "กรุณาพิมพ์ข้อความคอมเมนต์" });
    }

    comment.text = text;
    await work.save();
    res.json(work.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, uploadFields, updateWork);
router.delete('/:id', protect, deleteWork);

export default router;
