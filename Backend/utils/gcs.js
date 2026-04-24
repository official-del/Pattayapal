import { Storage } from '@google-cloud/storage';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from 'fs';

const keyPath = path.join(__dirname, '../config/gcs-key.json'); 
const keyExists = fs.existsSync(keyPath);

if (!keyExists) {
    console.warn("⚠️ [GCS] Warning: gcs-key.json not found. System will try using Environment Default Credentials (ADC) or fallback to LOCAL storage.");
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
    if (!file.path) throw new Error("File must be uploaded to disk first (missing file.path)");

    // 1. ลองอัปโหลดขึ้น GCS ถ้ามีกุญแจ หรือ มี Project ID (ใช้ ADC)
    if (keyExists || process.env.GCP_PROJECT_ID) {
        try {
            const bucketName = process.env.GCP_BUCKET_NAME;
            const bucket = storage.bucket(bucketName);
            
            const fileExtension = path.extname(file.originalname);
            const gcsFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;

            await bucket.upload(file.path, {
                destination: gcsFileName,
                gzip: true,
                metadata: {
                    contentType: file.mimetype,
                },
            });
            
            const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;
            console.log("✅ [GCS] Uploaded successfully:", publicUrl);
            
            // ลบไฟล์ชั่วคราว
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            
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

        const fileExtension = path.extname(file.originalname);
        const localFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
        const targetPath = path.join(uploadDir, localFileName);

        // ย้ายไฟล์ชั่วคราวมาเก็บที่ uploads
        fs.renameSync(file.path, targetPath);
        
        const localPath = `uploads/${localFileName}`;
        console.log("📂 [Local] Saved successfully:", localPath);
        return localPath;
    } catch (localError) {
        console.error("🔥 [FATAL] Both GCS and Local storage failed:", localError.message);
        // ลบไฟล์ชั่วคราวถ้าทุกอย่างล้มเหลว
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
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