import Work from '../models/Work.js';
import Category from '../models/Category.js';
import { updateUserStats } from '../utils/rankHandler.js';
import { uploadToGCS, deleteFromGCS } from '../utils/gcs.js';
import path from 'path';

// CREATE WORK
export const createWork = async (req, res) => {
  try {
    const workData = { ...req.body };
    const mediaUrl = req.body.mainImageUrl || req.body.mediaUrl;

    console.log("🛠️ [CreateWork] Payload:", req.body);

    // 🎬 Video Logic
    if (req.body.type === 'video') {
      if (mediaUrl) {
        workData.videoUrl = mediaUrl;
        workData.mainImage = { url: mediaUrl, publicId: '' };
      }
    } else {
      // 🖼️ Image Logic
      if (req.files && req.files['mainImage']) {
        const url = await uploadToGCS(req.files['mainImage'][0]);
        workData.mainImage = { url, publicId: path.basename(url) };
      } else if (mediaUrl) {
        workData.mainImage = { url: mediaUrl, publicId: 'manual-upload' };
      }
    }

    // 📂 Album Logic
    const finalAlbum = [];
    if (req.files && req.files['album']) {
      for (const file of req.files['album']) {
        const url = await uploadToGCS(file);
        finalAlbum.push({ url, publicId: path.basename(url) });
      }
    }
    workData.album = finalAlbum;

    // Handle Category safely
    if (workData.category === '' || workData.category === 'undefined') delete workData.category;

    const work = new Work({
      ...workData,
      technologies: typeof workData.technologies === 'string' ? workData.technologies.split(',').map(t => t.trim()) : (workData.technologies || []),
      createdBy: req.user.id
    });

    await work.save();
    
    // Populate before emitting
    const savedWork = await Work.findById(work._id).populate('category').populate('createdBy', 'name profileImage');
    
    // 📡 Emit Real-Time Event
    const io = req.app.get('io');
    if (io) io.emit('work_updated', { action: 'create', work: savedWork });

    console.log("✅ [CreateWork] Success:", work._id);
    res.status(201).json({ message: 'Created successfully', work: savedWork });
  } catch (error) {
    console.error("🔥 Create Work Error Details:", error);
    res.status(500).json({ message: `Database Save Error: ${error.message}` });
  }
};

// UPDATE WORK
export const updateWork = async (req, res) => {
  try {
    let work = await Work.findById(req.params.id);
    if (!work) return res.status(404).json({ message: 'Not found' });

    console.log("🛠️ [UpdateWork] Payload:", req.body);

    // 🔐 Ownership Check
    const isOwner = work.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์แก้ไขผลงานนี้' });
    }

    const updateData = { ...req.body };
    const mediaUrl = req.body.mainImageUrl || req.body.mediaUrl;

    // 🎬 Video Logic
    if (req.body.type === 'video') {
      if (mediaUrl) {
        updateData.videoUrl = mediaUrl;
        updateData.mainImage = { url: mediaUrl, publicId: '' };
      }
    } else {
      // 🖼️ Image Logic
      if (req.files && req.files['mainImage']) {
        if (work.mainImage?.url) await deleteFromGCS(work.mainImage.url);
        const url = await uploadToGCS(req.files['mainImage'][0]);
        updateData.mainImage = { url, publicId: path.basename(url) };
      } else if (mediaUrl) {
        updateData.mainImage = { url: mediaUrl, publicId: work.mainImage?.publicId || 'manual-update' };
      }
    }

    // 📂 Album Logic
    let finalAlbum = [];
    if (req.body.existingAlbum) {
      try {
        const parsed = JSON.parse(req.body.existingAlbum);
        // Ensure every item has a publicId to satisfy Mongoose validation
        finalAlbum = parsed.map(img => ({
          ...img,
          publicId: img.publicId || (img.url ? path.basename(img.url) : 'legacy-img')
        }));
        
        // 🗑️ GCS Garbage Collection: ลบรูปที่หายไปจาก finalAlbum ออกจาก Cloud
        if (work.album && work.album.length > 0) {
            const newUrls = finalAlbum.map(a => a.url);
            for (const oldItem of work.album) {
                if (oldItem.url && !newUrls.includes(oldItem.url)) {
                    await deleteFromGCS(oldItem.url);
                }
            }
        }
      } catch (pErr) {
        console.error("Album Parse Error:", pErr);
        finalAlbum = [];
      }
    } else {
        // ถ้าไม่มี existingAlbum ส่งมาเลย แสดงว่าผู้ใช้ลบรูปเก่าทิ้งหมด
        if (work.album && work.album.length > 0) {
            for (const oldItem of work.album) {
                if (oldItem.url) await deleteFromGCS(oldItem.url);
            }
        }
    }

    if (req.files && req.files['album']) {
      for (const file of req.files['album']) {
        const url = await uploadToGCS(file);
        finalAlbum.push({ url, publicId: path.basename(url) });
      }
    }
    updateData.album = finalAlbum;

    // Handle Category safely
    if (updateData.category === '' || updateData.category === 'undefined') delete updateData.category;

    const updated = await Work.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate('category')
      .populate('createdBy', 'name profileImage');
      
    // 📡 Emit Real-Time Event
    const io = req.app.get('io');
    if (io) io.emit('work_updated', { action: 'update', work: updated });

    console.log("✅ [UpdateWork] Success:", updated._id);
    res.status(200).json({ message: 'Updated', work: updated });
  } catch (error) {
    console.error("🔥 Update Work Error Details:", error);
    res.status(500).json({ message: `Update Error: ${error.message}` });
  }
};



export const getWorks = async (req, res) => {
  try {
    const works = await Work.find()
      .populate('category')
      .populate('createdBy', 'name profileImage')
      .sort({ createdAt: -1 });
    res.status(200).json({ works });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getWorkById = async (req, res) => {
  try {
    const work = await Work.findById(req.params.id)
      .populate('category')
      .populate('createdBy', 'name profileImage');
    
    if (work) { 
      const userId = req.user?.id;
      const isCreator = work.createdBy._id.toString() === userId;
      
      // ✅ [UNIQUE VIEW LOGIC] 
      // Only count views and award XP if:
      // 1. User is logged in
      // 2. User is NOT the creator
      // 3. User hasn't viewed this work before
      if (userId && !isCreator && !work.viewedBy.includes(userId)) {
        work.views += 1; 
        work.viewedBy.push(userId);
        await work.save();
        
        // 🏆 Reward Creator for the unique view
        const io = req.app.get('io');
        updateUserStats(work.createdBy._id, 'VIEW', {}, io).catch(err => console.error('XP Error:', err));
      }
    }
    res.status(200).json(work);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const deleteWork = async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);
    if (!work) return res.status(404).json({ message: 'Not found' });

    // 🔐 Ownership Check
    const isOwner = work.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ลบผลงานนี้' });
    }

    // 1. ลบรูปหลักจาก GCS
    if (work.mainImage?.url) await deleteFromGCS(work.mainImage.url);

    // 2. ลบรูปอัลบั้มทั้งหมด
    if (work.album && work.album.length > 0) {
      for (const item of work.album) {
        if (item.url) await deleteFromGCS(item.url);
      }
    }

    await Work.findByIdAndDelete(req.params.id);
    
    // 📡 Emit Real-Time Event
    const io = req.app.get('io');
    if (io) io.emit('work_updated', { action: 'delete', workId: req.params.id });

    res.status(200).json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// Get Works by User ID
export const getWorksByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const works = await Work.find({ createdBy: userId })
      .populate('category')
      .sort({ createdAt: -1 });
    res.status(200).json({ works });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};