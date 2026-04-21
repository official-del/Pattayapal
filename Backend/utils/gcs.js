import { Storage } from '@google-cloud/storage';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from 'fs';

const keyPath = path.join(__dirname, '../config/gcs-key.json'); 
const keyExists = fs.existsSync(keyPath);

if (!keyExists) {
    console.warn("⚠️ [GCS] Warning: gcs-key.json not found. System will fallback to LOCAL storage by default.");
}

const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    ...(keyExists ? { keyFilename: keyPath } : {}),
});

/** 
 * 📤 อัปโหลดไฟล์: ลอง GCS ก่อน ถ้าพลาด (หรือไม่มีกุญแจ) จะเซฟลงโฟลเดอร์ uploads ในเครื่องแทน
 */
export const uploadToGCS = async (file) => {
    if (!file) throw new Error("No file provided");

    // 1. ลองอัปโหลดขึ้น GCS ถ้ามีกุญแจ
    if (keyExists) {
        try {
            const bucketName = process.env.GCP_BUCKET_NAME;
            const bucket = storage.bucket(bucketName);
            
            const fileExtension = path.extname(file.originalname);
            const gcsFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
            const blob = bucket.file(gcsFileName);

            const publicUrl = await new Promise((resolve, reject) => {
                const blobStream = blob.createWriteStream({
                    resumable: false, // ปิด resumable เพื่อความเร็วในไฟล์เล็ก
                    contentType: file.mimetype,
                    gzip: true,
                });

                blobStream.on('error', (err) => reject(err));
                blobStream.on('finish', () => {
                    resolve(`https://storage.googleapis.com/${bucket.name}/${blob.name}`);
                });
                blobStream.end(file.buffer);
            });
            
            console.log("✅ [GCS] Uploaded successfully:", publicUrl);
            return publicUrl;
        } catch (gcsError) {
            console.error("❌ [GCS] Upload failed, falling back to LOCAL:", gcsError.message);
        }
    }

    // 2. ระบบสำรอง: LOCAL STORAGE (ถ้า GCS พลาด หรือหากุญแจไม่เจอ)
    try {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileExtension = path.extname(file.originalname);
        const localFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
        const filePath = path.join(uploadDir, localFileName);

        fs.writeFileSync(filePath, file.buffer);
        
        // คืนค่าเป็น Path สั้น เพื่อให้ getFullUrl ฝั่งหน้าบ้านจัดการต่อ
        const localPath = `uploads/${localFileName}`;
        console.log("📂 [Local] Saved successfully:", localPath);
        return localPath;
    } catch (localError) {
        console.error("🔥 [FATAL] Both GCS and Local storage failed:", localError.message);
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