import { Storage } from '@google-cloud/storage';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from 'fs';

const keyPath = path.join(__dirname, '../config/gcs-key.json'); 
const keyExists = fs.existsSync(keyPath);

// 🛡️ [NEW] Support for Environment Variable Credentials (for Hostinger/Heroku)
let credentials;

// 🛡️ [NEW] Support for Individual Fields (Robust for Hostinger/Heroku)
if (process.env.GCP_CLIENT_EMAIL && process.env.GCP_PRIVATE_KEY) {
    credentials = {
        client_email: process.env.GCP_CLIENT_EMAIL.trim(),
        private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n').trim(),
    };
    console.log("🚀 [GCS] Using Individual Credentials (Email/Key)");
} 
// Fallback to full JSON
else if (process.env.GCP_KEY_JSON) {
    let keyContent = process.env.GCP_KEY_JSON.trim();
    keyContent = keyContent.replace(/^["']|["']$/g, '');
    
    try {
        credentials = JSON.parse(keyContent);
        console.log("🚀 [GCS] Using raw JSON from Environment Variable");
    } catch (e) {
        try {
            const decoded = Buffer.from(keyContent, 'base64').toString();
            credentials = JSON.parse(decoded);
            console.log("🚀 [GCS] Using Base64 encoded JSON");
        } catch (b64Error) {
            console.error("❌ [GCS] JSON Parse Error:", e.message, "| Base64 Error:", b64Error.message);
        }
    }
}

const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    ...(credentials ? { credentials } : (keyExists ? { keyFilename: keyPath } : {})),
});

const isConfigured = !!(credentials || keyExists || process.env.GCP_PROJECT_ID);

if (!isConfigured) {
    console.warn("⚠️ [GCS] Warning: No credentials found (file or env). Fallback to LOCAL storage.");
}

/** 
 * 📤 อัปโหลดไฟล์: ลอง GCS ก่อน ถ้าพลาด (หรือไม่มีกุญแจ) จะเซฟลงโฟลเดอร์ uploads ในเครื่องแทน
 * เพิ่มการบีบอัดรูปภาพด้วย Sharp เพื่อลดขนาดไฟล์แต่คงความคมชัด
 */
export const uploadToGCS = async (file) => {
    if (!file) throw new Error("No file provided");
    if (!file.path) throw new Error("File must be uploaded to disk first (missing file.path)");

    let processedPath = file.path;
    let contentType = file.mimetype;
    let originalName = file.originalname;

    /* ─── [IMAGE OPTIMIZATION - DISABLED FOR STABILITY] ───
    if (file.mimetype.startsWith('image/') && fs.existsSync(file.path)) {
        try {
            const optimizedPath = `${file.path}-optimized.webp`;
            console.log("⚡ [Sharp] Starting optimization for:", file.path);
            
            await sharp(file.path)
                .rotate() // Auto-rotate based on EXIF
                .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(optimizedPath);
            
            if (fs.existsSync(optimizedPath)) {
                processedPath = optimizedPath;
                contentType = 'image/webp';
                originalName = path.parse(file.originalname).name + '.webp';
                console.log("✅ [Sharp] Optimization successful:", optimizedPath);
            }
        } catch (sharpError) {
            console.error("⚠️ [Sharp] Optimization failed:", sharpError.message);
            // We fall back to original file (processedPath remains file.path)
        }
    }
    ─── */

    // 1. ลองอัปโหลดขึ้น GCS ถ้ามีการตั้งค่ากุญแจไว้
    if (isConfigured) {
        try {
            const bucketName = process.env.GCP_BUCKET_NAME;
            const bucket = storage.bucket(bucketName);
            
            const fileExtension = path.extname(originalName);
            const gcsFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;

            await bucket.upload(processedPath, {
                destination: gcsFileName,
                gzip: true,
                metadata: {
                    contentType: contentType,
                },
            });
            
            const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;
            console.log("✅ [GCS] Uploaded & Made Public:", publicUrl);
            
            // ลบไฟล์ชั่วคราว (ทั้งตัวจริงและตัวที่บีบอัด)
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            if (processedPath !== file.path && fs.existsSync(processedPath)) fs.unlinkSync(processedPath);
            
            return publicUrl;
        } catch (gcsError) {
            console.error("❌ [GCS] Upload failed, falling back to LOCAL:", gcsError.message);
        }
    }

    // 2. ระบบสำรอง: LOCAL STORAGE
    try {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileExtension = path.extname(originalName);
        const localFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
        const targetPath = path.join(uploadDir, localFileName);

        // ย้ายไฟล์ที่ผ่านการประมวลผลแล้ว (หรือไฟล์เดิม) มาเก็บที่ uploads
        // ใช้ copy + unlink แทน rename เพื่อความปลอดภัยในการทำงานข้าม Volume ใน Docker
        fs.copyFileSync(processedPath, targetPath);
        fs.unlinkSync(processedPath);
        
        // ลบไฟล์เดิมถ้ามีการสร้างไฟล์ใหม่ (optimized) และไฟล์นั้นยังอยู่
        if (processedPath !== file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        const localPath = `uploads/${localFileName}`;
        console.log("📂 [Local] Saved successfully:", localPath);
        return localPath;
    } catch (localError) {
        console.error("🔥 [FATAL] Both GCS and Local storage failed:", localError.message);
        // ลบไฟล์ชั่วคราวทั้งหมดถ้าทุกอย่างล้มเหลว
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        if (processedPath !== file.path && fs.existsSync(processedPath)) fs.unlinkSync(processedPath);
        throw localError;
    }
};

/** 🗑️ ลบไฟล์: แกะชื่อไฟล์แบบชัวร์ๆ 100% */
export const deleteFromGCS = async (fileUrl) => {
    try {
        if (!fileUrl || !fileUrl.includes('storage.googleapis.com')) {
            console.log("⚠️ [GCS] URL ไม่ถูกต้อง ข้ามการลบ:", fileUrl);
            return false;
        }

        // แกะชื่อไฟล์: ตัด URL ส่วนหน้าออก และตัดตัวหลังเครื่องหมาย ? (ถ้ามี)
        const fileName = fileUrl.split('/').pop().split('?')[0]; 
        const bucketName = process.env.GCP_BUCKET_NAME;

        console.log(`🗑️ [GCS Debug] กำลังขอลบไฟล์: "${fileName}" จากถัง: "${bucketName}"`);

        const file = storage.bucket(bucketName).file(fileName);
        const [exists] = await file.exists();

        if (!exists) {
            console.error(`❌ [GCS] ไม่พบไฟล์ "${fileName}" (อาจถูกลบไปก่อนหน้า)`);
            return true; // คืนค่า true เพื่อให้ระบบหน้าบ้านเดินหน้าต่อได้
        }

        await file.delete();
        console.log(`✅ [GCS] ลบไฟล์ "${fileName}" สำเร็จ!`);
        return true;
    } catch (error) {
        console.error("🔥 [GCS Delete Fatal Error]:", error.message);
        return false;
    }
};