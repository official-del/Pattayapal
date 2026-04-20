import dotenv from 'dotenv';
dotenv.config();
console.log('✅ Environment Variables Loaded');
console.log('☁️ Target Bucket:', process.env.GCP_BUCKET_NAME);