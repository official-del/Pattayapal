import mongoose from 'mongoose';
import Message from './models/Message.js';

mongoose.connect('mongodb+srv://ppattayapal:Pattayapal%401412@cluster0.p7xun.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    const msgs = await Message.find({ 'attachments.0': { $exists: true } }).sort({createdAt: -1}).limit(5);
    console.log(JSON.stringify(msgs.map(m => m.attachments), null, 2));
    process.exit(0);
  });
