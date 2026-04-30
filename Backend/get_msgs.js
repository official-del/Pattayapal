import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import Message from './models/Message.js';

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const msgs = await Message.find({ 'attachments.0': { $exists: true } }).sort({createdAt: -1}).limit(5);
    console.log(JSON.stringify(msgs.map(m => m.attachments), null, 2));
    process.exit(0);
  });
