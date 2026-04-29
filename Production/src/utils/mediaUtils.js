// utils/mediaUtils.js
// ✅ ใช้ร่วมกันทุกไฟล์ — แก้ที่นี่ที่เดียวพอ

import { CONFIG } from './config';

const API_URL = CONFIG.API_BASE_URL;

const VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];

// normalize path ให้เป็น full URL
export const getFullUrl = (path, bustCache = false) => {
  if (!path) return "";
  
  // If it's already a full URL or a special protocol, return it as is
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:") || path.startsWith("data:")) {
    return path;
  }
  
  const cleanPath = path.replace(/^\/+/, "").replace(/^uploads\/+/, "");
    
  // 💡 ระบบตรวจสอบอัตโนมัติ
  // ถ้า path มีคำว่า uploads/ หรือเราไม่ได้อยู่ในโหมด PROD ให้ดึงจาก Server โดยตรง
  if (path.includes('uploads/') || !import.meta.env.PROD) {
    finalUrl = `${API_URL}/uploads/${cleanPath}`;
  } else {
    // บน Host จริง และเป็นไฟล์ที่ไม่มี 'uploads/' นำหน้า: ดึงจาก Google Cloud Storage
    finalUrl = `https://storage.googleapis.com/pattayapal-assets/${cleanPath}`;
  }

  if (bustCache) {
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl = `${finalUrl}${separator}t=${new Date().getTime()}`;
  }

  return finalUrl;
};

// เช็คว่า URL นี้เป็นไฟล์วิดีโอไหม (ดู extension)
export const isVideoUrl = (url = "") => {
  const lower = url.toLowerCase().split("?")[0]; // ตัด query string ออกก่อน
  return VIDEO_EXTS.some(ext => lower.endsWith(ext));
};

// ดึง URL สื่อหลัก
export const getMediaUrl = (work) => {
  if (!work) return "";
  
  // 1. ลองเช็คจาก mainImage
  if (work.mainImage) {
    if (typeof work.mainImage === 'string' && work.mainImage.trim()) return getFullUrl(work.mainImage);
    if (work.mainImage.url?.trim()) return getFullUrl(work.mainImage.url);
  }

  // 2. ลองเช็คจากฟิลด์อื่นๆ
  if (work.videoUrl?.trim()) return getFullUrl(work.videoUrl);
  if (work.mediaUrl?.trim()) return getFullUrl(work.mediaUrl);
  if (work.coverImage?.url?.trim()) return getFullUrl(work.coverImage.url);
  if (typeof work.coverImage === 'string' && work.coverImage.trim()) return getFullUrl(work.coverImage);

  return "";
};

// ตัดสินใจว่า work นี้ควรแสดงเป็น video หรือ image
// ใช้ทั้ง work.type และ extension ของ URL จริงๆ
export const workIsVideo = (work) => {
  if (work.type === "video") return true;
  const url = work.mainImage?.url || work.videoUrl || work.mediaUrl || "";
  return isVideoUrl(url);
};