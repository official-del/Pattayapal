import dotenv from 'dotenv';
dotenv.config();

if (!process.env.MONGO_URI && process.env.MONGODB_URI) {
  process.env.MONGO_URI = process.env.MONGODB_URI;
}

const isProduction = process.env.NODE_ENV === 'production';
const missing = [];

const requireEnv = (name) => {
  if (!process.env[name] || String(process.env[name]).trim() === '') {
    missing.push(name);
  }
};

const parseGcsKeyJson = (value) => {
  const normalized = String(value || '').trim().replace(/^["']|["']$/g, '');
  if (!normalized) return null;

  try {
    return JSON.parse(normalized);
  } catch {
    return JSON.parse(Buffer.from(normalized, 'base64').toString('utf8'));
  }
};

if (isProduction) {
  // ✅ Critical vars - server cannot run without these
  ['MONGO_URI', 'JWT_SECRET', 'ALLOWED_ORIGINS', 'FRONTEND_URL'].forEach(requireEnv);

  // ✅ GCS credentials check
  let hasGcsJson = false;
  if (process.env.GCP_KEY_JSON) {
    try {
      const parsedKey = parseGcsKeyJson(process.env.GCP_KEY_JSON);
      hasGcsJson = !!(parsedKey?.client_email && parsedKey?.private_key);
    } catch {
      hasGcsJson = false;
    }
  }
  const hasGcsPair = !!(process.env.GCP_CLIENT_EMAIL && process.env.GCP_PRIVATE_KEY);
  if (!hasGcsJson && !hasGcsPair && !process.env.GCP_BUCKET_NAME) {
    console.warn('[ENV] WARNING: GCS not configured - file uploads will fail.');
  }

  // ✅ SMTP is optional - warn but don't crash
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[ENV] WARNING: SMTP not configured - email features will be disabled.');
  }

  // ❌ Only crash for truly critical missing vars
  if ((process.env.JWT_SECRET || '').length < 32) {
    console.error('[ENV] FATAL: JWT_SECRET must be at least 32 characters.');
    process.exit(1);
  }

  if (missing.length > 0) {
    console.error(`[ENV] FATAL: Missing critical environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}
