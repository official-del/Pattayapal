// --- บรรทัดบนสุดของ server.js --- 
import './config/env.js';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import http from 'http';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

// --- IMPORT ROUTES ---
import workRoutes from './routes/workRoutes.js';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import User from './models/User.js';
import Work from './models/Work.js';
import Post from './models/Post.js';
import Conversation from './models/Conversation.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import postRoutes from './routes/postRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import questRoutes from './routes/questRoutes.js';
import questSubmissionRoutes from './routes/questSubmissionRoutes.js';
import testEmailRoute from './routes/testEmailRoute.js';
import { protect, admin } from './middleware/auth.js';

// ตั้งค่าสำหรับ ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT || 5000);
const shutdownTimeoutMs = Number(process.env.SHUTDOWN_TIMEOUT_MS || 10000);

app.disable('x-powered-by');
if (isProduction) {
  app.set('trust proxy', 1);
} else if (process.env.TRUST_PROXY) {
  app.set('trust proxy', process.env.TRUST_PROXY);
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowUnconfiguredOrigins = !isProduction && allowedOrigins.length === 0;

const corsOrigin = (origin, callback) => {
  if (!origin || allowUnconfiguredOrigins || allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  callback(new Error('Not allowed by CORS'));
};

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : allowUnconfiguredOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});
app.set('io', io);

const frontendStaticOptions = {
  index: false,
  maxAge: isProduction ? '1d' : 0,
  dotfiles: 'deny',
};

const uploadStaticOptions = {
  index: false,
  maxAge: isProduction ? '7d' : 0,
  dotfiles: 'deny',
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
};

// ── Socket.io Connection Logic ──
const userSocketMap = new Map(); // socketId -> userId

// Helper: ได้รายชื่อ userId ทั้งหมดที่ Online
const getOnlineUserIds = () => [...new Set(userSocketMap.values())];

const getSocketToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  if (authToken) return authToken;

  const authorization = socket.handshake.headers?.authorization;
  if (authorization?.startsWith('Bearer ')) return authorization.split(' ')[1];

  return socket.handshake.headers?.['x-auth-token'] || null;
};

const isConversationParticipant = async (conversationId, userId) => {
  if (!conversationId || !userId) return false;
  const conversation = await Conversation.exists({
    _id: conversationId,
    'participants.user': userId,
  });
  return !!conversation;
};

const canSignalUser = async (fromUserId, toUserId) => {
  if (!fromUserId || !toUserId || String(fromUserId) === String(toUserId)) return false;
  const conversation = await Conversation.exists({
    isGroup: false,
    $and: [
      { 'participants.user': fromUserId },
      { 'participants.user': toUserId },
    ],
  });
  return !!conversation;
};

io.use(async (socket, next) => {
  const token = getSocketToken(socket);
  if (!token || token === 'null' || token === 'undefined') return next();

  try {
    if (!process.env.JWT_SECRET) return next(new Error('Socket authentication is not configured'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id role tokenVersion');

    if (!user) return next(new Error('Socket user not found'));
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== (user.tokenVersion || 0)) {
      return next(new Error('Socket session expired'));
    }

    socket.data.userId = user._id.toString();
    socket.data.role = user.role;
    next();
  } catch {
    next(new Error('Invalid socket token'));
  }
});

io.on('connection', (socket) => {
  socket.on('join_room', async (roomId) => {
    const userId = socket.data.userId;
    if (!userId) return socket.emit('auth_error', { message: 'Authentication required' });

    try {
      const allowed = await isConversationParticipant(roomId, userId);
      if (!allowed) return socket.emit('auth_error', { message: 'Room access denied' });
      socket.join(roomId);
    } catch {
      socket.emit('auth_error', { message: 'Room access denied' });
    }
  });

  socket.on('join_user', async (payload) => {
    const requestedUserId = typeof payload === 'object' ? payload?.userId : payload;
    const token = typeof payload === 'object' ? payload?.token : null;

    if (!socket.data.userId && token && token !== 'null' && token !== 'undefined') {
      try {
        if (!process.env.JWT_SECRET) return socket.emit('auth_error', { message: 'Authentication is not configured' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('_id role tokenVersion');
        if (!user) return socket.emit('auth_error', { message: 'User not found' });
        if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== (user.tokenVersion || 0)) {
          return socket.emit('auth_error', { message: 'Session expired' });
        }
        socket.data.userId = user._id.toString();
        socket.data.role = user.role;
      } catch {
        return socket.emit('auth_error', { message: 'Invalid token' });
      }
    }

    const authenticatedUserId = socket.data.userId;
    if (!authenticatedUserId) return socket.emit('auth_error', { message: 'Authentication required' });
    if (requestedUserId && String(requestedUserId) !== authenticatedUserId) {
      return socket.emit('auth_error', { message: 'User room access denied' });
    }

    socket.join(authenticatedUserId);
    userSocketMap.set(socket.id, authenticatedUserId);

    try {
      await User.findByIdAndUpdate(authenticatedUserId, { isOnline: true });
      io.emit('status_change', { userId: authenticatedUserId, isOnline: true });
      socket.emit('online_users_list', getOnlineUserIds());
    } catch (err) {
      console.error('Update status error:', err);
    }
  });

  socket.on('send_message', async (data) => {
    const userId = socket.data.userId;
    if (!userId || !data?.roomId) return;

    try {
      const allowed = await isConversationParticipant(data.roomId, userId);
      if (!allowed) return socket.emit('auth_error', { message: 'Room access denied' });
      io.to(data.roomId).emit('receive_message', { ...data, sender: data.sender || userId });
    } catch {
      socket.emit('auth_error', { message: 'Room access denied' });
    }
  });

  socket.on('mark_read', async (data) => {
    const userId = socket.data.userId;
    if (!userId || String(data?.readerId) !== userId) return;

    try {
      const allowed = await isConversationParticipant(data.conversationId, userId);
      if (!allowed) return;
      io.to(data.senderId).emit('messages_read', {
        conversationId: data.conversationId,
        readerId: userId
      });
    } catch {}
  });

  socket.on('typing', async (data) => {
    const userId = socket.data.userId;
    if (!userId || String(data?.userId) !== userId) return;

    try {
      const allowed = await isConversationParticipant(data.roomId, userId);
      if (!allowed) return;
      socket.to(data.roomId).emit('user_typing', {
        userId,
        userName: data.userName,
      });
    } catch {}
  });

  socket.on('stop_typing', async (data) => {
    const userId = socket.data.userId;
    if (!userId || String(data?.userId) !== userId) return;

    try {
      const allowed = await isConversationParticipant(data.roomId, userId);
      if (!allowed) return;
      socket.to(data.roomId).emit('user_stop_typing', { userId });
    } catch {}
  });

  // 📞 WebRTC Signaling for Video/Voice Calls
  socket.on('call_user', async (data) => {
    const userId = socket.data.userId;
    if (!userId) return;
    const allowed = await canSignalUser(userId, data?.to);
    if (!allowed) return socket.emit('auth_error', { message: 'Call access denied' });

    // data: { to: recipientId, offer, from, name, type: 'video' | 'voice' }
    io.to(data.to).emit('call_incoming', {
      offer: data.offer,
      from: userId,
      name: data.name,
      type: data.type
    });
  });

  socket.on('answer_call', async (data) => {
    const userId = socket.data.userId;
    if (!userId) return;
    const allowed = await canSignalUser(userId, data?.to);
    if (!allowed) return socket.emit('auth_error', { message: 'Call access denied' });

    // data: { to: callerId, answer }
    io.to(data.to).emit('call_answered', { answer: data.answer });
  });

  socket.on('ice_candidate', async (data) => {
    const userId = socket.data.userId;
    if (!userId) return;
    const allowed = await canSignalUser(userId, data?.to);
    if (!allowed) return;

    // data: { to: otherPartyId, candidate }
    io.to(data.to).emit('ice_candidate', { candidate: data.candidate });
  });

  socket.on('end_call', async (data) => {
    const userId = socket.data.userId;
    if (!userId) return;
    const allowed = await canSignalUser(userId, data?.to);
    if (!allowed) return;

    // data: { to: otherPartyId }
    io.to(data.to).emit('call_ended');
  });

  socket.on('disconnect', async () => {
    const userId = userSocketMap.get(socket.id);
    if (userId) {
      userSocketMap.delete(socket.id);
      
      // 🕵️ Check if user has other active sockets (e.g., other tabs)
      const isStillConnected = [...userSocketMap.values()].includes(userId);
      
      if (!isStillConnected) {
        try {
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date()
          });
          io.emit('status_change', { userId, isOnline: false, lastSeen: new Date() });
        } catch (err) {
          console.error('Update status error:', err);
        }
      }
    }
  });
});

// ==========================================
// 1. MIDDLEWARE (ต้องประกาศก่อน Routes เสมอ!)
// ==========================================
app.use(helmet({
  crossOriginResourcePolicy: false, 
}));

app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/ready', (req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;
  res.status(isDbReady ? 200 : 503).json({
    status: isDbReady ? 'ready' : 'not_ready',
    db: mongoose.connection.readyState,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

const globalApiLimiter = rateLimit({
  windowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.API_RATE_LIMIT_MAX || (isProduction ? 600 : 2000)),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please slow down.' },
});

app.use('/api', globalApiLimiter);
// ✅ Rate Limiting for security - INCREASED for modern SPA usage
const apiLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

// ✅ Relaxed Rate Limiting for uploads and works to support large files
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Increase to 500 requests per 15 mins for uploads
  message: { message: 'Too many uploads from this IP, please try again later' }
});

app.use('/api/auth', apiLimiter);
app.use('/api/upload', uploadLimiter);
app.use('/api/works', uploadLimiter);

// 🔒 [SECURED] GCS Check - Admin only
app.get('/api/gcs-check', protect, admin, async (req, res) => {
  const isConfigured = !!(process.env.GCP_KEY_JSON || (process.env.GCP_CLIENT_EMAIL && process.env.GCP_PRIVATE_KEY));
  res.json({
    status: isConfigured ? '✅ GCS Configured' : '❌ GCS Not Configured',
    GCP_BUCKET_NAME: process.env.GCP_BUCKET_NAME ? '✅ Set' : '❌ Not Set',
    GCP_PROJECT_ID: process.env.GCP_PROJECT_ID ? '✅ Set' : '❌ Not Set',
  });
});

// ✅ ยุบรวม express.json ให้เหลือตัวเดียว และตั้ง Limit รับรูปขนาดใหญ่
// ✅ ยุบรวม express.json ให้เหลือตัวเดียว และตั้ง Limit รับรูปขนาดใหญ่ (2GB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Attach io to app to use in controllers
app.set('io', io);

// ✅ Serve static files from the 'dist' directory (Frontend Build)
app.use(express.static(path.join(__dirname, 'dist'), frontendStaticOptions));

// ✅ เปิดให้หน้าบ้านดึงไฟล์ในโฟลเดอร์ uploads ไปแสดงผลได้
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), uploadStaticOptions));


// ==========================================
// 2. ROUTES API (หลังจากผ่าน Middleware ด้านบนแล้ว)
// ==========================================
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/works', workRoutes);
// Route placeholder removed from here

// Removed from here

// 🔒 [SECURED] Debug headers - Admin only
app.get('/api/debug-headers', protect, admin, async (req, res) => {
  res.json({
    hasAuthorization: !!req.headers.authorization,
    hasXAuthToken: !!req.headers['x-auth-token'],
    host: req.headers.host,
    origin: req.headers.origin,
    note: 'Debug endpoint secured - admin only'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/quest-submissions', questSubmissionRoutes);
app.use('/api/test', testEmailRoute);

app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// ✅ Health Check สำหรับ Docker / Load Balancer
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[char]));

// ✅ Catch-all route เพื่อรองรับ SPA (React Router) + Dynamic SEO Meta Tags
app.get('*', async (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    try {
      let html = fs.readFileSync(indexPath, 'utf8');

      // Default Meta Data
      let title = "Pattayapal Portfolio | Community & Workspace for Freelancers";
      let description = "Pattayapal แพลตฟอร์มรวมผลงานและชุมชนฟรีแลนซ์คุณภาพ แหล่งรวมโปรดักชั่น ดีไซน์ และการตลาดออนไลน์ที่ดีที่สุด";
      let image = "https://pattayapal.com/og-image.jpg";
      let url = `https://pattayapal.com${req.url}`;

      // 1. Check for Work Detail (/works/:id)
      const workMatch = req.url.match(/\/works\/([a-zA-Z0-9]+)/);
      if (workMatch) {
        try {
          const work = await Work.findById(workMatch[1])
            .select('title description mainImage createdBy')
            .populate('createdBy', 'name profession');
          
          if (work) {
            const authorName = work.createdBy?.name || "Pattayapal Creator";
            title = `${work.title} by ${authorName} | Pattayapal Portfolio`;
            
            // Construct a more descriptive share text
            const cleanDesc = work.description?.substring(0, 160).replace(/[^\w\s\u0E00-\u0E7F]/g, '') || "";
            description = cleanDesc ? `${cleanDesc} - ผลงานโดย ${authorName}` : `ชมผลงาน ${work.title} โดย ${authorName} บน Pattayapal`;
            
            if (work.mainImage?.url) {
              image = work.mainImage.url.startsWith('http') ? work.mainImage.url : `https://pattayapal.com${work.mainImage.url.startsWith('/') ? '' : '/'}${work.mainImage.url}`;
            }
          }
        } catch (err) {
          console.error("Work SEO Error:", err);
        }
      }

      // 2. Check for Profile (/profile/:id or /profile/:username or /:username)
      const profileMatch = req.url.match(/\/profile\/([a-zA-Z0-9_-]+)/) || (req.url !== '/' && !req.url.startsWith('/api') && req.url.match(/\/([a-zA-Z0-9_-]+)/));
      if (profileMatch && !workMatch && !req.url.startsWith('/works') && !req.url.startsWith('/posts')) {
        const identifier = profileMatch[1];
        let user;
        try {
          if (identifier.length === 24 && /^[0-9a-fA-F]+$/.test(identifier)) {
            user = await User.findById(identifier).select('name username bio profileImage profession');
          } else {
            user = await User.findOne({ username: identifier.toLowerCase() }).select('name username bio profileImage profession');
          }

          if (user) {
            title = `${user.name} (@${user.username}) | ${user.profession || 'Freelancer'} | Pattayapal`;
            description = user.bio?.substring(0, 160).replace(/[^\w\s\u0E00-\u0E7F]/g, '') || `${user.name} - ${user.profession || 'Freelancer'} on Pattayapal. View portfolio and contact for work.`;
            if (user.profileImage?.url) {
              image = user.profileImage.url.startsWith('http') ? user.profileImage.url : `https://pattayapal.com${user.profileImage.url.startsWith('/') ? '' : '/'}${user.profileImage.url}`;
            }
          }
        } catch (err) {
          console.error("Profile SEO Error:", err);
        }
      }

      // 3. Check for Post Detail (/posts/:id)
      const postMatch = req.url.match(/\/posts\/([a-zA-Z0-9]+)/);
      if (postMatch) {
        try {
          const post = await Post.findById(postMatch[1]).select('content media author').populate('author', 'name profession');
          if (post) {
            const authorName = post.author?.name || "Pattayapal User";
            title = `Post by ${authorName} | Pattayapal Portfolio`;
            description = post.content?.substring(0, 160).replace(/[^\w\s\u0E00-\u0E7F]/g, '') || `Check out this update from ${authorName} on Pattayapal`;
            
            if (post.media && post.media.length > 0 && post.media[0].url) {
              const firstMedia = post.media[0].url;
              image = firstMedia.startsWith('http') ? firstMedia : `https://pattayapal.com${firstMedia.startsWith('/') ? '' : '/'}${firstMedia}`;
            }
          }
        } catch (err) {
          console.error("Post SEO Error:", err);
        }
      }

      // Inject into HTML with flexible regex and adding missing tags
      const injectMeta = (htmlContent, property, value, attr = 'property') => {
        const safeValue = escapeHtml(value);
        const regex = new RegExp(`<meta\\s+${attr}="${property}"[\\s\\S]*?content=".*?"\\s*\\/>`, 'g');
        if (regex.test(htmlContent)) {
          return htmlContent.replace(regex, `<meta ${attr}="${property}" content="${safeValue}" />`);
        } else {
          // If tag doesn't exist, append it before </head>
          return htmlContent.replace('</head>', `  <meta ${attr}="${property}" content="${safeValue}" />\n</head>`);
        }
      };

      html = html.replace(/<title>.*?<\/title>/g, `<title>${escapeHtml(title)}</title>`);
      
      // Standard Meta
      html = injectMeta(html, 'description', description, 'name');
      
      // OpenGraph
      html = injectMeta(html, 'og:title', title);
      html = injectMeta(html, 'og:description', description);
      html = injectMeta(html, 'og:image', image);
      html = injectMeta(html, 'og:image:secure_url', image);
      html = injectMeta(html, 'og:image:width', '1200');
      html = injectMeta(html, 'og:image:height', '630');
      html = injectMeta(html, 'og:url', url);
      html = injectMeta(html, 'og:site_name', 'Pattayapal Portfolio');
      html = injectMeta(html, 'og:type', workMatch || postMatch ? 'article' : 'website');
      
      // Twitter
      html = injectMeta(html, 'twitter:card', 'summary_large_image');
      html = injectMeta(html, 'twitter:title', title);
      html = injectMeta(html, 'twitter:description', description);
      html = injectMeta(html, 'twitter:image', image);
      html = injectMeta(html, 'twitter:url', url);

      res.send(html);
    } catch (err) {
      console.error("SEO Injection Error:", err);
      res.sendFile(indexPath);
    }
  } else {
    res.status(404).send('Backend is running, but Frontend build (dist) not found. Please run npm run build.');
  }
});


// ==========================================
// 3. DATABASE CONNECTION
// ==========================================
const createFirstAdmin = async () => {
  const adminEmail = 'admin@pattayapal.com';
  try {
    if (!process.env.INITIAL_ADMIN_PASSWORD) {
      console.warn('INITIAL_ADMIN_PASSWORD is not set. Skipping first admin bootstrap.');
      return;
    }

    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      await User.create({
        name: 'Pattaya Pal Admin',
        email: adminEmail,
        password: process.env.INITIAL_ADMIN_PASSWORD,
        role: 'admin',
        isEmailVerified: true
      });
      // console.log('👤 First Admin Created');
    } else if (adminExists.role !== 'admin') {
      console.warn(`Initial admin email ${adminEmail} exists but is not an admin.`);
    }
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  }
};


// ==========================================
// 4. ERROR HANDLING (ตัวดักจับ Error สุดท้าย)
// ==========================================
app.use((err, req, res, next) => {
  const errorDetails = `[${new Date().toISOString()}] ${req.method} ${req.url}\n${err.stack}\n\n`;
  fs.promises.appendFile(path.join(__dirname, 'error_log.txt'), errorDetails).catch(() => {});
  console.error(err.stack || err);

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS origin is not allowed' });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'Uploaded file is too large' });
  }

  if (err.message === 'Unsupported file type') {
    return res.status(415).json({ message: 'Unsupported file type' });
  }

  const payload = { message: 'Something went wrong!' };
  if (!isProduction) payload.error = err.message;
  res.status(500).json(payload);
});

const connectDatabase = async () => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 10000),
  });
  await createFirstAdmin();
};

const startServer = async () => {
  try {
    if (process.env.ENV_CONFIG_ERROR) {
      throw new Error(`Environment Config Error: ${process.env.ENV_CONFIG_ERROR}`);
    }
    await connectDatabase();
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
  } catch (err) {
    console.error('Backend startup failed:', err.message);
    const fallbackApp = express();
    fallbackApp.all('*', (req, res) => {
      res.status(503).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>503 Server Error</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #333; }
              .error-box { background: #fee2e2; border: 1px solid #ef4444; padding: 1.5rem; border-radius: 8px; color: #991b1b; margin-bottom: 2rem; }
            </style>
          </head>
          <body>
            <h1>🚨 Server Startup Error</h1>
            <p>Your Node.js backend failed to start. This is usually caused by missing environment variables or database connection issues.</p>
            <div class="error-box">
              <strong>Error Details:</strong><br/>
              <code>${err.message}</code>
            </div>
            <h3>How to fix (Hostinger / cPanel):</h3>
            <ul>
              <li>Make sure your <code>.env</code> file is created in the Backend folder and contains all required variables.</li>
              <li>Make sure your <code>MONGO_URI</code> is correct and your server IP is whitelisted in MongoDB Atlas.</li>
              <li>Make sure you clicked <strong>NPM Install</strong> in your Node.js app dashboard.</li>
              <li>After fixing the issue, click <strong>Restart</strong> on your Node.js app to apply changes.</li>
            </ul>
          </body>
        </html>
      `);
    });
    fallbackApp.listen(PORT, () => {
      console.log(\`Fallback server running on port \${PORT} to show startup error.\`);
    });
  }
};

let isShuttingDown = false;

const closeResources = async () => {
  io.close();
  await mongoose.disconnect();
};

const shutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`${signal} received. Shutting down gracefully.`);
  const timeout = setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, shutdownTimeoutMs);

  const finishShutdown = async () => {
    try {
      await closeResources();
      clearTimeout(timeout);
      process.exit(0);
    } catch (err) {
      console.error('Shutdown failed:', err.message);
      clearTimeout(timeout);
      process.exit(1);
    }
  };

  if (!server.listening) {
    finishShutdown();
    return;
  }

  server.close(finishShutdown);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  shutdown('uncaughtException');
});

startServer();
