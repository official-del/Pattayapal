import { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { postsAPI } from '../utils/api';
import { FiImage, FiSend, FiX, FiVideo, FiPlay, FiUploadCloud } from 'react-icons/fi';
import { getFullUrl } from '../utils/mediaUtils';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumLoader from './PremiumLoader';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function CreatePostBox({ onPostCreated }) {
  const { user, token: contextToken, profileUpdateTag } = useContext(AuthContext);
  let currentToken = contextToken;
  let userInfo = user;
  if (!currentToken || !userInfo) {
    try {
      currentToken = currentToken || window.safeStorage.getItem('userToken') || window.safeStorage.getItem('token');
      userInfo = userInfo || JSON.parse(window.safeStorage.getItem('userInfo') || '{}');
    } catch (e) {
      if (!userInfo) userInfo = {};
    }
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [mediaPreview, setMediaPreview] = useState([]); // [{ url, type: 'image'|'video', name }]
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const textareaRef = useRef(null);

  if (!userInfo?.id && !userInfo?._id) return null;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content, isModalOpen]);

  const processFiles = (filesArray) => {
    if (filesArray.length + media.length > 5) {
      alert('อัปโหลดได้สูงสุด 5 ไฟล์เท่านั้น');
      return;
    }

    const oversized = filesArray.find(f => f.size > MAX_FILE_SIZE);
    if (oversized) {
      alert(`ไฟล์ "${oversized.name}" มีขนาดเกิน 50MB กรุณาเลือกไฟล์ที่เล็กกว่านี้`);
      return;
    }

    setMedia(prev => [...prev, ...filesArray]);
    const newPreviews = filesArray.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
      name: file.name,
    }));
    setMediaPreview(prev => [...prev, ...newPreviews]);
  };

  const handleMediaChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeMedia = (index) => {
    if (typeof index === 'number') {
      setMedia(prev => prev.filter((_, i) => i !== index));
      setMediaPreview(prev => prev.filter((_, i) => i !== index));
    } else {
      setMedia([]);
      setMediaPreview([]);
    }
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handlePost = async () => {
    if (!content.trim() && media.length === 0) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('postType', userInfo?.profession === 'General' ? 'hiring' : 'looking_for_work');
      if (media && media.length > 0) {
        media.forEach(file => formData.append('media', file));
      }

      const newPost = await postsAPI.create(formData, currentToken);
      setContent('');
      removeMedia();
      setIsModalOpen(false);
      if (onPostCreated) onPostCreated(newPost);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการโพสต์ โปรดลองอีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (type = 'text') => {
    setIsModalOpen(true);
    // User requested to not auto-open the file dialog for better UX.
    // They will drag & drop or click the buttons inside the modal manually.
  };

  return (
    <>
      {/* ─── TRIGGER BOX (แสดงบน Feed) ─── */}
      <div className="create-post-trigger" onClick={() => openModal('text')}>
        <div className="trigger-content glass">
          <div className="profile-pic-wrapper">
            <img src={userInfo?.profileImage?.url ? (getFullUrl(userInfo.profileImage.url) + `?t=${profileUpdateTag}`) : 'https://via.placeholder.com/60'} alt="Profile" />
          </div>
          <div className="trigger-input-fake">
            แนะนำตัวให้คอมมูนิตี้ หรือแชร์ไอเดียของคุณ...
          </div>
          <div className="trigger-actions">
            <button className="action-circle-btn media-btn" onClick={(e) => { e.stopPropagation(); openModal('image'); }} title="อัพโหลดรูปภาพ">
              <FiImage size={18} />
            </button>
            <button className="action-circle-btn video-btn" onClick={(e) => { e.stopPropagation(); openModal('video'); }} title="อัพโหลดวิดีโอสั้น">
              <FiVideo size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── CREATE POST MODAL (แบบ Professional) ─── */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="post-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          >
            <motion.div
              className="post-modal-content glass"
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="post-modal-header">
                <h3>สร้างโพสต์ใหม่</h3>
                <button className="close-modal-btn" onClick={() => !isSubmitting && setIsModalOpen(false)} disabled={isSubmitting}>
                  <FiX size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="post-modal-body">
                <div className="post-author-info">
                  <img src={userInfo?.profileImage?.url ? (getFullUrl(userInfo.profileImage.url) + `?t=${profileUpdateTag}`) : 'https://via.placeholder.com/60'} alt="Profile" />
                  <div>
                    <span className="author-name">{userInfo?.name || 'User'}</span>
                    <span className="author-role">{userInfo?.profession || 'Member'}</span>
                  </div>
                </div>

                <textarea
                  ref={textareaRef}
                  className="post-textarea"
                  placeholder="คุณกำลังคิดอะไรอยู่? หรือมีผลงานอะไรอยากโชว์ไหม..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isSubmitting}
                  autoFocus
                />

                {/* Drag & Drop Zone */}
                <div 
                  className={`drag-drop-zone ${isDragging ? 'dragging' : ''} ${mediaPreview.length > 0 ? 'has-media' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {mediaPreview.length === 0 ? (
                    <div className="empty-drop-zone">
                      <div className="upload-icons">
                        <FiUploadCloud size={32} />
                      </div>
                      <p>ลากรูปภาพหรือวิดีโอมาวางที่นี่</p>
                      <span>หรือ</span>
                      <div className="upload-buttons">
                        <button onClick={() => imageInputRef.current.click()} type="button">เลือกรูปภาพ</button>
                        <button onClick={() => videoInputRef.current.click()} type="button" className="video">เลือกวิดีโอ</button>
                      </div>
                    </div>
                  ) : (
                    <div className="media-preview-grid">
                      {mediaPreview.map((preview, index) => (
                        <div key={index} className={`preview-item ${preview.type}`}>
                          {preview.type === 'video' ? (
                            <>
                              <video src={preview.url} muted playsInline onMouseEnter={e => e.target.play()} onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }} />
                              <div className="video-badge"><FiPlay size={12} /> Video</div>
                            </>
                          ) : (
                            <img src={preview.url} alt="Preview" onClick={() => setSelectedImage(preview.url)} />
                          )}
                          <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeMedia(index); }} disabled={isSubmitting}>
                            <FiX size={14} />
                          </button>
                        </div>
                      ))}
                      {mediaPreview.length < 5 && (
                        <button className="add-more-media-btn" onClick={() => imageInputRef.current.click()} disabled={isSubmitting}>
                          <FiUploadCloud size={24} />
                          <span>เพิ่มรูป/วิดีโอ</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Hidden Inputs */}
                <input type="file" ref={imageInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleMediaChange} multiple disabled={isSubmitting} />
                <input type="file" ref={videoInputRef} accept="video/*" style={{ display: 'none' }} onChange={handleMediaChange} multiple disabled={isSubmitting} />
              </div>

              {/* Modal Footer */}
              <div className="post-modal-footer">
                <div className="media-limits">
                  สูงสุด 5 ไฟล์ (ภาพ/วิดีโอ) ขนาดไม่เกิน 50MB
                </div>
                <button 
                  className={`submit-post-btn ${(!content.trim() && media.length === 0) ? 'disabled' : ''}`}
                  onClick={handlePost}
                  disabled={isSubmitting || (!content.trim() && media.length === 0)}
                >
                  {isSubmitting ? (
                    <>
                      <PremiumLoader bare size="tiny" />
                      <span>กำลังโพสต์...</span>
                    </>
                  ) : (
                    <>
                      <span>โพสต์</span>
                      <FiSend size={16} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Image Preview */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fullscreen-modal"
            style={{ zIndex: 100000 }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedImage} alt="Full preview" />
              <button onClick={() => setSelectedImage(null)} className="modal-close-btn"><FiX /></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        /* ── TRIGGER BOX (Premium Capsule Design) ── */
        .create-post-trigger {
          width: 100%;
          margin-bottom: 0px;
          cursor: text;
          position: relative;
          z-index: 10;
        }
        .trigger-content {
          display: flex;
          align-items: center;
          gap: 14px;
          background: linear-gradient(145deg, rgba(22,22,24,0.8), rgba(12,12,14,0.9)) !important;
          padding: 10px 14px !important;
          border-radius: 100px !important; /* Capsule shape */
          border: 1px solid rgba(255,255,255,0.06) !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.04) !important;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          backdrop-filter: blur(16px) !important;
        }
        .trigger-content:hover {
          background: linear-gradient(145deg, rgba(28,28,30,0.9), rgba(16,16,18,0.95)) !important;
          border-color: rgba(168, 85, 247, 0.3) !important;
          box-shadow: 0 12px 40px rgba(168, 85, 247, 0.15), inset 0 1px 1px rgba(255,255,255,0.08) !important;
          transform: translateY(-2px);
        }
        .profile-pic-wrapper {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          padding: 2px;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
        }
        .profile-pic-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          border: 2px solid #0f0f13;
        }
        .trigger-input-fake {
          flex: 1;
          color: rgba(255,255,255,0.4);
          font-size: 15px;
          font-weight: 400;
          padding: 8px 12px;
          transition: color 0.3s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .trigger-content:hover .trigger-input-fake {
          color: rgba(255,255,255,0.7);
        }
        .trigger-actions {
          display: flex;
          gap: 6px;
          padding-right: 4px;
        }
        .action-circle-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.03);
          border: 1px solid transparent;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .action-circle-btn.media-btn:hover { 
          background: rgba(56, 189, 248, 0.1); 
          color: #38bdf8; 
          border-color: rgba(56, 189, 248, 0.2); 
          transform: scale(1.1) rotate(-5deg);
        }
        .action-circle-btn.video-btn:hover { 
          background: rgba(168, 85, 247, 0.1); 
          color: #a855f7; 
          border-color: rgba(168, 85, 247, 0.2); 
          transform: scale(1.1) rotate(5deg);
        }

        /* ── MODAL OVERLAY ── */
        .post-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(4, 4, 6, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        /* ── MODAL CONTENT (Ultra Premium Glass) ── */
        .post-modal-content {
          width: 100%;
          max-width: 640px;
          background: linear-gradient(165deg, rgba(22, 22, 26, 0.95) 0%, rgba(14, 14, 17, 0.98) 100%) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 24px !important;
          box-shadow: 0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1) !important;
          display: flex;
          flex-direction: column;
          max-height: 85vh;
          overflow: hidden;
          position: relative;
        }
        /* Top Glow Accent */
        .post-modal-content::before {
          content: '';
          position: absolute;
          top: 0; left: 10%; right: 10%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(168,85,247,0.5), transparent);
          z-index: 1;
        }

        /* ── HEADER ── */
        .post-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 28px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          position: relative;
          z-index: 2;
        }
        .post-modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.02em;
          background: linear-gradient(90deg, #fff, #a8a8b3);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .close-modal-btn {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.5);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .close-modal-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.3);
          transform: scale(1.05);
        }

        /* ── BODY ── */
        .post-modal-body {
          padding: 24px 28px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .post-author-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .post-author-info img {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(255,255,255,0.05);
        }
        .post-author-info .author-name {
          display: block;
          font-weight: 600;
          color: #fff;
          font-size: 16px;
          letter-spacing: -0.01em;
        }
        .post-author-info .author-role {
          display: block;
          font-size: 13px;
          background: linear-gradient(90deg, #a855f7, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 500;
          margin-top: 2px;
        }

        /* ── TEXTAREA ── */
        .post-textarea {
          width: 100%;
          min-height: 100px;
          background: transparent;
          border: none;
          color: #f3f4f6;
          font-size: 17px;
          line-height: 1.6;
          resize: none;
          outline: none;
          font-family: inherit;
        }
        .post-textarea::placeholder {
          color: rgba(255,255,255,0.25);
          font-weight: 400;
        }

        /* ── DRAG & DROP ZONE (Advanced) ── */
        .drag-drop-zone {
          width: 100%;
          border: 2px dashed rgba(255,255,255,0.08);
          border-radius: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: rgba(0,0,0,0.15);
          overflow: hidden;
          position: relative;
        }
        .drag-drop-zone::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(168,85,247,0.1) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .drag-drop-zone.dragging {
          border-color: #a855f7;
          background: rgba(168, 85, 247, 0.03);
          transform: scale(1.01);
        }
        .drag-drop-zone.dragging::before {
          opacity: 1;
        }
        .drag-drop-zone.has-media {
          border: 1px solid rgba(255,255,255,0.05);
          background: transparent;
        }
        
        .empty-drop-zone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 20px;
          gap: 16px;
          text-align: center;
        }
        .upload-icons {
          color: #a855f7;
          margin-bottom: 4px;
          filter: drop-shadow(0 4px 12px rgba(168,85,247,0.4));
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .empty-drop-zone p {
          margin: 0;
          color: #e5e7eb;
          font-size: 16px;
          font-weight: 500;
        }
        .empty-drop-zone span {
          color: rgba(255,255,255,0.3);
          font-size: 13px;
        }
        .upload-buttons {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }
        .upload-buttons button {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 14px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .upload-buttons button:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-2px);
        }
        .upload-buttons button.video {
          background: rgba(168, 85, 247, 0.1);
          border-color: rgba(168, 85, 247, 0.2);
          color: #e9d5ff;
        }
        .upload-buttons button.video:hover {
          background: rgba(168, 85, 247, 0.2);
          border-color: rgba(168, 85, 247, 0.4);
        }

        /* ── PREVIEW GRID ── */
        .media-preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 14px;
          padding: 16px;
        }
        .preview-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 12px;
          overflow: hidden;
          background: #000;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        }
        .preview-item:hover {
          transform: scale(1.02);
        }
        .preview-item img, .preview-item video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .preview-item.video video {
          cursor: pointer;
        }
        .video-badge {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: rgba(0,0,0,0.65);
          color: #fff;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .remove-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(0,0,0,0.5);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: all 0.2s;
        }
        .remove-btn:hover {
          background: #ef4444;
          border-color: #f87171;
          transform: scale(1.1);
        }
        .add-more-media-btn {
          aspect-ratio: 1;
          border-radius: 12px;
          border: 2px dashed rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.02);
          color: rgba(255,255,255,0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .add-more-media-btn:hover {
          background: rgba(255,255,255,0.05);
          color: #fff;
          border-color: rgba(255,255,255,0.3);
        }
        .add-more-media-btn span {
          font-size: 13px;
          font-weight: 500;
        }

        /* ── FOOTER ── */
        .post-modal-footer {
          padding: 16px 28px 20px;
          border-top: 1px solid rgba(255,255,255,0.04);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: transparent;
        }
        .media-limits {
          font-size: 13px;
          color: rgba(255,255,255,0.4);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .media-limits::before {
          content: 'ℹ';
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          font-size: 10px;
          font-weight: bold;
        }
        
        .submit-post-btn {
          background: linear-gradient(135deg, #a855f7, #ec4899);
          color: #fff;
          border: none;
          padding: 12px 28px;
          border-radius: 100px;
          font-size: 15px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          box-shadow: 0 4px 15px rgba(168, 85, 247, 0.3);
        }
        .submit-post-btn:hover:not(.disabled) {
          box-shadow: 0 8px 25px rgba(168, 85, 247, 0.5);
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
        .submit-post-btn:active:not(.disabled) {
          transform: translateY(1px);
        }
        .submit-post-btn.disabled {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.3);
          box-shadow: none;
          cursor: not-allowed;
        }

        /* ── FULLSCREEN PREVIEW ── */
        .fullscreen-modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 40px;
          backdrop-filter: blur(10px);
        }
        .modal-content {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
        }
        .modal-content img {
          max-width: 100%;
          max-height: 90vh;
          border-radius: 8px;
          object-fit: contain;
        }
        .modal-close-btn {
          position: absolute;
          top: -15px;
          right: -15px;
          background: var(--accent);
          color: white;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          transition: transform 0.2s;
        }
        .modal-close-btn:hover {
          transform: scale(1.1);
        }

        /* ── RESPONSIVE (Mobile <= 480px) ── */
        @media (max-width: 480px) {
          .post-modal-overlay {
            padding: 10px;
          }
          .post-modal-header {
            padding: 16px 20px;
          }
          .post-modal-body {
            padding: 16px 20px;
            gap: 16px;
          }
          .empty-drop-zone p {
            font-size: 14px;
          }
          .upload-buttons {
            flex-direction: column;
            width: 100%;
          }
          .upload-buttons button {
            width: 100%;
            justify-content: center;
          }
          .post-modal-footer {
            padding: 16px 20px;
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
            text-align: center;
          }
          .submit-post-btn {
            width: 100%;
            justify-content: center;
            white-space: nowrap; /* Prevent vertical stacking of text */
          }
          .media-limits {
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}

export default CreatePostBox;
