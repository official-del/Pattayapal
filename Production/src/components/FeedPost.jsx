import { customConfirm } from '../utils/customConfirm';
import { toast } from 'react-hot-toast';
import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { postsAPI } from '../utils/api';
import { FiHeart, FiMessageSquare, FiMoreHorizontal, FiSend, FiClock, FiBriefcase, FiUserCheck, FiTrash2, FiActivity, FiShare2, FiZap, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { getFullUrl, isVideoUrl } from '../utils/mediaUtils';
import { motion, AnimatePresence } from 'framer-motion';
import HoverVideoPlayer from './HoverVideoPlayer';
import OptimizedImage from './OptimizedImage';
import React from 'react';
import { createPortal } from 'react-dom';
// ── URL Auto-Linker Helper ──
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

function renderContentWithLinks(text) {
  if (!text) return null;
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      URL_REGEX.lastIndex = 0; // Reset regex state
      const href = part.startsWith('http') ? part : `https://${part}`;
      // Detect internal links (same hostname)
      let isInternal = false;
      try {
        const url = new URL(href);
        isInternal = url.hostname === window.location.hostname;
      } catch {}
      
      if (isInternal) {
        try {
          const url = new URL(href);
          const internalPath = url.pathname + url.search + url.hash;
          return (
            <Link
              key={i}
              to={internalPath}
              style={{
                color: 'var(--accent)',
                textDecoration: 'underline',
                textDecorationColor: 'rgba(255,87,51,0.4)',
                textUnderlineOffset: '3px',
                fontWeight: '600',
                wordBreak: 'break-all',
                transition: '0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.textDecorationColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.textDecorationColor = 'rgba(255,87,51,0.4)'}
            >
              {part}
            </Link>
          );
        } catch {}
      }

      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#6366f1',
            textDecoration: 'underline',
            textDecorationColor: 'rgba(99,102,241,0.4)',
            textUnderlineOffset: '3px',
            fontWeight: '600',
            wordBreak: 'break-all',
            transition: '0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.textDecorationColor = '#6366f1'}
          onMouseLeave={e => e.currentTarget.style.textDecorationColor = 'rgba(99,102,241,0.4)'}
        >
          {part}
        </a>
      );
    }
    return part ? <React.Fragment key={i}>{part}</React.Fragment> : null;
  });
}

const FeedPost = React.memo(({ post, onPostDeleted, isCommentsOpen = false, onToggleComments }) => {
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

  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [isLiked, setIsLiked] = useState(userInfo?._id || userInfo?.id ? post.likes?.includes(userInfo._id || userInfo.id) : false);
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState('');

  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [copied, setCopied] = useState(false);

  const isAuthor = userInfo && (post.author?._id === (userInfo._id || userInfo.id));
  const displayAuthor = isAuthor ? userInfo : post.author;
  const isHiring = post.postType === 'hiring';
  const accentColor = isHiring ? '#3b82f6' : '#22c55e';

  useEffect(() => {
    if (!isCommentsOpen) {
      setReplyingTo(null);
      setReplyText('');
      setExpandedReplies({});
    }
  }, [isCommentsOpen]);

  const handleLike = async () => {
    if (!currentToken) return;
    try {
      const res = await postsAPI.like(post._id, currentToken);
      setLikesCount(res.likes.length);
      setIsLiked(res.isLiked);
    } catch (err) { console.error(err); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !currentToken) return;
    try {
      const updatedComments = await postsAPI.comment(post._id, commentText, currentToken);
      setComments(updatedComments);
      setCommentText('');
    } catch (err) { console.error(err); }
  };

  const handleReply = async (e, commentId) => {
    e.preventDefault();
    if (!replyText.trim() || !currentToken) return;
    try {
      const updatedComments = await postsAPI.replyComment(post._id, commentId, replyText, currentToken);
      setComments(updatedComments);
      setReplyText('');
      setReplyingTo(null);
      setExpandedReplies(prev => ({ ...prev, [commentId]: true }));
    } catch (err) { console.error('Error replying:', err); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!await customConfirm('คุณต้องการลบคอมเมนต์นี้ใช่หรือไม่?')) return;
    try {
      const updatedComments = await postsAPI.deleteComment(post._id, commentId, currentToken);
      setComments(updatedComments);
    } catch (err) { toast.success('ลบไม่สำเร็จ'); }
  };

  const handleDeletePost = async () => {
    if (!await customConfirm('คุณต้องการลบโพสต์นี้ใช่หรือไม่?')) return;
    try {
      await postsAPI.delete(post._id, currentToken);
      if (onPostDeleted) onPostDeleted(post._id);
    } catch (err) { toast.success('ลบไม่สำเร็จ'); }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/posts/${post._id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="feed-post-card"
      style={{
        position: 'relative', overflow: 'hidden', padding: 'clamp(16px, 4vw, 40px)', borderRadius: 'clamp(24px, 5vw, 50px)',
        marginBottom: 'clamp(10px, 2vw, 15px)', border: '1px solid rgba(255,255,255,0.03)', background: 'rgba(255,255,255,0.01)', boxSizing: 'border-box'
      }}
    >
      {/* 🚀 Signal Category Beam */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '3px', background: 'var(--accent)', opacity: 0.9, borderRadius: '10px 10px 0 0' }} />

      {/* Operative Header */}
      <div className="feed-post-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(20px, 4vw, 30px)', gap: 'clamp(12px, 2vw, 20px)' }}>
        <div className="feed-post-author-block" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vw, 20px)', minWidth: 0 }}>
          <Link to={`/profile/${post.author?._id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <OptimizedImage 
              src={displayAuthor?.profileImage?.url ? (getFullUrl(displayAuthor.profileImage.url) + (isAuthor ? `?t=${profileUpdateTag}` : '')) : 'https://via.placeholder.com/60'} 
              style={{ width: 'clamp(45px, 10vw, 60px)', height: 'clamp(45px, 10vw, 60px)', borderRadius: '50%', background: '#000', border: `2px solid rgba(255,255,255,0.05)` }} 
              alt="" 
            />
          </Link>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 12px)', flexWrap: 'wrap' }}>
              <Link className="feed-post-author-name" to={`/profile/${post.author?._id}`} style={{ textDecoration: 'none', color: '#fff', fontWeight: '700', fontSize: 'clamp(0.9rem, 2vw, 1.2rem)', letterSpacing: '-0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {post.author?.name || 'Unknown Operative'}
              </Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#222', fontSize: 'clamp(0.65rem, 1.2vw, 0.75rem)', fontWeight: '700', marginTop: '6px' }}>
              <FiClock size={12} /> {new Date(post.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        <div className="feed-post-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 12px)' }}>
          <motion.button 
            whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            style={{ 
              background: copied ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)', 
              border: `1px solid ${copied ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`, 
              color: copied ? 'var(--accent)' : '#888', 
              cursor: 'pointer', 
              padding: 'clamp(8px, 1.5vw, 12px)', 
              borderRadius: '15px', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            title="แชร์โพสต์"
          >
            {copied ? <FiZap style={{ width: '18px', height: '18px' }} /> : <FiShare2 style={{ width: '18px', height: '18px' }} />}
            <AnimatePresence>
              {copied && (
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{ position: 'absolute', bottom: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', color: 'var(--accent)', fontWeight: '800', whiteSpace: 'nowrap' }}
                >
                  COPIED!
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {isAuthor && (
            <motion.button 
              whileHover={{ scale: 1.1, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }} 
              onClick={handleDeletePost} 
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                color: '#888', 
                cursor: 'pointer', 
                padding: 'clamp(8px, 1.5vw, 12px)', 
                borderRadius: '15px', 
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              title="ลบโพสต์"
            >
              <FiTrash2 style={{ width: '18px', height: '18px' }} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Intelligence Payload */}
      <div style={{ fontSize: 'clamp(0.9rem, 2vw, 1.25rem)', lineHeight: 1.7, color: '#aaa', marginBottom: 'clamp(20px, 4vw, 30px)', fontWeight: '500', whiteSpace: 'pre-line', padding: '0 clamp(0px, 1vw, 5px)', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
        {renderContentWithLinks(post.content)}
      </div>

      {/* Media Stream */}
      {post.media && post.media.length > 0 && (
        <motion.div
          whileHover={{ scale: 1.01 }}
          style={{ marginBottom: 'clamp(20px, 4vw, 35px)', borderRadius: 'clamp(20px, 4vw, 40px)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', background: '#000', maxHeight: '700px' }}
        >
          {isVideoUrl(post.media[0].url) ? (
            <HoverVideoPlayer src={getFullUrl(post.media[0].url)} style={{ width: '100%', height: 'auto' }} />
          ) : (
            <OptimizedImage 
              src={getFullUrl(post.media[0].url)} 
              onClick={() => setSelectedImage(getFullUrl(post.media[0].url))}
              style={{ width: '100%', height: 'auto', minHeight: '200px', cursor: 'zoom-in' }} 
              alt="Pipeline media" 
            />
          )}
        </motion.div>
      )}

      {/* Tactical Interaction Nodes */}
      <div className="feed-post-actions" style={{ display: 'flex', gap: 'clamp(10px, 2vw, 15px)', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleLike}
          className={`feed-post-action ${isLiked ? 'is-active' : ''}`}
          style={{
            height: 'clamp(45px, 10vw, 60px)', borderRadius: '30px', border: `1px solid ${isLiked ? 'var(--accent)' : 'rgba(255,255,255,0.03)'}`,
            display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 12px)', cursor: 'pointer', padding: '0 clamp(15px, 3vw, 30px)',
            color: isLiked ? 'var(--accent)' : '#fff', fontWeight: '700', fontSize: 'clamp(0.75rem, 1.3vw, 0.95rem)', transition: '0.3s', whiteSpace: 'nowrap'
          }}
        >
          <FiHeart fill={isLiked ? 'var(--accent)' : 'none'} style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          <span style={{ color: '#fff' }}>{likesCount} <span style={{ fontSize: 'clamp(0.6rem, 1vw, 0.7rem)', opacity: 0.5, marginLeft: '5px' }}>Like</span></span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onToggleComments?.(post._id)}
          className={`feed-post-action ${isCommentsOpen ? 'is-active' : ''}`}
          style={{
            height: 'clamp(45px, 10vw, 60px)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.03)',
            display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 12px)', cursor: 'pointer', padding: '0 clamp(15px, 3vw, 30px)',
            color: isCommentsOpen ? 'var(--accent)' : '#fff', fontWeight: '700', fontSize: 'clamp(0.75rem, 1.3vw, 0.95rem)', transition: '0.3s', whiteSpace: 'nowrap'
          }}
        >
          <FiMessageSquare style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          <span style={{ color: '#fff' }}>{comments.length} <span style={{ fontSize: 'clamp(0.6rem, 1vw, 0.7rem)', opacity: 0.5, marginLeft: '5px' }}>Comment</span></span>
        </motion.button>

      </div>

      {/* 🧬 Responses Feed Sub-System */}
      <AnimatePresence>
        {isCommentsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="feed-comments-panel"
          >
            <div className="feed-comments-inner">
              <div className="feed-comments-list">
                {comments.map((c, i) => {
                  const uId = userInfo?._id || userInfo?.id;
                  const isCommentOwner = c.user?._id === uId || c.user === uId;
                  const canDelete = isCommentOwner || isAuthor;

                  const toggleReplies = (cId) => setExpandedReplies(prev => ({ ...prev, [cId]: !prev[cId] }));

                  return (
                    <motion.div layout key={c._id || i} className="feed-comment-thread">
                      <div className="feed-comment-row">
                        <div className="feed-comment-avatar">
                          <img src={c.user?.profileImage?.url ? getFullUrl(c.user.profileImage.url) : 'https://via.placeholder.com/40'} alt="" />
                        </div>
                        <div className="feed-comment-bubble">
                          <div className="feed-comment-head">
                            <span>@{c.user?.name?.toUpperCase() || 'ANON USER'}</span>
                            {canDelete && <button className="feed-comment-delete" onClick={() => handleDeleteComment(c._id)}><FiTrash2 style={{ width: '14px', height: '14px' }} /></button>}
                          </div>
                          <div className="feed-comment-text">{c.text}</div>

                          {/* Reply Actions */}
                          <div style={{ display: 'flex', gap: 'clamp(10px, 2vw, 15px)', marginTop: '10px', flexWrap: 'wrap' }}>
                            <button onClick={() => setReplyingTo(replyingTo === c._id ? null : c._id)} style={{ background: 'none', border: 'none', color: '#888', fontWeight: '700', fontSize: 'clamp(0.65rem, 1.1vw, 0.75rem)', cursor: 'pointer', padding: 0 }}>
                              ตอบกลับ
                            </button>
                            {c.replies?.length > 0 && (
                              <button onClick={() => toggleReplies(c._id)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: '700', fontSize: 'clamp(0.65rem, 1.1vw, 0.75rem)', cursor: 'pointer', padding: 0 }}>
                                {expandedReplies[c._id] ? 'ซ่อน' : `ดู ${c.replies.length} คำตอบ`}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reply Input Box */}
                      <AnimatePresence>
                        {replyingTo === c._id && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginLeft: 'clamp(32px, 8vw, 40px)', marginTop: '5px', paddingLeft: 'clamp(8px, 1.5vw, 15px)' }}>
                            <form onSubmit={(e) => handleReply(e, c._id)} style={{ display: 'flex', gap: 'clamp(8px, 1.5vw, 10px)', minWidth: 0 }}>
                              <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Reply to this comment..." style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '20px', padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 15px)', fontSize: 'clamp(0.75rem, 1.3vw, 0.85rem)', minWidth: 0, boxSizing: 'border-box' }} />
                              <button type="submit" disabled={!replyText.trim()} style={{ background: replyText.trim() ? 'var(--accent)' : '#222', color: '#000', border: 'none', borderRadius: '20px', padding: '0 clamp(10px, 2vw, 15px)', fontWeight: '700', cursor: 'pointer', flexShrink: 0, fontSize: 'clamp(0.7rem, 1.2vw, 0.8rem)' }}>Send</button>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Render Replies */}
                      <AnimatePresence>
                        {expandedReplies[c._id] && c.replies?.length > 0 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ marginLeft: 'clamp(32px, 8vw, 40px)', display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.5vw, 15px)', marginTop: '5px', paddingLeft: 'clamp(8px, 1.5vw, 15px)' }}>
                            {c.replies.map((reply, rIdx) => (
                              <div key={reply._id || rIdx} style={{ display: 'flex', gap: 'clamp(8px, 1.5vw, 12px)', minWidth: 0 }}>
                                <div style={{ width: 'clamp(28px, 7vw, 30px)', height: 'clamp(28px, 7vw, 30px)', borderRadius: '50%', background: '#000', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', flexShrink: 0 }}>
                                  <img src={reply.user?.profileImage?.url ? getFullUrl(reply.user.profileImage.url) : 'https://via.placeholder.com/30'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'clamp(10px, 1.5vw, 12px) clamp(12px, 2vw, 18px)', borderRadius: 'clamp(16px, 2.5vw, 20px)', borderTopLeftRadius: '0', flex: 1, minWidth: 0, boxSizing: 'border-box' }}>
                                  <span style={{ fontWeight: '700', fontSize: 'clamp(0.6rem, 1vw, 0.75rem)', color: 'var(--accent)' }}>@{reply.user?.name?.toUpperCase() || 'ANON USER'}</span>
                                  <div style={{ fontSize: 'clamp(0.75rem, 1.3vw, 0.9rem)', color: '#777', marginTop: '4px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{reply.text}</div>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>

              {/* Add Response Form */}
              {currentToken && (
                <form onSubmit={handleComment} className="feed-comment-composer">
                  <div className="feed-comment-composer-avatar">
                    <img src={userInfo?.profileImage?.url ? (getFullUrl(userInfo.profileImage.url) + `?t=${profileUpdateTag}`) : 'https://via.placeholder.com/45'} alt="" />
                  </div>
                  <div className="feed-comment-input-shell">
                    <input
                      value={commentText} onChange={(e) => setCommentText(e.target.value)}
                      placeholder="ตอบกลับคอมเม้นท์..."
                    />
                    <motion.button whileTap={{ scale: 0.9 }} type="submit" disabled={!commentText.trim()}>
                      <FiSend style={{ width: '22px', height: '22px' }} />
                    </motion.button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🖼️ Fullscreen Image Modal */}
      {selectedImage && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
              background: 'rgba(0,0,0,0.95)', zIndex: 99999, display: 'flex',
              alignItems: 'center', justifyContent: 'center', padding: '20px',
              cursor: 'zoom-out', backdropFilter: 'blur(10px)'
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              style={{ position: 'relative', maxWidth: '95%', maxHeight: '95%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedImage} 
                alt="Full preview" 
                style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '15px', display: 'block', border: '1px solid rgba(255,255,255,0.1)' }} 
              />
              <button 
                onClick={() => setSelectedImage(null)}
                style={{
                  position: 'absolute', top: '-40px', right: '0',
                  background: 'none', border: 'none', color: '#fff',
                  fontSize: '2rem', cursor: 'pointer', display: 'flex', alignItems: 'center'
                }}
              >
                <FiX />
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
});

export default FeedPost;
