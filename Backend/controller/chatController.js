import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// ── เริ่มต้นห้องแชท หรือ ดึงห้องแชทที่มีอยู่แล้ว ──
export const getOrCreateConversation = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user.id;

    if (senderId === receiverId) {
      return res.status(400).json({ message: "ไม่สามารถคุยกับตัวเองได้" });
    }

    // ค้นหาห้องแชทที่มีทั้ง sender และ receiver
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, receiverId]
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
    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'name profileImage profession')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
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
    const { conversationId, text } = req.body;
    const senderId = req.user.id;

    const newMessage = new Message({
      conversationId,
      sender: senderId,
      text
    });

    await newMessage.save();

    // อัปเดตข้อความล่าสุดใน Conversation
    const conversation = await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: newMessage._id
    });

    // 🔔 สร้างการแจ้งเตือน (Notification)
    const recipientId = conversation.participants.find(p => p.toString() !== senderId.toString());
    const sender = await User.findById(senderId).select('name profileImage');

    try {
      const note = new Notification({
        recipient: recipientId,
        sender: senderId,
        type: 'message',
        referenceId: conversationId,
        text: `${sender.name} ส่งข้อความถึงคุณ: "${text.length > 20 ? text.substring(0, 20) + '...' : text}"`,
        link: '/messenger'
      });
      await note.save();

      // ส่งผ่าน Socket
      const io = req.app.get('io');
      if (io) {
        io.to(recipientId.toString()).emit('new_notification', {
          ...note._doc,
          sender: { name: sender.name, profileImage: sender.profileImage }
        });
      }
    } catch (err) { console.error("Chat Notification Error:", err); }

    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
