/**
 * Utility to format Date into human-readable relative time (Thai language)
 * Example: 5 minutes ago -> 5 นาทีที่แล้ว
 */
export const formatLastSeen = (dateString) => {
  if (!dateString) return 'ไม่ระบุ';
  
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return 'เมื่อสักครู่';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} นาทีที่แล้ว`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} วันที่แล้ว`;
  
  // If more than a week, show the date
  return past.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};
