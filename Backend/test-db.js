import './config/env.js';
import mongoose from 'mongoose';

console.log('Attempting to connect to MongoDB...');
console.log('URI:', process.env.MONGO_URI ? 'FOUND' : 'NOT FOUND');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✨ Success! Connected to MongoDB Atlas.');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Failed! Connection Error:', err.message);
    process.exit(1);
  });
