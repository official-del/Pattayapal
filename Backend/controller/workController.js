import Work from '../models/Work.js';
import Category from '../models/Category.js';
import { updateUserStats } from '../utils/rankHandler.js';
import { uploadToGCS, deleteFromGCS } from '../utils/gcs.js';
import path from 'path';

// CREATE WORK
export const createWork = async (req, res) => {
  try {
    const workData = { ...req.body };

    // รูปหลัก
    if (req.files && req.files['mainImage']) {
      const url = await uploadToGCS(req.files['mainImage'][0]);
      workData.mainImage = { url, publicId: path.basename(url) };
    } else if (req.body.mainImageUrl) {
      workData.mainImage = { url: req.body.mainImageUrl, publicId: '' };
    }

    // รูปอัลบั้ม
    if (req.files && req.files['album']) {
      const uploads = [];
      for (const file of req.files['album']) {
        const url = await uploadToGCS(file);
        uploads.push({ url, publicId: path.basename(url) });
      }
      workData.album = uploads;
    }

    const work = new Work({
      ...workData,
      technologies: typeof workData.technologies === 'string' ? workData.technologies.split(',').map(t => t.trim()) : workData.technologies,
      createdBy: req.user.id
    });

    await work.save();
    res.status(201).json({ message: 'Created successfully', work });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE WORK
export const updateWork = async (req, res) => {
  try {
    let work = await Work.findById(req.params.id);
    if (!work) return res.status(404).json({ message: 'Not found' });

    // 🔐 Ownership Check
    const isOwner = work.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์แก้ไขผลงานนี้' });
    }

    const updateData = { ...req.body };

    // 1. จัดการรูปหลัก
    if (req.files && req.files['mainImage']) {
      // ลบรูปเก่าถ้ามี
      if (work.mainImage?.url) await deleteFromGCS(work.mainImage.url);
      const url = await uploadToGCS(req.files['mainImage'][0]);
      updateData.mainImage = { url, publicId: path.basename(url) };
    } else if (req.body.mainImageUrl) {
      updateData.mainImage = { url: req.body.mainImageUrl, publicId: '' };
    }

    // 2. จัดการอัลบั้ม (รูปเก่า + รูปใหม่)
    let finalAlbum = [];
    if (req.body.existingAlbum) {
      finalAlbum = JSON.parse(req.body.existingAlbum);
    }

    if (req.files && req.files['album']) {
      for (const file of req.files['album']) {
        const url = await uploadToGCS(file);
        finalAlbum.push({ url, publicId: path.basename(url) });
      }
    }
    updateData.album = finalAlbum;

    const updated = await Work.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.status(200).json({ message: 'Updated', work: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
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