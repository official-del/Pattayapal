import React from 'react';

export default function MediaUploader({ onUploadSuccess }) {
  const handleUpload = () => {
    if (!window.cloudinary) {
      alert("Cloudinary SDK กำลังโหลดหรือโหลดไม่สำเร็จ กรุณารีเฟรชหน้าเว็บ");
      return;
    }

    window.cloudinary.openUploadWidget(
      {
        cloudName: 'YOUR_CLOUD_NAME', // ใส่ Cloud Name ของคุณ
        uploadPreset: 'YOUR_PRESET',   // ใส่ Upload Preset (Unsigned) ของคุณ
        sources: ['local', 'url', 'camera'],
        resourceType: 'auto', // สำคัญ: เพื่อให้รองรับทั้ง Image และ Video
        multiple: true,
        clientAllowedFormats: ['png', 'jpg', 'jpeg', 'mp4', 'mov'],
        maxFileSize: 104857600, // จำกัด 100MB
      },
      (error, result) => {
        if (!error && result && result.event === "success") {
          onUploadSuccess(result.info);
        }
      }
    );
  };

  return (
    <div className="uploader-wrapper">
      <button onClick={handleUpload} className="btn-add">
        + อัปโหลดไฟล์ (Video/Image)
      </button>
      <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
        รองรับ MP4, MOV, JPG, PNG (Max 100MB)
      </p>
    </div>
  );
}