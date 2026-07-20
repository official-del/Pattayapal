import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { FiX, FiLink, FiCheck, FiSend } from 'react-icons/fi';
import { postsAPI } from '../utils/api';
import { CoinIcon } from './CoinIcon';
import '../css/SharePackageModal.css';

const FacebookIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LineIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

function SharePackageModal({ pkg, profile, onClose }) {
  const [copied, setCopied] = useState(false);
  const [isSharingToFeed, setIsSharingToFeed] = useState(false);
  const [feedMessage, setFeedMessage] = useState('');
  const [isPostingToFeed, setIsPostingToFeed] = useState(false);

  const profileSlug = profile?.username || profile?._id;
  const shareUrl = `${window.location.origin}/${profileSlug || `profile/${profile?._id}`}?tab=packages`;
  const packagePrice = Number(pkg?.price || 0).toLocaleString();
  const packageDays = pkg?.deliveryTime ? `${pkg.deliveryTime} days` : 'Timeline on request';
  const shareText = [
    `${profile?.name || 'PattayaPal creator'} is offering: ${pkg?.title}`,
    `${packagePrice} Coins / ${packageDays}`,
    pkg?.description ? pkg.description.substring(0, 120) : '',
    shareUrl,
  ].filter(Boolean).join('\n');

  const handleFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
      '_blank',
      'width=600,height=500'
    );
  };

  const handleX = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&hashtags=Pattayapal,Freelance`,
      '_blank',
      'width=600,height=500'
    );
  };

  const handleLine = () => {
    window.open(
      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      '_blank',
      'width=600,height=500'
    );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Package link copied.');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Could not copy the package link.');
    }
  };

  const handleShareToFeed = async () => {
    setIsPostingToFeed(true);
    try {
      const content = feedMessage.trim() || '';

      const formData = new FormData();
      formData.append('content', content);
      formData.append('postType', 'looking_for_work');
      formData.append('sharedPackage', JSON.stringify({
        title: pkg?.title || '',
        price: pkg?.price || 0,
        description: pkg?.description || '',
        deliveryTime: pkg?.deliveryTime || null,
        features: pkg?.features || [],
        ownerName: profile?.name || '',
        ownerUsername: profile?.username || profile?._id || '',
        ownerId: profile?._id || '',
      }));

      await postsAPI.create(formData);
      toast.success('Package posted to Feed.');
      onClose();
    } catch {
      toast.error('Could not post this package to Feed.');
    } finally {
      setIsPostingToFeed(false);
    }
  };

  const socialPlatforms = [
    { label: 'Facebook', icon: <FacebookIcon />, color: '#58a6ff', action: handleFacebook },
    { label: 'X', icon: <XIcon />, color: '#f8fafc', action: handleX },
    { label: 'LINE', icon: <LineIcon />, color: '#06c755', action: handleLine },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="share-package-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="share-package-modal"
          initial={{ scale: 0.96, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 16 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="share-package-close" type="button" onClick={onClose} aria-label="Close share package modal">
            <FiX size={16} />
          </button>

          <header className="share-package-header">
            <span className="share-package-kicker">Share Package</span>
            <h3>{pkg?.title}</h3>
            <div className="share-package-meta">
              <CoinIcon size={16} />
              <strong>{packagePrice} Coins</strong>
              <span>{packageDays}</span>
            </div>
          </header>

          <section className="share-package-url" aria-label="Package share link">
            <FiLink size={15} />
            <span>{shareUrl}</span>
            <button className={copied ? 'is-copied' : ''} type="button" onClick={handleCopyLink}>
              {copied ? <><FiCheck size={13} /> Copied</> : 'Copy'}
            </button>
          </section>

          <section className="share-package-section">
            <span className="share-package-section-title">Share To Social</span>
            <div className="share-package-social-grid">
              {socialPlatforms.map((platform) => (
                <motion.button
                  className="share-package-social"
                  key={platform.label}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={platform.action}
                  style={{ '--share-color': platform.color }}
                >
                  {platform.icon}
                  <span>{platform.label}</span>
                </motion.button>
              ))}
            </div>
          </section>

          <div className="share-package-divider"><span>OR</span></div>

          <section className="share-package-section">
            <span className="share-package-section-title">Share To PattayaPal Feed</span>
            {!isSharingToFeed ? (
              <motion.button
                className="share-package-feed-trigger"
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsSharingToFeed(true)}
              >
                <FiSend size={16} />
                Post package to Feed
              </motion.button>
            ) : (
              <motion.div
                className="share-package-feed-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <textarea
                  value={feedMessage}
                  onChange={(e) => setFeedMessage(e.target.value)}
                  placeholder="Add an optional message. PattayaPal will include the package details and link."
                />
                <div className="share-package-actions">
                  <button className="share-package-secondary" type="button" onClick={() => setIsSharingToFeed(false)}>
                    Cancel
                  </button>
                  <motion.button
                    className="share-package-primary"
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={handleShareToFeed}
                    disabled={isPostingToFeed}
                  >
                    <FiSend size={14} />
                    {isPostingToFeed ? 'Posting...' : 'Post to Feed'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </section>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default SharePackageModal;
