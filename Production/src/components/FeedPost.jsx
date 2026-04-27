import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { postsAPI } from '../utils/api';
import { FiHeart, FiMessageSquare, FiMoreHorizontal, FiSend, FiClock, FiBriefcase, FiUserCheck, FiTrash2, FiActivity, FiShare2, FiZap } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { getFullUrl, isVideoUrl } from '../utils/mediaUtils';
import { motion, AnimatePresence } from 'framer-motion';
import HoverVideoPlayer from './HoverVideoPlayer';

function FeedPost({ post, onPostDeleted }) {
  const { user, token: contextToken, profileUpdateTag } = useContext(AuthContext);
  const currentToken = contextToken || localStorage.getItem('userToken') || localStorage.getItem('token');
  const userInfo = user || JSON.parse(localStorage.getItem('userInfo') || '{}');

  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [isLiked, setIsLiked] = useState(userInfo?._id || userInfo?.id ? post.likes?.includes(userInfo._id || userInfo.id) : false);
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});

  const isAuthor = userInfo && (post.author?._id === (userInfo._id || userInfo.id));
  const displayAuthor = isAuthor ? userInfo : post.author;
  const isHiring = post.postType === 'hiring';
  const accentColor = isHiring ? '#3b82f6' : '#22c55e';

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
    if (!window.confirm('คุณต้องการลบคอมเมนต์นี้ใช่หรือไม่?')) return;
    try {
      const updatedComments = await postsAPI.deleteComment(post._id, commentId, currentToken);
      setComments(updatedComments);
    } catch (err) { alert('ลบไม่สำเร็จ'); }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('คุณต้องการลบโพสต์นี้ใช่หรือไม่?')) return;
    try {
      await postsAPI.delete(post._id, currentToken);
      if (onPostDeleted) onPostDeleted(post._id);
    } catch (err) { alert('ลบไม่สำเร็จ'); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass"
      style={{
        position: 'relative', overflow: 'hidden', padding: 'clamp(16px, 4vw, 40px)', borderRadius: 'clamp(24px, 5vw, 50px)',
        marginBottom: 'clamp(10px, 2vw, 15px)', border: '1px solid rgba(255,255,255,0.03)', background: 'rgba(255,255,255,0.01)', boxSizing: 'border-box'
      }}
    >
      {/* 🚀 Signal Category Beam */}
      <div style={{ position: 'absolute', left: 0, top: '15%', bottom: '15%', width: '4px', background: accentColor, boxShadow: `0 0 20px ${accentColor}`, borderRadius: '0 4px 4px 0' }} />

      {/* Operative Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(20px, 4vw, 30px)', gap: 'clamp(12px, 2vw, 20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vw, 20px)', minWidth: 0 }}>
          <Link to={`/profile/${post.author?._id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 'clamp(45px, 10vw, 60px)', height: 'clamp(45px, 10vw, 60px)', borderRadius: '50%', background: '#000', border: `2px solid rgba(255,255,255,0.05)`, overflow: 'hidden' }}>
              <img src={displayAuthor?.profileImage?.url ? (getFullUrl(displayAuthor.profileImage.url) + (isAuthor ? `?t=${profileUpdateTag}` : '')) : 'https://via.placeholder.com/60'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            </div>
          </Link>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 12px)', flexWrap: 'wrap' }}>
              <Link to={`/profile/${post.author?._id}`} style={{ textDecoration: 'none', color: '#fff', fontWeight: '700', fontSize: 'clamp(0.9rem, 2vw, 1.2rem)', letterSpacing: '-0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {post.author?.name || 'Unknown Operative'}
              </Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#222', fontSize: 'clamp(0.65rem, 1.2vw, 0.75rem)', fontWeight: '700', marginTop: '6px' }}>
              <FiClock size={12} /> {new Date(post.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {isAuthor && (
          <motion.button whileHover={{ scale: 1.1, color: '#ef4444' }} onClick={handleDeletePost} style={{ background: 'rgba(255,255,255,0.02)', border: 'none', color: '#111', cursor: 'pointer', padding: 'clamp(8px, 1.5vw, 12px)', borderRadius: '15px', flexShrink: 0 }}>
            <FiTrash2 style={{ width: '18px', height: '18px' }} />
          </motion.button>
        )}
      </div>

      {/* Intelligence Payload */}
      <div style={{ fontSize: 'clamp(0.9rem, 2vw, 1.25rem)', lineHeight: 1.7, color: '#aaa', marginBottom: 'clamp(20px, 4vw, 30px)', fontWeight: '500', whiteSpace: 'pre-line', padding: '0 clamp(0px, 1vw, 5px)', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
        {post.content}
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
            <img src={getFullUrl(post.media[0].url)} style={{ width: '100%', height: 'auto', display: 'block', maxWidth: '100%' }} alt="Pipeline media" />
          )}
        </motion.div>
      )}

      {/* Tactical Interaction Nodes */}
      <div style={{ display: 'flex', gap: 'clamp(10px, 2vw, 15px)', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleLike}
          className="glass"
          style={{
            height: 'clamp(45px, 10vw, 60px)', borderRadius: '30px', border: `1px solid ${isLiked ? 'var(--accent)' : 'rgba(255,255,255,0.03)'}`,
            display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 12px)', cursor: 'pointer', padding: '0 clamp(15px, 3vw, 30px)',
            color: isLiked ? 'var(--accent)' : '#444', fontWeight: '700', fontSize: 'clamp(0.75rem, 1.3vw, 0.95rem)', transition: '0.3s', whiteSpace: 'nowrap'
          }}
        >
          <FiHeart fill={isLiked ? 'var(--accent)' : 'none'} style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          <span style={{ color: isLiked ? '#fff' : 'inherit' }}>{likesCount} <span style={{ fontSize: 'clamp(0.6rem, 1vw, 0.7rem)', opacity: 0.5, marginLeft: '5px' }}>Like</span></span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowComments(!showComments)}
          className="glass"
          style={{
            height: 'clamp(45px, 10vw, 60px)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.03)',
            display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 12px)', cursor: 'pointer', padding: '0 clamp(15px, 3vw, 30px)',
            color: showComments ? 'var(--accent)' : '#444', fontWeight: '700', fontSize: 'clamp(0.75rem, 1.3vw, 0.95rem)', transition: '0.3s', whiteSpace: 'nowrap'
          }}
        >
          <FiMessageSquare style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          <span style={{ color: showComments ? '#fff' : 'inherit' }}>{comments.length} <span style={{ fontSize: 'clamp(0.6rem, 1vw, 0.7rem)', opacity: 0.5, marginLeft: '5px' }}>Comment</span></span>
        </motion.button>

        <div style={{ flex: 1, minWidth: '20px' }} />

        <motion.button
          whileTap={{ scale: 0.95 }}
          className="glass"
          style={{
            width: 'clamp(45px, 10vw, 60px)', height: 'clamp(45px, 10vw, 60px)', borderRadius: '30px', display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.03)',
            justifyContent: 'center', cursor: 'pointer', color: '#111', flexShrink: 0
          }}
        >
          <FiShare2 style={{ width: '20px', height: '20px' }} />
        </motion.button>
      </div>

      {/* 🧬 Responses Feed Sub-System */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: 'clamp(20px, 4vw, 35px)', overflow: 'hidden' }}
          >
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 'clamp(20px, 4vw, 35px)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2vw, 20px)', marginBottom: 'clamp(20px, 4vw, 30px)' }}>
                {comments.map((c, i) => {
                  const uId = userInfo?._id || userInfo?.id;
                  const isCommentOwner = c.user?._id === uId || c.user === uId;
                  const canDelete = isCommentOwner || isAuthor;

                  const toggleReplies = (cId) => setExpandedReplies(prev => ({ ...prev, [cId]: !prev[cId] }));

                  return (
                    <motion.div layout key={c._id || i} style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', gap: 'clamp(10px, 2vw, 18px)', alignItems: 'flex-start', minWidth: 0 }}>
                        <div style={{ width: 'clamp(32px, 8vw, 40px)', height: 'clamp(32px, 8vw, 40px)', borderRadius: '50%', background: '#000', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', flexShrink: 0 }}>
                          <img src={c.user?.profileImage?.url ? getFullUrl(c.user.profileImage.url) : 'https://via.placeholder.com/40'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        </div>
                        <div className="glass" style={{ padding: 'clamp(12px, 2vw, 20px) clamp(15px, 3vw, 25px)', borderRadius: 'clamp(18px, 3vw, 30px)', borderTopLeftRadius: '0', flex: 1, border: '1px solid rgba(255,255,255,0.02)', minWidth: 0, boxSizing: 'border-box' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: '700', fontSize: 'clamp(0.65rem, 1.2vw, 0.8rem)', color: 'var(--accent)', letterSpacing: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{c.user?.name?.toUpperCase() || 'ANON USER'}</span>
                            {canDelete && <button onClick={() => handleDeleteComment(c._id)} style={{ background: 'none', border: 'none', color: '#111', cursor: 'pointer', flexShrink: 0 }}><FiTrash2 style={{ width: '14px', height: '14px' }} /></button>}
                          </div>
                          <div style={{ fontSize: 'clamp(0.8rem, 1.5vw, 1rem)', color: '#666', fontWeight: '500', lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{c.text}</div>

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
                <form onSubmit={handleComment} style={{ display: 'flex', gap: 'clamp(10px, 2vw, 15px)', alignItems: 'center', minWidth: 0 }}>
                  <div style={{ width: 'clamp(36px, 8vw, 45px)', height: 'clamp(36px, 8vw, 45px)', borderRadius: '50%', background: '#000', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={userInfo?.profileImage?.url ? (getFullUrl(userInfo.profileImage.url) + `?t=${profileUpdateTag}`) : 'https://via.placeholder.com/45'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  </div>
                  <div className="glass" style={{ flex: 1, borderRadius: 'clamp(25px, 4vw, 40px)', display: 'flex', alignItems: 'center', padding: 'clamp(5px, 1.5vw, 8px) clamp(18px, 3vw, 25px)', border: '1px solid rgba(255,255,255,0.05)', minWidth: 0, boxSizing: 'border-box' }}>
                    <input
                      value={commentText} onChange={(e) => setCommentText(e.target.value)}
                      placeholder="ตอบกลับคอมเม้นท์..."
                      style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', outline: 'none', padding: 'clamp(12px, 2vw, 18px) 0', fontSize: 'clamp(0.8rem, 1.5vw, 0.95rem)', fontWeight: '700', minWidth: 0 }}
                    />
                    <motion.button whileTap={{ scale: 0.9 }} type="submit" disabled={!commentText.trim()} style={{ background: 'none', border: 'none', color: commentText.trim() ? 'var(--accent)' : '#0a0a0a', cursor: 'pointer', transition: '0.3s', flexShrink: 0, marginLeft: '8px' }}>
                      <FiSend style={{ width: '22px', height: '22px' }} />
                    </motion.button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
export default FeedPost;
