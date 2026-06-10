import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Message from './models/Message.js';

dotenv.config();

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is required to run this script.');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const msgs = await Message.find({ 'attachments.0': { $exists: true } }).sort({createdAt: -1}).limit(5);
    // console.log(JSON.stringify(msgs.map(m => m.attachments), null, 2));
    process.exit(0);
  });
