import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const migrate = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✨ Connected!');

    const User = mongoose.model('User', new mongoose.Schema({
      isEmailVerified: { type: Boolean, default: false }
    }));

    console.log('⏳ Updating all existing users to isEmailVerified: true...');
    const result = await User.updateMany(
      { $or: [{ isEmailVerified: false }, { isEmailVerified: { $exists: false } }] },
      { $set: { isEmailVerified: true } }
    );

    console.log(`✅ Success! Updated ${result.modifiedCount} users.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();
