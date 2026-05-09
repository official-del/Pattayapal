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
import Work from './models/Work.js';
import Post from './models/Post.js';
import userAuthRoutes from './routes/userAuthRoutes.js';
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
app.set('io', io);

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

  // 📞 WebRTC Signaling for Video/Voice Calls
  socket.on('call_user', (data) => {
    // data: { to: recipientId, offer, from, name, type: 'video' | 'voice' }
    io.to(data.to).emit('call_incoming', {
      offer: data.offer,
      from: data.from,
      name: data.name,
      type: data.type
    });
  });

  socket.on('answer_call', (data) => {
    // data: { to: callerId, answer }
    io.to(data.to).emit('call_answered', { answer: data.answer });
  });

  socket.on('ice_candidate', (data) => {
    // data: { to: otherPartyId, candidate }
    io.to(data.to).emit('ice_candidate', { candidate: data.candidate });
  });

  socket.on('end_call', (data) => {
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
// ✅ Rate Limiting for security - INCREASED for modern SPA usage
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per 15 mins
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

// 🔍 [DEBUG] Route to check GCS configuration status on Live Server (Top Priority)
app.get('/api/gcs-check', (req, res) => {
  const hasKey = !!process.env.GCP_KEY_JSON;
  const bucket = process.env.GCP_BUCKET_NAME;
  const project = process.env.GCP_PROJECT_ID;
  
  let keyStatus = "❌ Not Found";
  if (hasKey) {
    let keyContent = process.env.GCP_KEY_JSON.trim();
    // Strip surrounding quotes
    keyContent = keyContent.replace(/^["']|["']$/g, '');
    
    try {
      JSON.parse(keyContent);
      keyStatus = "✅ Found & Valid Raw JSON";
    } catch (e) {
      try {
        const decoded = Buffer.from(keyContent, 'base64').toString();
        JSON.parse(decoded);
        keyStatus = "✅ Found & Valid Base64 JSON";
      } catch (b64Error) {
        keyStatus = "⚠️ Found but Invalid format (tried JSON and Base64)";
      }
    }
  }

  res.json({
    status: "Checking GCS...",
    GCP_KEY_JSON: keyStatus,
    GCP_BUCKET_NAME: bucket || "❌ Not Set",
    GCP_PROJECT_ID: project || "❌ Not Set",
    hint: "If Key is 'Not Found', please check Hostinger Environment Variables."
  });
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
// ✅ ยุบรวม express.json ให้เหลือตัวเดียว และตั้ง Limit รับรูปขนาดใหญ่
// ✅ ยุบรวม express.json ให้เหลือตัวเดียว และตั้ง Limit รับรูปขนาดใหญ่ (2GB)
app.use(express.json({ limit: '2000mb' }));
app.use(express.urlencoded({ limit: '2000mb', extended: true }));

// Attach io to app to use in controllers
app.set('io', io);

// ✅ Serve static files from the 'dist' directory (Frontend Build)
app.use(express.static(path.join(__dirname, 'dist')));

// ✅ เปิดให้หน้าบ้านดึงไฟล์ในโฟลเดอร์ uploads ไปแสดงผลได้
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// ==========================================
// 2. ROUTES API (หลังจากผ่าน Middleware ด้านบนแล้ว)
// ==========================================
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/works', workRoutes);
// Route placeholder removed from here

// Removed from here

// 🔍 [DEBUG] Echo headers to check what Hostinger proxy passes through
app.get('/api/debug-headers', (req, res) => {
  res.json({
    receivedHeaders: {
      authorization: req.headers.authorization || '❌ MISSING',
      'x-auth-token': req.headers['x-auth-token'] || '❌ MISSING',
      host: req.headers.host,
      origin: req.headers.origin,
    },
    note: 'If authorization is MISSING, Hostinger proxy is stripping it.'
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

// ✅ Health Check สำหรับ Docker / Load Balancer
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

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
        const regex = new RegExp(`<meta\\s+${attr}="${property}"[\\s\\S]*?content=".*?"\\s*\\/>`, 'g');
        if (regex.test(htmlContent)) {
          return htmlContent.replace(regex, `<meta ${attr}="${property}" content="${value}" />`);
        } else {
          // If tag doesn't exist, append it before </head>
          return htmlContent.replace('</head>', `  <meta ${attr}="${property}" content="${value}" />\n</head>`);
        }
      };

      html = html.replace(/<title>.*?<\/title>/g, `<title>${title}</title>`);
      
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
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    // console.log('✨ Connected to MongoDB Atlas Success!');
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
      // console.log('👤 First Admin Created');
    }
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  }
};


// ==========================================
// 4. ERROR HANDLING (ตัวดักจับ Error สุดท้าย)
// ==========================================
import fs from 'fs';
app.use((err, req, res, next) => {
  const errorDetails = `[${new Date().toISOString()}] ${req.method} ${req.url}\n${err.stack}\n\n`;
  fs.appendFileSync(path.join(__dirname, 'error_log.txt'), errorDetails);
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  // console.log(`🚀 Server running on port ${PORT}`);
  // console.log(`🌐 Production mode: Ready to serve API and Frontend`);
});
