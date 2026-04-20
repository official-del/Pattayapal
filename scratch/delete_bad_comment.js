import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Work from './Backend/models/Work.js';
import Post from './Backend/models/Post.js';

dotenv.config({ path: './Backend/.env' });

async function findAndDeleteComment() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const targetText = "สัตว์ป่าน่ารักมากครับ";
    
    // Search in Works
    const works = await Work.find({ "comments.text": targetText });
    for (const work of works) {
      console.log(`Found in Work: ${work.title} (${work._id})`);
      const originalCount = work.comments.length;
      work.comments = work.comments.filter(c => c.text !== targetText);
      console.log(`Removed ${originalCount - work.comments.length} comments from work.`);
      await work.save();
    }

    // Search in Posts
    const posts = await Post.find({ "comments.text": targetText });
    for (const post of posts) {
      console.log(`Found in Post: ${post._id}`);
      const originalCount = post.comments.length;
      post.comments = post.comments.filter(c => c.text !== targetText);
      console.log(`Removed ${originalCount - post.comments.length} comments from post.`);
      await post.save();
    }

    console.log('Operation completed.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

findAndDeleteComment();
