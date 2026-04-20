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

export const uploadToGCS = (file) => {
    return new Promise((resolve, reject) => {
        try {
            if (!file) return reject(new Error("No file provided"));
            const bucketName = process.env.GCP_BUCKET_NAME;
            const bucket = storage.bucket(bucketName);
            const gcsFileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
            const blob = bucket.file(gcsFileName);

            // 🚩 จุดตาย: ต้องประกาศบรรทัดนี้ "ก่อน" เรียกใช้ blobStream.on
            const blobStream = blob.createWriteStream({
                resumable: false,
                gzip: true,
                metadata: { contentType: file.mimetype },
            });

            // ✅ บรรทัดนี้จะทำงานได้เพราะ blobStream ถูกสร้างแล้วด้านบน
            blobStream.on('error', (err) => {
                console.error("❌ [GCS Stream Error]:", err);
                reject(err);
            });

            blobStream.on('finish', () => {
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
                console.log("✅ [GCS] Upload Finished:", publicUrl);
                resolve(publicUrl);
            });

            blobStream.end(file.buffer);

        } catch (error) {
            console.error("🔥 [GCS Fatal Error]:", error);
            reject(error);
        }
    });
};