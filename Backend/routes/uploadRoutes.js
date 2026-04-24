import express from 'express';
import multer from 'multer';
import { uploadToGCS, deleteFromGCS } from '../utils/gcs.js'; 

const router = express.Router();
import path from 'path';
import fs from 'fs';
const tempDir = path.join(process.cwd(), 'uploads/temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
const upload = multer({ dest: tempDir });

router.post('/single', upload.single('file'), async (req, res) => {
    try {
        const url = await uploadToGCS(req.file);
        res.status(200).json({ url });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/delete', async (req, res) => {
    const { url } = req.body;
    console.log("📩 [API Receive] ข้อมูลที่ได้รับจากหน้าบ้าน:", req.body);

    if (!url) return res.status(400).json({ message: 'URL is required' });

    const success = await deleteFromGCS(url);
    if (success) res.status(200).json({ message: 'Deleted' });
    else res.status(500).json({ message: 'Delete failed' });
});

export default router;