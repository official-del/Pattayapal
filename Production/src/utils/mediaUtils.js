// utils/mediaUtils.js
// ✅ ใช้ร่วมกันทุกไฟล์ — แก้ที่นี่ที่เดียวพอ

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];

// normalize path ให้เป็น full URL
export const getFullUrl = (path) => {
  if (!path) return "";
  // ✅ ถ้าเป็น URL สมบูรณ์แล้ว (http/https) หรือเป็นของ Cloud (Google Storage / Cloudinary) ให้ใช้ค่านั้นได้เลย
  if (
    path.startsWith("http://") || 
    path.startsWith("https://") || 
    path.includes("storage.googleapis.com") ||
    path.includes("res.cloudinary.com")
  ) {
    return path;
  }
  const clean = path.replace(/^\/+/, "").replace(/^uploads\/+/, "");
  return `${API_URL}/uploads/${clean}`;
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