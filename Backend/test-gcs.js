// Quick GCS connectivity test – run with: node test-gcs.js
import './config/env.js';
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n🔍 Checking environment variables...');
console.log('  GCP_PROJECT_ID   :', process.env.GCP_PROJECT_ID || '❌ NOT SET');
console.log('  GCP_BUCKET_NAME  :', process.env.GCP_BUCKET_NAME || '❌ NOT SET');
console.log('  GCP_CLIENT_EMAIL :', process.env.GCP_CLIENT_EMAIL || '❌ NOT SET');
console.log('  GCP_PRIVATE_KEY  :', process.env.GCP_PRIVATE_KEY ? '✅ SET (hidden)' : '❌ NOT SET');

if (!process.env.GCP_CLIENT_EMAIL || !process.env.GCP_PRIVATE_KEY || !process.env.GCP_BUCKET_NAME) {
  console.error('\n❌ Missing required env vars. Please check your .env file.\n');
  process.exit(1);
}

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL.trim(),
    private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n').trim(),
  },
});

const bucketName = process.env.GCP_BUCKET_NAME;

// Create a small temp test file
const testFilePath = path.join(__dirname, 'gcs-test-file.txt');
fs.writeFileSync(testFilePath, `GCS Test - ${new Date().toISOString()}`);

const testFileName = `test-${Date.now()}.txt`;

console.log(`\n📤 Uploading test file "${testFileName}" to bucket "${bucketName}"...`);

try {
  const [gcsFile] = await storage.bucket(bucketName).upload(testFilePath, {
    destination: testFileName,
    metadata: { contentType: 'text/plain' },
  });

  try {
    await gcsFile.makePublic();
  } catch (e) {
    console.log('  ℹ️ makePublic() not needed (uniform access control):', e.message);
  }

  const publicUrl = `https://storage.googleapis.com/${bucketName}/${testFileName}`;
  console.log(`\n✅ SUCCESS! File uploaded to GCS:`);
  console.log(`   → ${publicUrl}`);

  // Cleanup: delete test file from GCS
  await storage.bucket(bucketName).file(testFileName).delete();
  console.log(`🗑️  Test file deleted from GCS.\n`);
} catch (err) {
  console.error(`\n❌ GCS UPLOAD FAILED: ${err.message}\n`);
  console.error('   Common causes:');
  console.error('   - Wrong GCP_PROJECT_ID');
  console.error('   - Service account does not have Storage Admin role');
  console.error('   - GCP_PRIVATE_KEY format is incorrect\n');
} finally {
  // Cleanup: local temp file
  if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
}
