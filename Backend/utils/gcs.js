import { Storage } from '@google-cloud/storage';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const keyPath = path.join(__dirname, '../config/gcs-key.json'); 
const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: keyPath,
});

/** 📤 อัปโหลดไฟล์: ใช้ Timestamp + Random เพื่อชื่อไฟล์ที่สะอาด */
export const uploadToGCS = (file) => {
    return new Promise((resolve, reject) => {
        try {
            if (!file) return reject(new Error("No file provided"));
            const bucketName = process.env.GCP_BUCKET_NAME;
            const bucket = storage.bucket(bucketName);
            
            const fileExtension = path.extname(file.originalname);
            const gcsFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
            const blob = bucket.file(gcsFileName);

            const blobStream = blob.createWriteStream({
                resumable: true,
                contentType: file.mimetype,
                gzip: true,
            });

            blobStream.on('error', (err) => reject(err));
            blobStream.on('finish', () => {
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
                resolve(publicUrl);
            });
            blobStream.end(file.buffer);
        } catch (error) { reject(error); }
    });
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