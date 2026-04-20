// --- บรรทัดบนสุดของ server.js --- 
import './config/env.js';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import http from 'http';
import rateLimit from 'express-rate-limit';

// --- IMPORT ROUTES ---
import workRoutes from './routes/workRoutes.js';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import User from './models/User.js';
import userAuthRoutes from './routes/userAuthRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import postRoutes from './routes/postRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import walletRoutes from './routes/walletRoutes.js';

// ตั้งค่าสำหรับ ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ── Socket.io Connection Logic ──
const userSocketMap = new Map(); // socketId -> userId

// Helper: ได้รายชื่อ userId ทั้งหมดที่ Online
const getOnlineUserIds = () => [...new Set(userSocketMap.values())];

io.on('connection', (socket) => {
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('join_user', async (userId) => {
    socket.join(userId);
    userSocketMap.set(socket.id, userId);

    try {
      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit('status_change', { userId, isOnline: true });
      socket.emit('online_users_list', getOnlineUserIds());
    } catch (err) {
      console.error('Update status error:', err);
    }
  });

  socket.on('send_message', (data) => {
    io.to(data.roomId).emit('receive_message', data);
  });

  socket.on('mark_read', (data) => {
    io.to(data.senderId).emit('messages_read', {
      conversationId: data.conversationId,
      readerId: data.readerId
    });
  });

  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user_typing', {
      userId: data.userId,
      userName: data.userName,
    });
  });

  socket.on('stop_typing', (data) => {
    socket.to(data.roomId).emit('user_stop_typing', { userId: data.userId });
  });

  socket.on('disconnect', async () => {
    const userId = userSocketMap.get(socket.id);
    if (userId) {
      try {
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date()
        });
        userSocketMap.delete(socket.id);
        io.emit('status_change', { userId, isOnline: false, lastSeen: new Date() });
      } catch (err) {
        console.error('Update status error:', err);
      }
    }
  });
});

// ==========================================
// 1. MIDDLEWARE (ต้องประกาศก่อน Routes เสมอ!)
// ==========================================
app.use(helmet({
  crossOriginResourcePolicy: false, // 💡 สำคัญ: เพื่อให้หน้าบ้านดึงรูปจาก Google Cloud/Local ได้โดยไม่ติดเรื่อง URL
}));
// ✅ Rate Limiting for security
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, 
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

app.use('/api/auth', apiLimiter);
app.use('/api/upload', apiLimiter);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
// ✅ ยุบรวม express.json ให้เหลือตัวเดียว และตั้ง Limit รับรูปขนาดใหญ่
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Attach io to app to use in controllers
app.set('io', io);

// ✅ เปิดให้หน้าบ้านดึงไฟล์ในโฟลเดอร์ uploads ไปแสดงผลได้
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// ==========================================
// 2. ROUTES API (หลังจากผ่าน Middleware ด้านบนแล้ว)
// ==========================================
app.use('/api/users', userAuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/works', workRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/wallet', walletRoutes);


// ==========================================
// 3. DATABASE CONNECTION
// ==========================================
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✨ Connected to MongoDB Atlas Success!');
    await createFirstAdmin();
  })
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

const createFirstAdmin = async () => {
  const adminEmail = 'admin@pattayapal.com';
  try {
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      await User.create({
        name: 'Pattaya Pal Admin',
        email: adminEmail,
        password: process.env.INITIAL_ADMIN_PASSWORD || 'admin1234'
      });
      console.log('👤 First Admin Created');
    }
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  }
};


// ==========================================
// 4. ERROR HANDLING (ตัวดักจับ Error สุดท้าย)
// ==========================================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
});