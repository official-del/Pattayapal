import { useState, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { postsAPI } from '../utils/api';
import { FiImage, FiSend, FiLoader, FiBriefcase, FiUserCheck, FiX, FiZap, FiPlusCircle, FiActivity } from 'react-icons/fi';
import { getFullUrl } from '../utils/mediaUtils';
import { motion, AnimatePresence } from 'framer-motion';

function CreatePostBox({ onPostCreated }) {
  const { user, token: contextToken, profileUpdateTag } = useContext(AuthContext);
  const currentToken = contextToken || localStorage.getItem('userToken') || localStorage.getItem('token');
  const userInfo = user || JSON.parse(localStorage.getItem('userInfo') || '{}');

  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass"
      style={{
        border: '1px solid rgba(255,255,255,0.03)',
        borderRadius: 'clamp(24px, 5vw, 50px)', padding: 'clamp(16px, 4vw, 40px)', marginBottom: 'clamp(20px, 4vw, 40px)', position: 'relative', overflow: 'hidden', boxSizing: 'border-box'
      }}
    >
      {/* 🚀 Post Type Signal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2vw, 15px)', marginBottom: 'clamp(20px, 4vw, 30px)', flexWrap: 'wrap' }}>
        <div style={{
          background: isGeneral ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)',
          color: isGeneral ? '#3b82f6' : '#22c55e',
          padding: 'clamp(6px, 1.5vw, 8px) clamp(16px, 3vw, 20px)', borderRadius: '40px', fontSize: 'clamp(0.6rem, 1vw, 0.7rem)', fontWeight: '700',
          display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '2px', border: '1px solid rgba(255,255,255,0.03)', whiteSpace: 'nowrap'
        }}>
          <FiZap style={{ width: '14px', height: '14px', flexShrink: 0 }} />
          {postTypeLabel}
        </div>
      </div>

      {/* Input Node */}
      <div style={{ display: 'flex', gap: 'clamp(12px, 3vw, 25px)', minWidth: 0 }}>
        <div style={{ width: 'clamp(45px, 10vw, 60px)', height: 'clamp(45px, 10vw, 60px)', borderRadius: '50%', background: '#000', border: '2px solid rgba(255,255,255,0.05)', overflow: 'hidden', flexShrink: 0 }}>
          <img src={userInfo?.profileImage?.url ? (getFullUrl(userInfo.profileImage.url) + `?t=${profileUpdateTag}`) : 'https://via.placeholder.com/60'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" />
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholderText}
          style={{
            flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            resize: 'none', minHeight: 'clamp(80px, 15vw, 100px)', outline: 'none', paddingTop: '15px', fontWeight: '700', letterSpacing: '-0.5px', minWidth: 0
          }}
        />
      </div>

      {/* Media Stream Preview */}
      <AnimatePresence>
        {mediaPreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            style={{ margin: 'clamp(20px, 3vw, 30px) 0 clamp(20px, 3vw, 30px) clamp(57px, 15vw, 85px)', position: 'relative', display: 'inline-block', maxWidth: 'calc(100% - clamp(57px, 15vw, 85px))' }}
          >
            <img src={mediaPreview} alt="Preview" style={{ maxHeight: '300px', maxWidth: '100%', borderRadius: 'clamp(24px, 4vw, 35px)', border: '1px solid rgba(255,255,255,0.05)' }} />
            <button onClick={removeMedia} style={{ position: 'absolute', top: 'clamp(10px, 2vw, 15px)', right: 'clamp(10px, 2vw, 15px)', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', color: '#fff', border: 'none', width: 'clamp(32px, 7vw, 40px)', height: 'clamp(32px, 7vw, 40px)', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiX style={{ width: '20px', height: '20px' }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tactical Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 'clamp(20px, 3vw, 30px)', marginTop: '10px', gap: 'clamp(10px, 2vw, 15px)', flexWrap: 'wrap' }}>
        <div>
          <input type="file" ref={fileInputRef} accept="image/*,video/*" style={{ display: 'none' }} onChange={handleMediaChange} />
          <motion.button
            whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.02)' }} onClick={() => fileInputRef.current.click()}
            style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 12px)', fontSize: 'clamp(0.75rem, 1.3vw, 0.85rem)', fontWeight: '700', padding: 'clamp(10px, 2vw, 12px) clamp(18px, 3vw, 24px)', borderRadius: '30px' }}
          >
            <FiPlusCircle style={{ width: '22px', height: '22px', flexShrink: 0 }} /> แนบไฟล์
          </motion.button>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 10px 30px var(--accent-glow)' }} whileTap={{ scale: 0.95 }}
          onClick={handlePost} disabled={isSubmitting}
          style={{
            background: 'var(--accent)', color: '#fff', border: 'none', padding: 'clamp(12px, 2vw, 18px) clamp(30px, 5vw, 45px)', borderRadius: '35px',
            fontWeight: '700', display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2vw, 15px)', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: 'clamp(0.85rem, 1.5vw, 1rem)', whiteSpace: 'nowrap'
          }}
        >
          {isSubmitting ? <FiLoader className="spin" style={{ width: '20px', height: '20px' }} /> : <FiSend style={{ width: '20px', height: '20px' }} />}
          โพสต์
        </motion.button>
      </div>
    </motion.div>
  );
}
export default CreatePostBox;
