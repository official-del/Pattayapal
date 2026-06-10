import { Storage } from '@google-cloud/storage';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// 🔑 GCS CREDENTIAL RESOLUTION (Priority Order)
// 1. Full JSON ENV var (GCP_KEY_JSON) - Base64 encoded (Safest for Hostinger)
// 2. Individual ENV vars (GCP_CLIENT_EMAIL + GCP_PRIVATE_KEY)
// 3. Local key file (gcs-key.json)
// ==========================================

const bucketName = process.env.GCP_BUCKET_NAME;
const projectId = process.env.GCP_PROJECT_ID;
const isProduction = process.env.NODE_ENV === 'production';
const logInfo = (...args) => {
    if (!isProduction) console.log(...args);
};

let credentials = null;
let credentialSource = 'none';

// Helper to ensure private key is formatted correctly
const formatKey = (key = '') => String(key).replace(/\\n/g, '\n').replace(/"/g, '').trim();

// Priority 1: Full JSON string (Base64)
if (process.env.GCP_KEY_JSON) {
    let keyContent = process.env.GCP_KEY_JSON.trim().replace(/^["']|["']$/g, '');
    try {
        const raw = JSON.parse(keyContent);
        if (!raw.client_email || !raw.private_key) throw new Error('Missing client_email or private_key');
        credentials = {
            client_email: raw.client_email,
            private_key: formatKey(raw.private_key)
        };
        credentialSource = 'ENV:JSON';
    } catch {
        try {
            const raw = JSON.parse(Buffer.from(keyContent, 'base64').toString('utf8'));
            if (!raw.client_email || !raw.private_key) throw new Error('Missing client_email or private_key');
            credentials = {
                client_email: raw.client_email,
                private_key: formatKey(raw.private_key)
            };
            credentialSource = 'ENV:JSON_BASE64';
        } catch (e) {
            console.error('❌ [GCS] GCP_KEY_JSON parse failed:', e.message);
        }
    }
}

// Priority 2: Individual fields
if (!credentials && process.env.GCP_CLIENT_EMAIL && process.env.GCP_PRIVATE_KEY) {
    credentials = {
        client_email: process.env.GCP_CLIENT_EMAIL.trim(),
        private_key: formatKey(process.env.GCP_PRIVATE_KEY),
    };
    credentialSource = 'ENV:EMAIL+KEY';
}

// Priority 3: Local key file
if (!credentials) {
    const keyPath = path.join(__dirname, '../config/gcs-key.json');
    if (fs.existsSync(keyPath)) {
        try {
            const raw = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
            credentials = {
                client_email: raw.client_email,
                private_key: raw.private_key,
            };
            credentialSource = 'FILE:gcs-key.json';
        } catch (e) {
            console.error('❌ [GCS] Failed to read gcs-key.json:', e.message);
        }
    }
}

const isConfigured = !!(credentials && bucketName);

if (!isConfigured) {
    console.error('🔥 [GCS] CRITICAL: No valid credentials found! All uploads will fail to reach GCS.');
    console.error('    → Set GCP_CLIENT_EMAIL and GCP_PRIVATE_KEY in your environment variables.');
} else {
    logInfo(`✅ [GCS] Initialized via [${credentialSource}] → Bucket: ${bucketName}`);
}

const storage = new Storage({
    projectId,
    credentials,
});

/**
 * 📤 Upload a file to GCS.
 * Throws an error if GCS upload fails (no local fallback – local files aren't persistent on cloud servers).
 */
export const uploadToGCS = async (file) => {
    if (!file) throw new Error('No file provided to uploadToGCS');
    if (!file.path) throw new Error('File must be saved to disk first (missing file.path)');

    if (!isConfigured) {
        throw new Error('GCS is not configured. Please set GCP_CLIENT_EMAIL, GCP_PRIVATE_KEY, and GCP_BUCKET_NAME environment variables.');
    }

    try {
        const bucket = storage.bucket(bucketName);
        const fileExtension = path.extname(file.originalname || '');
        const gcsFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;

        const [gcsFile] = await bucket.upload(file.path, {
            destination: gcsFileName,
            metadata: {
                contentType: file.mimetype,
                cacheControl: 'public, max-age=31536000',
            },
        });

        // Make the file publicly accessible
        try {
            await gcsFile.makePublic();
        } catch (pubErr) {
            // Bucket may use Uniform Access Control (fine) – URL still works if bucket is public
            console.warn(`⚠️ [GCS] makePublic() skipped (may not be needed):`, pubErr.message);
        }

        const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;
        logInfo(`✅ [GCS] Uploaded: ${publicUrl}`);

        // Clean up temp file
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

        return publicUrl;
    } catch (gcsError) {
        // Clean up temp file even on error
        if (file.path && fs.existsSync(file.path)) {
            try { fs.unlinkSync(file.path); } catch {}
        }
        console.error('🔥 [GCS] Upload failed:', gcsError.message);
        throw new Error(`GCS Upload Error: ${gcsError.message}`);
    }
};

/**
 * 🗑️ Delete a file from GCS.
 */
export const deleteFromGCS = async (fileUrl) => {
    try {
        if (!fileUrl || !fileUrl.includes('storage.googleapis.com')) {
            return false; // Not a GCS URL, skip silently
        }

        if (!isConfigured) {
            console.warn('⚠️ [GCS] Cannot delete – GCS not configured.');
            return false;
        }

        const fileName = fileUrl.split('/').pop().split('?')[0];
        const file = storage.bucket(bucketName).file(fileName);
        const [exists] = await file.exists();

        if (!exists) {
            console.warn(`⚠️ [GCS] File not found, skipping delete: ${fileName}`);
            return true;
        }

        await file.delete();
        logInfo(`✅ [GCS] Deleted: ${fileName}`);
        return true;
    } catch (error) {
        console.error('🔥 [GCS] Delete error:', error.message);
        return false;
    }
};
