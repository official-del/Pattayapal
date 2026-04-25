import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { uploadToGCS } from '../utils/gcs.js';

// ── เริ่มต้นห้องแชท หรือ ดึงห้องแชทที่มีอยู่แล้ว (1:1) ──
export const getOrCreateConversation = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user.id;

    if (senderId === receiverId) {
      return res.status(400).json({ message: "ไม่สามารถคุยกับตัวเองได้" });
    }

    // ค้นหาห้องแชทที่มีทั้ง sender และ receiver (เฉพาะแบบ 1:1)
    let conversation = await Conversation.findOne({
      isGroup: false,
      "participants.user": { $all: [senderId, receiverId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [
          { user: senderId },
          { user: receiverId }
        ],
        isGroup: false
      });
      await conversation.save();
    }

    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── ดึงรายการแชททั้งหมดของผู้ใช้ ──
export const getMyConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { filter } = req.query; // 'archived', 'unread', or null (default: all non-archived)

    let query = { "participants.user": userId };

    const conversations = await Conversation.find(query)
      .populate('participants.user', 'name profileImage profession isOnline lastSeen')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    // Filter results based on user-specific states in memory (or complex aggregation)
    let filtered = conversations.map(c => {
      const myState = c.participants.find(p => p.user._id.toString() === userId);
      return { ...c._doc, myState };
    });

    if (filter === 'archived') {
      filtered = filtered.filter(c => c.myState?.isArchived);
    } else {
      filtered = filtered.filter(c => !c.myState?.isArchived);
      if (filter === 'unread') {
        filtered = filtered.filter(c => 
          c.lastMessage && 
          !c.lastMessage.isRead && 
          c.lastMessage.sender.toString() !== userId
        );
      }
    }

    res.status(200).json(filtered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── ดึงข้อความในห้องแชท พร้อมอัปเดตสถานะการอ่าน ──
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // ค้นหาข้อความ
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 });
    
    // อัปเดตข้อความที่คนอื่นส่งมาให้เราเป็น "อ่านแล้ว"
    await Message.updateMany(
      { conversationId, sender: { $ne: userId }, isRead: false },
      { $set: { isRead: true } }
    );
    
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── อัปเดตสถานะการอ่านข้อความ (Manual) ──
export const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await Message.updateMany(
      { conversationId, sender: { $ne: userId }, isRead: false },
      { $set: { isRead: true } }
    );

    // แจ้งเตือนผ่าน Socket ว่าอ่านแล้ว
    const io = req.app.get('io');
    const conversation = await Conversation.findById(conversationId);
    if (conversation && io) {
      const recipientId = conversation.participants.find(p => p.toString() !== userId.toString());
      io.to(recipientId.toString()).emit('messages_read', { conversationId, readerId: userId });
    }

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── ส่งข้อความและบันทึกลง Database ──
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, text, messageType } = req.body;
    const senderId = req.user.id;
    let attachments = [];

    // 🔥 จัดการไฟล์แนบ (ถ้ามีผ่าน Multer)
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        try {
          const url = await uploadToGCS(file);
          return {
            url,
            fileType: file.mimetype,
            fileName: file.originalname,
            fileSize: file.size
          };
        } catch (uploadErr) {
          console.error("GCS Upload Error for file:", file.originalname, uploadErr);
          throw uploadErr;
        }
      });
      attachments = await Promise.all(uploadPromises);
    }

    // Determine message type smartly
    let detectedType = 'text';
    if (attachments.length > 0) {
      const allImages = attachments.every(a => a.fileType.startsWith('image/'));
      const allAudio = attachments.every(a => a.fileType.startsWith('audio/'));
      if (allImages) detectedType = 'image';
      else if (allAudio) detectedType = 'audio';
      else detectedType = 'file';
    }

    const newMessage = new Message({
      conversationId,
      sender: senderId,
      text,
      messageType: messageType || detectedType,
      attachments
    });

    await newMessage.save();

    // อัปเดตข้อความล่าสุดใน Conversation
    const conversation = await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: newMessage._id
    }, { new: true });

    if (!conversation) {
      console.error("Conversation not found after update:", conversationId);
      return res.status(404).json({ message: "ไม่พบห้องสนทนา" });
    }

    // 🔔 สร้างการแจ้งเตือน (Notification) สำหรับทุกคนในกลุ่มยกเว้นตัวเอง
    const recipients = conversation.participants.filter(p => p.user && p.user.toString() !== senderId.toString());
    const sender = await User.findById(senderId).select('name profileImage');

    if (sender) {
      recipients.forEach(async (r) => {
        try {
          if (!r.user) return;
          
          const noteText = text 
            ? (text.length > 20 ? text.substring(0, 20) + '...' : text) 
            : (attachments.length > 0 ? `[${attachments[0].fileType.split('/')[0]}]` : '[Message]');

          const note = new Notification({
            recipient: r.user,
            sender: senderId,
            type: 'message',
            referenceId: conversationId,
            text: `${sender.name}: ${noteText}`,
            link: '/messenger'
          });
          await note.save();

          const io = req.app.get('io');
          if (io) {
            io.to(r.user.toString()).emit('new_notification', {
              ...note._doc,
              sender: { name: sender.name, profileImage: sender.profileImage }
            });
          }
        } catch (err) { console.error("Chat Notification Error:", err); }
      });
    }

    res.status(201).json(newMessage);
  } catch (err) {
    console.error("Send Message FATAL Error:", err);
    try {
      const fs = await import('fs');
      const path = await import('path');
      const errorDetails = `[${new Date().toISOString()}] FATAL Error in sendMessage:\n${err.stack}\n\n`;
      fs.appendFileSync(path.resolve('./error_log.txt'), errorDetails);
    } catch (logErr) {
      console.error("Failed to log fatal error to file", logErr);
    }
    res.status(500).json({ message: err.message });
  }
};

// ── จัดการสถานะห้องแชท (Archive/Unarchive) ──
export const toggleArchiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { archived } = req.body;
    const userId = req.user.id;

    await Conversation.updateOne(
      { _id: conversationId, "participants.user": userId },
      { $set: { "participants.$.isArchived": archived } }
    );

    res.status(200).json({ message: archived ? 'Archived' : 'Unarchived' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── สร้างห้องแชทกลุ่ม ──
export const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body; // members = array of user IDs
    const creatorId = req.user.id;

    const participants = [creatorId, ...members].map(id => ({ user: id }));

    const conversation = new Conversation({
      participants,
      isGroup: true,
      groupName: name,
      admins: [creatorId]
    });

    await conversation.save();
    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ── ดึงข้อมูลห้องแชทเดียว ──
export const getConversationById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId)
      .populate('participants.user', 'name profileImage profession isOnline lastSeen')
      .populate('lastMessage');

    if (!conversation) {
      return res.status(404).json({ message: "ไม่พบห้องแชทนี้" });
    }

    // ตรวจสอบว่าเป็นสมาชิกในห้องแชทหรือไม่
    const isParticipant = conversation.participants.some(p => p.user._id.toString() === userId);
    if (!isParticipant) {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์เข้าถึงห้องแชทนี้" });
    }

    const myState = conversation.participants.find(p => p.user._id.toString() === userId);
    res.status(200).json({ ...conversation._doc, myState });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
