// diagnose.mjs - ใช้หาสาเหตุที่ Backend รันไม่ขึ้น
// ใน Hostinger ให้เปลี่ยน Startup File เป็น diagnose.mjs ชั่วคราว แล้วดู Runtime logs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  process.stdout.write(line);
  try {
    fs.appendFileSync(path.join(__dirname, 'diagnose.log'), line);
  } catch {}
};

log('=== PATTAYAPAL DIAGNOSE START ===');
log(`Node version: ${process.version}`);
log(`Platform: ${process.platform}`);
log(`PORT env: ${process.env.PORT}`);
log(`NODE_ENV: ${process.env.NODE_ENV}`);
log(`MONGO_URI set: ${!!process.env.MONGO_URI}`);
log(`JWT_SECRET set: ${!!process.env.JWT_SECRET}`);
log(`JWT_SECRET length: ${(process.env.JWT_SECRET || '').length}`);
log(`GCP_CLIENT_EMAIL set: ${!!process.env.GCP_CLIENT_EMAIL}`);
log(`GCP_PRIVATE_KEY set: ${!!process.env.GCP_PRIVATE_KEY}`);
log(`ALLOWED_ORIGINS: ${process.env.ALLOWED_ORIGINS}`);
log(`FRONTEND_URL: ${process.env.FRONTEND_URL}`);
log(`SMTP_HOST set: ${!!process.env.SMTP_HOST}`);

// Test dotenv
log('--- Testing dotenv ---');
try {
  const { default: dotenv } = await import('dotenv');
  dotenv.config();
  log('✅ dotenv: OK');
} catch (e) {
  log(`❌ dotenv FAILED: ${e.message}`);
}

// Test express
log('--- Testing express ---');
try {
  const { default: express } = await import('express');
  const app = express();
  log('✅ express: OK');
} catch (e) {
  log(`❌ express FAILED: ${e.message}`);
}

// Test mongoose
log('--- Testing mongoose ---');
try {
  const { default: mongoose } = await import('mongoose');
  log('✅ mongoose: OK');

  // Test MongoDB connection
  log('--- Testing MongoDB connection ---');
  if (!process.env.MONGO_URI) {
    log('❌ MONGO_URI is NOT SET - cannot test connection');
  } else {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      log('✅ MongoDB connected: OK');
      await mongoose.disconnect();
    } catch (e) {
      log(`❌ MongoDB connection FAILED: ${e.message}`);
    }
  }
} catch (e) {
  log(`❌ mongoose FAILED: ${e.message}`);
}

// Test socket.io
log('--- Testing socket.io ---');
try {
  const { Server } = await import('socket.io');
  log('✅ socket.io: OK');
} catch (e) {
  log(`❌ socket.io FAILED: ${e.message}`);
}

// Test GCS
log('--- Testing @google-cloud/storage ---');
try {
  const { Storage } = await import('@google-cloud/storage');
  log('✅ @google-cloud/storage: OK');
} catch (e) {
  log(`❌ @google-cloud/storage FAILED: ${e.message}`);
}

// Test helmet
log('--- Testing helmet ---');
try {
  const { default: helmet } = await import('helmet');
  log('✅ helmet: OK');
} catch (e) {
  log(`❌ helmet FAILED: ${e.message}`);
}

// Test multer
log('--- Testing multer ---');
try {
  const { default: multer } = await import('multer');
  log('✅ multer: OK');
} catch (e) {
  log(`❌ multer FAILED: ${e.message}`);
}

// Test nodemailer
log('--- Testing nodemailer ---');
try {
  const { default: nodemailer } = await import('nodemailer');
  log('✅ nodemailer: OK');
} catch (e) {
  log(`❌ nodemailer FAILED: ${e.message}`);
}

// Test sharp (often fails on cloud)
log('--- Testing sharp ---');
try {
  const { default: sharp } = await import('sharp');
  log('✅ sharp: OK');
} catch (e) {
  log(`❌ sharp FAILED: ${e.message}`);
  log('   → sharp is the likely cause of the crash!');
}

// Test jimp
log('--- Testing jimp ---');
try {
  const { default: Jimp } = await import('jimp');
  log('✅ jimp: OK');
} catch (e) {
  log(`❌ jimp FAILED: ${e.message}`);
}

// Start a simple HTTP server to confirm everything works
log('--- Starting simple HTTP server ---');
import http from 'http';

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer((req, res) => {
  const results = fs.existsSync(path.join(__dirname, 'diagnose.log'))
    ? fs.readFileSync(path.join(__dirname, 'diagnose.log'), 'utf8')
    : 'No log yet';
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`=== DIAGNOSE RESULTS ===\n\n${results}`);
});

httpServer.listen(PORT, () => {
  log(`✅ HTTP server listening on PORT: ${PORT}`);
  log('=== DIAGNOSE COMPLETE - Open your website to see results ===');
});

httpServer.on('error', (e) => {
  log(`❌ HTTP server FAILED: ${e.message}`);
});
