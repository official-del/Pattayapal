// utils/mediaUtils.js
// ✅ ใช้ร่วมกันทุกไฟล์ — แก้ที่นี่ที่เดียวพอ

import { CONFIG } from './config';

const API_BASE_URL = CONFIG.API_BASE_URL;  // e.g. http://localhost:5000 or https://pattayapal.com
const VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg'];
const WORK_COVER_PALETTES = [
  ['#170604', '#ff5a2f', '#ffd36b'],
  ['#071316', '#20d6b4', '#f6c35b'],
  ['#16071f', '#a855f7', '#ff7a45'],
  ['#101112', '#f97316', '#9ae6b4'],
  ['#061226', '#38bdf8', '#fb7185'],
  ['#191006', '#f59e0b', '#ef4444'],
  ['#0c111d', '#84cc16', '#fb923c'],
];

// normalize path ให้เป็น full URL
export const getFullUrl = (path, bustCache = false) => {
  if (!path) return "";
  
  // If it's already a full URL or a special protocol, return it as is
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:") || path.startsWith("data:")) {
    return path;
  }
  
  const cleanPath = path.replace(/^\/+/, "").replace(/^uploads\/+/, "");
  let finalUrl = "";
    
  // 💡 ระบบตรวจสอบอัตโนมัติ
  // - ถ้าเป็น path ที่มีคำว่า uploads/ (ไฟล์ local): ดึงจาก Server โดยตรง
  // - ถ้าเป็นไฟล์อื่นในโหมด PROD: ดึงจาก Google Cloud Storage
  if (path.includes('uploads/') || !import.meta.env.PROD) {
    // ✅ ใช้ API_BASE_URL (ไม่มี /api) เพื่อสร้าง /uploads/ URL ที่ถูกต้อง
    finalUrl = `${API_BASE_URL}/uploads/${cleanPath}`;
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
export const isImageUrl = (url = "") => {
  const lower = String(url).toLowerCase().split("?")[0];
  return IMAGE_EXTS.some(ext => lower.endsWith(ext));
};

const readMediaField = (value) => {
  if (!value) return "";
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') {
    const raw = value.url || value.secure_url || value.path || value.src || value.thumbnailUrl || value.posterUrl || "";
    return typeof raw === 'string' ? raw.trim() : "";
  }
  return "";
};

const hashString = (value = "") => {
  const text = String(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const escapeSvgText = (value = "") => (
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
);

const getCategoryLabel = (category) => {
  if (!category) return "";
  if (typeof category === 'string') return category;
  return category.name || category.title || category.label || "";
};

export const getWorkFallbackCoverUrl = (work) => {
  if (!work) return "";

  const seed = work._id || work.id || work.slug || work.title || work.createdAt || "pattayapal-work";
  const hash = hashString(seed);
  const [base, accent, warm] = WORK_COVER_PALETTES[hash % WORK_COVER_PALETTES.length];
  const rawTitle = (work.title || "Creator Work").trim().slice(0, 52);
  const rawCategory = (getCategoryLabel(work.category) || (work.type === 'video' ? "Video Work" : "Portfolio Work")).trim().slice(0, 32);
  const title = escapeSvgText(rawTitle);
  const category = escapeSvgText(rawCategory);
  const shortTitle = (work.title || "PP")
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase() || "PP";
  const initials = escapeSvgText(shortTitle);
  const angle = 18 + (hash % 34);
  const orbX = 180 + (hash % 560);
  const orbY = 90 + ((hash >> 3) % 260);
  const lineOffset = hash % 180;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" role="img" aria-label="${title}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${base}"/>
          <stop offset="0.58" stop-color="#080606"/>
          <stop offset="1" stop-color="#000000"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stop-color="${accent}" stop-opacity="0.72"/>
          <stop offset="0.5" stop-color="${accent}" stop-opacity="0.22"/>
          <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="rail" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="${accent}" stop-opacity="0"/>
          <stop offset="0.5" stop-color="${accent}" stop-opacity="0.42"/>
          <stop offset="1" stop-color="${warm}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#bg)"/>
      <circle cx="${orbX}" cy="${orbY}" r="360" fill="url(#glow)"/>
      <g opacity="0.62" transform="rotate(-${angle} 640 360)">
        <rect x="${-120 + lineOffset}" y="104" width="980" height="4" rx="2" fill="url(#rail)"/>
        <rect x="${80 + lineOffset}" y="258" width="1120" height="2" rx="1" fill="url(#rail)" opacity="0.65"/>
        <rect x="${-260 + lineOffset}" y="500" width="860" height="3" rx="1.5" fill="url(#rail)" opacity="0.5"/>
      </g>
      <text x="640" y="398" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="210" font-weight="900" fill="${warm}" fill-opacity="0.14">${initials}</text>
      <rect x="464" y="426" width="352" height="7" rx="3.5" fill="${accent}" fill-opacity="0.52"/>
      <rect x="72" y="64" width="156" height="156" rx="30" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.16"/>
      <text x="150" y="162" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="60" font-weight="800" fill="#ffffff">${initials}</text>
      <text x="78" y="548" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800" fill="${warm}">${category}</text>
      <text x="76" y="612" font-family="Inter, Arial, sans-serif" font-size="58" font-weight="900" fill="#ffffff">${title}</text>
      <text x="78" y="660" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff" fill-opacity="0.62">PattayaPal Creator Work</text>
    </svg>
  `.trim().replace(/\s{2,}/g, " ");

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

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
export const getWorkPosterUrl = (work) => {
  if (!work) return "";

  const candidates = [
    work.thumbnail,
    work.thumbnailUrl,
    work.posterImage,
    work.posterImageUrl,
    work.poster,
    work.posterUrl,
    work.cover,
    work.coverUrl,
    work.coverImage,
    work.coverImageUrl,
    work.previewImage,
    work.previewUrl,
    work.image,
    work.imageUrl,
  ];

  for (const candidate of candidates) {
    const raw = readMediaField(candidate);
    if (raw && !isVideoUrl(raw)) return getFullUrl(raw);
  }

  const mainImage = readMediaField(work.mainImage);
  if (mainImage && !isVideoUrl(mainImage)) return getFullUrl(mainImage);

  const mediaItems = Array.isArray(work.media) ? work.media : [];
  const imageItem = mediaItems.find((item) => {
    const raw = readMediaField(item);
    return raw && !isVideoUrl(raw);
  });
  const imageRaw = readMediaField(imageItem);
  if (imageRaw) return getFullUrl(imageRaw);

  const albumItems = Array.isArray(work.album) ? work.album : [];
  const albumImage = albumItems.find((item) => {
    const raw = readMediaField(item);
    return raw && !isVideoUrl(raw);
  });
  const albumRaw = readMediaField(albumImage);
  if (albumRaw) return getFullUrl(albumRaw);

  return getWorkFallbackCoverUrl(work);
};

export const getWorkVideoUrl = (work) => {
  if (!work) return "";

  const primaryCandidates = [work.videoUrl, work.mediaUrl];
  for (const candidate of primaryCandidates) {
    const raw = readMediaField(candidate);
    if (raw && (work.type === 'video' || isVideoUrl(raw))) return getFullUrl(raw);
  }

  const mainImage = readMediaField(work.mainImage);
  if (mainImage && isVideoUrl(mainImage)) return getFullUrl(mainImage);

  return getMediaUrl(work);
};

export const workIsVideo = (work) => {
  if (work.type === "video") return true;
  const url = work.mainImage?.url || work.videoUrl || work.mediaUrl || "";
  return isVideoUrl(url);
};
