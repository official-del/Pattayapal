// utils/mediaUtils.js
// ✅ ใช้ร่วมกันทุกไฟล์ — แก้ที่นี่ที่เดียวพอ

import { CONFIG } from './config';

const API_URL = CONFIG.API_BASE_URL;

const VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];

// normalize path ให้เป็น full URL
export const getFullUrl = (path) => {
  if (!path) return "";
  
  // If it's already a full URL (http/https), return it as is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Remove leading slashes and redundant 'uploads/' prefix
  // This handles paths like '/uploads/file.jpg', 'uploads/file.jpg', and '/file.jpg'
  const cleanPath = path.replace(/^\/+/, "").replace(/^uploads\/+/, "");
  
  // Return absolute URL pointing to the backend's uploads directory
  return `${API_URL}/uploads/${cleanPath}`;
};

// เช็คว่า URL นี้เป็นไฟล์วิดีโอไหม (ดู extension)
export const isVideoUrl = (url = "") => {
  const lower = url.toLowerCase().split("?")[0]; // ตัด query string ออกก่อน
  return VIDEO_EXTS.some(ext => lower.endsWith(ext));
};

// ดึง URL สื่อหลัก (Cloudinary เก็บทั้ง video & image ใน mainImage.url)
export const getMediaUrl = (work) => {
  if (!work) return "";
  if (work.mainImage?.url?.trim()) return getFullUrl(work.mainImage.url);
  if (work.videoUrl?.trim()) return getFullUrl(work.videoUrl);       // ฟิลด์ใหม่
  if (work.mediaUrl?.trim()) return getFullUrl(work.mediaUrl);       // ฟิลด์เก่า
  return "";
};

// ตัดสินใจว่า work นี้ควรแสดงเป็น video หรือ image
// ใช้ทั้ง work.type และ extension ของ URL จริงๆ
export const workIsVideo = (work) => {
  if (work.type === "video") return true;
  const url = work.mainImage?.url || work.videoUrl || work.mediaUrl || "";
  return isVideoUrl(url);
};