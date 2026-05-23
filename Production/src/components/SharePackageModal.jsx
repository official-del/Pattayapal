import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { FiX, FiLink, FiCheck, FiSend } from 'react-icons/fi';
import { postsAPI } from '../utils/api';
import { CoinIcon } from './CoinIcon';

// ── Social Platform Icons (inline SVG to avoid extra deps) ──
const FacebookIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LineIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
  </svg>
);

function SharePackageModal({ pkg, profile, onClose }) {
  const [copied, setCopied] = useState(false);
  const [isSharingToFeed, setIsSharingToFeed] = useState(false);
  const [feedMessage, setFeedMessage] = useState('');
  const [isPostingToFeed, setIsPostingToFeed] = useState(false);

  // Build the shareable URL
  const profileSlug = profile?.username || profile?._id;
  const shareUrl = `${window.location.origin}/${profileSlug ? profileSlug : `profile/${profile?._id}`}?tab=packages`;
  const shareTitle = `${profile?.name} - ${pkg?.title} | Pattayapal`;
  const shareText = `💼 ${pkg?.title}\n⚡ ${pkg?.deliveryTime} วัน | 🪙 ${Number(pkg?.price).toLocaleString()} Coins\n📝 ${pkg?.description?.substring(0, 100) || ''}...\n\nดูแพ็กเกจทั้งหมดได้ที่:`;

  // ── External Share Handlers ──
  const handleFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
      '_blank', 'width=600,height=500'
    );
  };

  const handleX = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}&hashtags=Pattayapal,Freelance`,
      '_blank', 'width=600,height=500'
    );
  };

  const handleLine = () => {
    window.open(
      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      '_blank', 'width=600,height=500'
    );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('คัดลอกลิงก์สำเร็จ! 🔗');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('คัดลอกลิงก์ไม่สำเร็จ');
    }
  };

  // ── Internal Feed Share ──
  const handleShareToFeed = async () => {
    setIsPostingToFeed(true);
    try {
      const defaultMsg = `💼 กำลังรับงาน! เปิดบริการแพ็กเกจใหม่แล้วนะครับ\n\n📦 ${pkg?.title}\n⏱️ ส่งงานภายใน ${pkg?.deliveryTime} วัน\n🪙 ${Number(pkg?.price).toLocaleString()} Coins\n\n${pkg?.description || ''}\n\n👉 ดูรายละเอียดและจองได้เลยที่โปรไฟล์ครับ! ${shareUrl}`;
      const content = feedMessage.trim() ? `${feedMessage}\n\n${shareUrl}` : defaultMsg;

      const formData = new FormData();
      formData.append('content', content);
      formData.append('postType', 'looking_for_work');

      await postsAPI.create(formData);
      toast.success('แชร์แพ็กเกจลง Feed สำเร็จ! 🎉');
      onClose();
    } catch (err) {
      toast.error('ไม่สามารถโพสลง Feed ได้');
    } finally {
      setIsPostingToFeed(false);
    }
  };

  const socialPlatforms = [
    { label: 'Facebook', icon: <FacebookIcon />, color: '#1877f2', bg: 'rgba(24,119,242,0.1)', border: 'rgba(24,119,242,0.25)', action: handleFacebook },
    { label: 'X (Twitter)', icon: <XIcon />, color: '#000', bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.12)', action: handleX },
    { label: 'LINE', icon: <LineIcon />, color: '#06c755', bg: 'rgba(6,199,85,0.1)', border: 'rgba(6,199,85,0.25)', action: handleLine },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(15px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#0d0d0d',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '30px',
            padding: '35px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 40px 120px rgba(0,0,0,0.8)',
            position: 'relative'
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '20px', right: '20px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#666', width: '36px', height: '36px', borderRadius: '50%',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: '0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,87,51,0.15)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#666'; }}
          >
            <FiX size={16} />
          </button>

          {/* Header */}
          <div style={{ marginBottom: '25px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#555', letterSpacing: '2px', marginBottom: '8px' }}>SHARE PACKAGE</div>
            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#fff', lineHeight: 1.2 }}>{pkg?.title}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', color: '#666', fontSize: '0.85rem' }}>
              <CoinIcon size={16} />
              <span style={{ fontWeight: '700', color: 'var(--accent)' }}>{Number(pkg?.price).toLocaleString()} Coins</span>
              <span>·</span>
              <span>{pkg?.deliveryTime} วัน</span>
            </div>
          </div>

          {/* Package URL Preview */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px', padding: '12px 15px', marginBottom: '25px',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <FiLink size={14} color="#555" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: '#555', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareUrl}</span>
            <button
              onClick={handleCopyLink}
              style={{
                background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: copied ? '#22c55e' : '#888',
                padding: '5px 12px', borderRadius: '8px', cursor: 'pointer',
                fontWeight: '700', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px',
                transition: '0.3s', flexShrink: 0
              }}
            >
              {copied ? <><FiCheck size={12} /> Copied!</> : 'Copy'}
            </button>
          </div>

          {/* Section: Share to Social */}
          <div style={{ marginBottom: '25px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#444', letterSpacing: '2px', marginBottom: '12px' }}>SHARE TO SOCIAL MEDIA</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {socialPlatforms.map((platform) => (
                <motion.button
                  key={platform.label}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={platform.action}
                  style={{
                    flex: 1, padding: '14px 10px', borderRadius: '14px',
                    background: platform.bg, border: `1px solid ${platform.border}`,
                    color: platform.color, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                    fontWeight: '700', fontSize: '0.7rem', transition: '0.2s'
                  }}
                >
                  {platform.icon}
                  {platform.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
            <span style={{ fontSize: '0.65rem', color: '#333', fontWeight: '700', letterSpacing: '2px' }}>หรือ</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
          </div>

          {/* Section: Share to Feed */}
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#444', letterSpacing: '2px', marginBottom: '12px' }}>SHARE TO PATTAYAPAL FEED</div>
            {!isSharingToFeed ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsSharingToFeed(true)}
                style={{
                  width: '100%', padding: '16px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(255,87,51,0.12), rgba(99,102,241,0.08))',
                  border: '1px solid rgba(255,87,51,0.2)',
                  color: 'var(--accent)', fontWeight: '700', fontSize: '0.9rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  transition: '0.3s'
                }}
              >
                <FiSend size={16} />
                โพสแพ็กเกจลงหน้า Feed
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
              >
                <textarea
                  value={feedMessage}
                  onChange={(e) => setFeedMessage(e.target.value)}
                  placeholder={`💼 เขียนข้อความเพิ่มเติม (ไม่บังคับ)\n\nระบบจะแนบรายละเอียดแพ็กเกจและลิงก์ให้อัตโนมัติ`}
                  style={{
                    width: '100%', minHeight: '90px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px',
                    color: '#ccc', padding: '14px', fontSize: '0.85rem', resize: 'vertical',
                    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    lineHeight: 1.6
                  }}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setIsSharingToFeed(false)}
                    style={{
                      flex: 1, padding: '13px', borderRadius: '12px',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                      color: '#555', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem'
                    }}
                  >
                    ยกเลิก
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleShareToFeed}
                    disabled={isPostingToFeed}
                    style={{
                      flex: 2, padding: '13px', borderRadius: '12px',
                      background: isPostingToFeed ? '#222' : 'var(--accent)',
                      border: 'none', color: '#fff', fontWeight: '700',
                      cursor: isPostingToFeed ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: isPostingToFeed ? 'none' : '0 8px 20px rgba(255,87,51,0.25)',
                      transition: '0.3s'
                    }}
                  >
                    <FiSend size={14} />
                    {isPostingToFeed ? 'กำลังโพส...' : 'โพสลง Feed'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default SharePackageModal;
