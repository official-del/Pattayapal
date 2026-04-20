import path from 'path';
import { uploadToGCS, deleteFromGCS } from '../utils/gcs.js';

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = await uploadToGCS(req.file);
    
    res.status(200).json({
      message: 'Image uploaded successfully',
      url: fileUrl,
      filename: path.basename(fileUrl),
      size: req.file.size,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteImage = async (req, res) => {
  try {
    const { filename, url } = req.body;
    const targetUrl = url || filename; // Handle both cases
    
    if (!targetUrl) {
      return res.status(400).json({ message: 'URL/Filename required' });
    }

    const success = await deleteFromGCS(targetUrl);
    if (success) {
      res.status(200).json({ message: 'Image deleted successfully' });
    } else {
      res.status(500).json({ message: 'Delete failed' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
