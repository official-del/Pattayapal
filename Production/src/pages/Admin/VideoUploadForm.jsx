import React, { useState } from 'react';
import axios from 'axios';
import '../../css/VideoUploadForm.css';

export default function VideoUploadForm({ onComplete }) {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus]   = useState('idle');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.includes('video')) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setStatus('idle');
      setProgress(0);
    } else {
      alert('กรุณาเลือกไฟล์วิดีโอเท่านั้น (MP4, MOV)');
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview('');
    setProgress(0);
    setStatus('idle');
  };

  // ☁️ แก้ฟังก์ชันนี้ให้ยิงไปที่ Google Cloud ผ่าน Backend ของเรา
  const uploadVideo = async () => {
    if (!file) return;
    setStatus('uploading');
    
    const formData = new FormData();
    formData.append('file', file); // ✅ ส่งไฟล์ในชื่อ 'file' ให้ตรงกับ multer ใน backend

    try {
      // ✅ ยิงมาที่ Local Backend ของเราแทน Cloudinary
      const res = await axios.post(
        `http://localhost:5000/api/upload/single`, 
        formData,
        {
          onUploadProgress: (e) => {
            setProgress(Math.round((e.loaded * 100) / e.total));
          },
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      
      setStatus('success');
      // console.log("✅ Video uploaded to GCS:", res.data.url);
      if (onComplete) onComplete(res.data.url); // ส่ง URL ที่ได้จาก GCS กลับไปให้ AdminWorkForm
    } catch (err) {
      // console.error("❌ GCS Upload Error:", err);
      setStatus('error');
      alert('อัปโหลดวิดีโอไม่สำเร็จ: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="custom-upload-card" data-status={status}>
      <div className="upload-header">
        <h3>VIDEO CONTENT UPLOADER (GCS)</h3>
        <span className="status-text">{status.toUpperCase()}</span>
      </div>

      <div className={`dropzone ${file ? 'has-file' : ''}`}>
        {!preview ? (
          <label className="upload-label">
            <input type="file" accept="video/*" onChange={handleFileChange} hidden />
            <div className="upload-icon">▶</div>
            <p>DRAG & DROP VIDEO OR <span>BROWSE</span></p>
            <small>UPLOAD TO GOOGLE CLOUD STORAGE</small>
          </label>
        ) : (
          <div className="video-preview-wrapper">
            <video src={preview} muted loop autoPlay />
            <button type="button" className="btn-remove" onClick={handleReset}>✕ ลบไฟล์</button>
          </div>
        )}
      </div>

      {status === 'uploading' && (
        <div className="progress-container">
          <div className="progress-info">
            <span>UPLOADING TO GOOGLE...</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="upload-actions">
        {status === 'success' ? (
          <div className="success-msg">✔ วิดีโอขึ้น Google Cloud แล้ว — บันทึกงานได้เลย</div>
        ) : (
          <button
            type="button"
            className={`btn-submit-upload ${!file || status === 'uploading' ? 'disabled' : ''}`}
            onClick={uploadVideo}
            disabled={!file || status === 'uploading'}
          >
            {status === 'uploading' ? 'SENDING TO CLOUD...' : 'START UPLOAD'}
          </button>
        )}
      </div>
    </div>
  );
}