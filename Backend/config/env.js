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
  [
    'MONGO_URI',
    'JWT_SECRET',
    'ALLOWED_ORIGINS',
    'FRONTEND_URL',
    'GCP_BUCKET_NAME',
    'GCP_PROJECT_ID',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
  ].forEach(requireEnv);

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
  if (!hasGcsJson && !hasGcsPair) {
    missing.push('valid GCP_KEY_JSON or GCP_CLIENT_EMAIL+GCP_PRIVATE_KEY');
  }

  if ((process.env.JWT_SECRET || '').length < 32 && process.env.JWT_SECRET) {
    process.env.ENV_CONFIG_ERROR = 'JWT_SECRET must be at least 32 characters in production.';
  } else if (missing.length > 0) {
    process.env.ENV_CONFIG_ERROR = `Missing required production environment variables: ${missing.join(', ')}`;
  }
}
