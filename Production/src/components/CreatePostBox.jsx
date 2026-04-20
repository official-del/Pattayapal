import { useState, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { postsAPI } from '../utils/api';
import { FiImage, FiSend, FiLoader, FiBriefcase, FiUserCheck, FiX, FiZap, FiPlusCircle, FiActivity } from 'react-icons/fi';
import { getFullUrl } from '../utils/mediaUtils';
import { motion, AnimatePresence } from 'framer-motion';

function CreatePostBox({ onPostCreated }) {
  const { user, token: contextToken } = useContext(AuthContext);
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
      formData.append('postType', isGeneral ? 'hiring' : 'looking for work');
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
        borderRadius: '50px', padding: '40px', marginBottom: '40px', position: 'relative', overflow: 'hidden'
      }}
    >
      {/* 🚀 Post Type Signal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <div style={{
          background: isGeneral ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)',
          color: isGeneral ? '#3b82f6' : '#22c55e',
          padding: '8px 20px', borderRadius: '40px', fontSize: '0.7rem', fontWeight: '700',
          display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '2px', border: '1px solid rgba(255,255,255,0.03)'
        }}>
          <FiZap size={14} />
          {postTypeLabel}
        </div>
      </div>

      {/* Input Node */}
      <div style={{ display: 'flex', gap: '25px' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#000', border: '2px solid rgba(255,255,255,0.05)', overflow: 'hidden', flexShrink: 0 }}>
          <img src={userInfo?.profileImage?.url ? getFullUrl(userInfo.profileImage.url) : 'https://via.placeholder.com/60'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" />
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholderText}
          style={{
            flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '1.25rem',
            resize: 'none', minHeight: '100px', outline: 'none', paddingTop: '15px', fontWeight: '700', letterSpacing: '-0.5px'
          }}
        />
      </div>

      {/* Media Stream Preview */}
      <AnimatePresence>
        {mediaPreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            style={{ margin: '30px 0 30px 85px', position: 'relative', display: 'inline-block' }}
          >
            <img src={mediaPreview} alt="Preview" style={{ maxHeight: '300px', borderRadius: '35px', border: '1px solid rgba(255,255,255,0.05)' }} />
            <button onClick={removeMedia} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', color: '#fff', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiX size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tactical Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '30px', marginTop: '10px' }}>
        <div>
          <input type="file" ref={fileInputRef} accept="image/*,video/*" style={{ display: 'none' }} onChange={handleMediaChange} />
          <motion.button
            whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.02)' }} onClick={() => fileInputRef.current.click()}
            style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', fontWeight: '700', padding: '12px 24px', borderRadius: '30px' }}
          >
            <FiPlusCircle size={22} /> แนบไฟล์
          </motion.button>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 10px 30px var(--accent-glow)' }} whileTap={{ scale: 0.95 }}
          onClick={handlePost} disabled={isSubmitting}
          style={{
            background: 'var(--accent)', color: '#fff', border: 'none', padding: '18px 45px', borderRadius: '35px',
            fontWeight: '700', display: 'flex', alignItems: 'center', gap: '15px', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '1rem'
          }}
        >
          {isSubmitting ? <FiLoader className="spin" size={20} /> : <FiSend size={20} />}
          โพสต์
        </motion.button>
      </div>
    </motion.div>
  );
}
export default CreatePostBox;
