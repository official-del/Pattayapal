import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadToGCS, deleteFromGCS } from '../utils/gcs.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

const tempDir = path.join(process.cwd(), 'uploads/temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
]);

const upload = multer({
  dest: tempDir,
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_BYTES || 50 * 1024 * 1024),
  },
  fileFilter: (req, file, cb) => {
    const isAllowed =
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/') ||
      file.mimetype.startsWith('audio/') ||
      allowedMimeTypes.has(file.mimetype);

    if (!isAllowed) {
      return cb(new Error('Unsupported file type'));
    }

    cb(null, true);
  },
});

router.post('/single', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const url = await uploadToGCS(req.file);
    res.status(200).json({ url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/delete', protect, admin, async (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ message: 'URL is required' });

  const success = await deleteFromGCS(url);
  if (success) res.status(200).json({ message: 'Deleted' });
  else res.status(500).json({ message: 'Delete failed' });
});

router.get('/test-env', protect, admin, (req, res) => {
  res.json({
    hasEmail: !!process.env.GCP_CLIENT_EMAIL,
    hasKey: !!process.env.GCP_PRIVATE_KEY || !!process.env.GCP_KEY_JSON,
    projectId: !!process.env.GCP_PROJECT_ID,
    bucket: !!process.env.GCP_BUCKET_NAME,
    configured:
      !!process.env.GCP_BUCKET_NAME &&
      !!(process.env.GCP_KEY_JSON || (process.env.GCP_CLIENT_EMAIL && process.env.GCP_PRIVATE_KEY)),
  });
});

export default router;
