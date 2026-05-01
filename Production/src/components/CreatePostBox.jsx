import { useState, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { postsAPI } from '../utils/api';
import { FiImage, FiSend, FiLoader, FiBriefcase, FiUserCheck, FiX, FiZap, FiPlusCircle, FiActivity } from 'react-icons/fi';
import { getFullUrl } from '../utils/mediaUtils';
import { motion, AnimatePresence } from 'framer-motion';

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

  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef(null);

  if (!userInfo?.id && !userInfo?._id) return null;

  const isGeneral = userInfo?.profession === 'General';
  const postTypeLabel = isGeneral ? 'แนะนำตัวหรือโชว์ผลงานของคุณ...' : 'แนะนำตัวหรือโชว์ผลงานของคุณ...';
  const placeholderText = isGeneral
    ? 'แนะนำตัวให้คอมมูนิตี้รู้จัก หรือแชร์ไอเดียของคุณที่นี่...'
    : 'แนะนำตัวให้คอมมูนิตี้รู้จัก หรือแชร์ไอเดียของคุณที่นี่...';

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMedia(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    setMedia(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePost = async () => {
    if (!content.trim() && !media) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('postType', isGeneral ? 'hiring' : 'looking_for_work');
      if (media) formData.append('media', media);

      const newPost = await postsAPI.create(formData, currentToken);
      setContent('');
      removeMedia();
      if (onPostCreated) onPostCreated(newPost);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-post-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="create-post-box glass"
      >
        {/* Profile Picture */}
        <div className="profile-pic-wrapper">
          <img src={userInfo?.profileImage?.url ? (getFullUrl(userInfo.profileImage.url) + `?t=${profileUpdateTag}`) : 'https://via.placeholder.com/60'} alt="Profile" />
        </div>

        {/* Input Box */}
        <div className="input-field-wrapper">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="แนะนำตัวให้คอมมูนิตี้ หรือแชร์ไอเดียของคุณ..."
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {/* Hidden file input */}
          <input type="file" ref={fileInputRef} accept="image/*,video/*" style={{ display: 'none' }} onChange={handleMediaChange} />
        </div>

        {/* Action Circles */}
        <div className="action-buttons-group">
          <button
            onClick={() => fileInputRef.current.click()}
            className="action-circle-btn media-btn"
            title="Upload Media"
          >
            <FiImage size={18} />
          </button>

          <button
            onClick={handlePost}
            disabled={isSubmitting || (!content.trim() && !media)}
            className="action-circle-btn send-post-btn"
            title="Post"
          >
            {isSubmitting ? <FiLoader className="spin" size={18} /> : <FiSend size={18} />}
          </button>
        </div>
      </motion.div>

      {/* Media Stream Preview */}
      <AnimatePresence>
        {mediaPreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="media-preview-wrapper"
          >
            <div className="media-preview-card">
              <img 
                src={mediaPreview} 
                alt="Preview" 
                onClick={() => setSelectedImage(mediaPreview)}
              />
              <button onClick={removeMedia} className="remove-media-btn">
                <FiX size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Preview Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fullscreen-modal"
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
        .create-post-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: clamp(30px, 6vw, 50px);
          width: 100%;
        }

        .create-post-box {
          display: flex;
          align-items: center;
          gap: clamp(10px, 2vw, 15px);
          background: rgba(255,255,255,0.03) !important;
          padding: clamp(10px, 2vw, 15px) !important;
          border-radius: 40px !important;
          border: 1px solid rgba(255,87,51,0.1) !important;
          width: 100%;
        }

        .profile-pic-wrapper {
          width: clamp(35px, 6vw, 45px);
          height: clamp(35px, 6vw, 45px);
          border-radius: 50%;
          background: #111;
          border: 2px solid var(--accent);
          overflow: hidden;
          flex-shrink: 0;
        }

        .profile-pic-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .input-field-wrapper {
          flex: 1;
          background: rgba(0,0,0,0.4);
          border-radius: 30px;
          padding: 0 clamp(15px, 3vw, 20px);
          display: flex;
          align-items: center;
          height: clamp(38px, 6vw, 48px);
          border: 1px solid rgba(255,255,255,0.05);
          min-width: 0;
        }

        .input-field-wrapper input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-size: clamp(0.8rem, 1.5vw, 0.95rem);
          font-weight: 500;
          width: 100%;
        }

        .input-field-wrapper input::placeholder {
          color: #444;
          font-weight: 700;
        }

        .action-buttons-group {
          display: flex;
          gap: clamp(6px, 1.5vw, 10px);
          flex-shrink: 0;
        }

        .action-circle-btn {
          width: clamp(38px, 6vw, 48px);
          height: clamp(38px, 6vw, 48px);
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.3s;
        }

        .media-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #666;
        }

        .media-btn:hover {
          background: rgba(255,87,51,0.1);
          border-color: var(--accent);
          color: var(--accent);
        }

        .send-post-btn {
          background: var(--accent);
          border: none;
          color: #fff;
          box-shadow: 0 5px 15px rgba(255,87,51,0.2);
        }

        .send-post-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .media-preview-wrapper {
          padding-left: clamp(45px, 8vw, 60px);
        }

        .media-preview-card {
          position: relative;
          display: inline-block;
          border-radius: 15px;
          overflow: hidden;
          border: 1px solid rgba(255,87,51,0.2);
          box-shadow: 0 10px 25px rgba(0,0,0,0.4);
        }

        .media-preview-card img {
          max-height: 250px;
          max-width: 100%;
          display: block;
          cursor: zoom-in;
        }

        .remove-media-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0,0,0,0.7);
          color: #fff;
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(5px);
        }

        .fullscreen-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.95);
          zIndex: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          cursor: zoom-out;
          backdrop-filter: blur(10px);
        }

        .modal-content {
          position: relative;
          max-width: 95%;
          max-height: 95%;
        }

        .modal-content img {
          max-width: 100%;
          max-height: 90vh;
          border-radius: 12px;
          display: block;
        }

        .modal-close-btn {
          position: absolute;
          top: -40px;
          right: 0;
          background: none;
          border: none;
          color: #fff;
          font-size: 1.8rem;
          cursor: pointer;
        }

        /* ── MOBILE OPTIMIZATION ── */
        @media (max-width: 480px) {
          .create-post-box {
            padding: 8px !important;
            gap: 8px !important;
          }
          .input-field-wrapper {
            padding: 0 12px;
          }
          .action-buttons-group {
            gap: 5px;
          }
          .media-preview-wrapper {
            padding-left: 0;
            display: flex;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
export default CreatePostBox;
