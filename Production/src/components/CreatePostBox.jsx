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
      style={{
        display: 'flex', alignItems: 'center', gap: '15px',
        marginBottom: '40px',
        background: 'rgba(255,255,255,0.02)', // subtle background
        padding: '15px',
        borderRadius: '45px',
        border: '1px solid rgba(255,87,51,0.1)'
      }}
    >
      {/* Profile Picture */}
      <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#111', border: '2px solid var(--accent)', overflow: 'hidden', flexShrink: 0 }}>
        <img src={userInfo?.profileImage?.url ? (getFullUrl(userInfo.profileImage.url) + `?t=${profileUpdateTag}`) : 'https://via.placeholder.com/60'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" />
      </div>

      {/* Input Box */}
      <div style={{
        flex: 1,
        background: 'rgba(0,0,0,0.5)',
        borderRadius: '50px',
        padding: '0 25px',
        display: 'flex', alignItems: 'center',
        height: '50px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="แนะนำตัวให้คอมมูนิตี้รู้จัก หรือแชร์ไอเดียของคุณที่นี่..."
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: '#fff', fontSize: '0.95rem', fontWeight: '500'
          }}
        />
        {/* Hidden file input */}
        <input type="file" ref={fileInputRef} accept="image/*,video/*" style={{ display: 'none' }} onChange={handleMediaChange} />
      </div>

      {/* Action Circles */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => fileInputRef.current.click()}
          style={{
            width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,87,51,0.1)'; e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
          title="Upload Media"
        >
          <FiImage color="inherit" size={20} />
        </button>

        <button
          onClick={handlePost}
          disabled={isSubmitting || (!content.trim() && !media)}
          style={{
            width: '50px', height: '50px', borderRadius: '50%', background: 'var(--accent)',
            border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: (!content.trim() && !media) ? 0.5 : 1,
            boxShadow: '0 4px 15px rgba(255,87,51,0.3)'
          }}
          title="Post"
        >
          {isSubmitting ? <FiLoader className="spin" color="#fff" size={20} /> : <FiSend color="#fff" size={20} />}
        </button>

        {/* <button
          style={{
            width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,87,51,0.1)'; e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
        >
          <FiZap color="inherit" size={20} />
        </button> */}
      </div>

      {/* Media Stream Preview (Absolute positioning to not break the single row layout) */}
      <AnimatePresence>
        {mediaPreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }}
            style={{ position: 'absolute', top: '70px', left: '25px', zIndex: 10 }}
          >
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img src={mediaPreview} alt="Preview" style={{ maxHeight: '150px', borderRadius: '15px', border: '2px solid #ccc' }} />
              <button onClick={removeMedia} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.8)', color: '#fff', border: 'none', width: '25px', height: '25px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiX size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
export default CreatePostBox;
