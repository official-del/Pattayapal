import express from 'express';
const router = express.Router();
import multer from 'multer';
import { protect } from '../middleware/auth.js';
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

const upload = multer({ storage: multer.memoryStorage() });

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
    const index = work.likes.indexOf(req.user._id);

    if (index === -1) {
      // ยังไม่เคย Like -> ให้เพิ่ม ID เข้าไป
      work.likes.push(req.user._id);
      
      // 🏆 Reward Creator for the like
      const io = req.app.get('io');
      updateUserStats(work.createdBy, 'LIKE', {}, io).catch(err => console.error(err));
    } else {
      // เคย Like แล้ว -> ให้เอา ID ออก (Unlike)
      work.likes.splice(index, 1);
    }

    await work.save();

    res.json({
      likesCount: work.likes.length,
      isLiked: work.likes.includes(req.user._id)
    });
  } catch (err) {
    console.error("🔥 Like Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ แก้ไข Route Comment ให้เสถียรขึ้น
router.post('/:id/comment', async (req, res) => {
  try {
    // ✅ เพิ่ม userId เพื่อลิงก์ไปหน้า Profile ได้
    const { user, text, profileImage, userId } = req.body;

    if (!text) return res.status(400).json({ message: "กรุณาพิมพ์ข้อความคอมเมนต์" });
    const work = await Work.findById(req.params.id);
    if (!work) return res.status(404).json({ message: "ไม่พบผลงานนี้ในระบบ" });

    const newComment = {
      user: user || "Anonymous",
      userId: userId || null, // ✅ เก็บ userId เพื่อ link ไปหน้า Profile
      profileImage: profileImage || "", // ✅ เซฟรูปลง Database
      text
    };

    if (!work.comments) work.comments = [];
    work.comments.unshift(newComment);
    await work.save();

    // 🔔 สร้างการแจ้งเตือน (Notification)
    if (work.createdBy.toString() !== userId) {
      try {
        const Notification = (await import('../models/Notification.js')).default;
        const note = new Notification({
          recipient: work.createdBy,
          sender: userId,
          type: 'comment',
          referenceId: work._id,
          text: `${user} ได้แสดงความคิดเห็นในผลงาน "${work.title}" ของคุณ`,
          link: `/works/${work._id}`
        });
        await note.save();

        // ส่งผ่าน Socket
        const io = req.app.get('io');
        if (io) {
          io.to(work.createdBy.toString()).emit('new_notification', {
            ...note._doc,
            sender: { name: user, profileImage: profileImage ? { url: profileImage } : null }
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
    const { user, text, profileImage, userId } = req.body;
    if (!text) return res.status(400).json({ message: "กรุณาพิมพ์ข้อความตอบกลับ" });
    
    const work = await Work.findById(req.params.id);
    if (!work) return res.status(404).json({ message: "ไม่พบผลงาน" });

    const comment = work.comments.id ? work.comments.id(req.params.commentId) : work.comments.find(c => c._id.toString() === req.params.commentId);
    if (!comment) return res.status(404).json({ message: "ไม่พบคอมเมนต์" });

    const newReply = {
      user: user || req.user.name || "Anonymous",
      userId: req.user._id || userId || null,
      profileImage: profileImage || req.user.profileImage || "",
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
            sender: { name: req.user.name, profileImage: profileImage ? { url: profileImage } : null }
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