import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { postsAPI } from '../utils/api';
import { FiHeart, FiMessageSquare, FiMoreHorizontal, FiSend, FiClock, FiBriefcase, FiUserCheck, FiTrash2, FiActivity, FiShare2, FiZap } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { getFullUrl } from '../utils/mediaUtils';
import { motion, AnimatePresence } from 'framer-motion';

function FeedPost({ post, onPostDeleted }) {
  const { user, token: contextToken } = useContext(AuthContext);
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
        position: 'relative', overflow: 'hidden', padding: '40px', borderRadius: '50px',
        marginBottom: '15px', border: '1px solid rgba(255,255,255,0.03)', background: 'rgba(255,255,255,0.01)'
      }}
    >
      {/* 🚀 Signal Category Beam */}
      <div style={{ position: 'absolute', left: 0, top: '15%', bottom: '15%', width: '4px', background: accentColor, boxShadow: `0 0 20px ${accentColor}`, borderRadius: '0 4px 4px 0' }} />

      {/* Operative Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to={`/profile/${post.author?._id}`} style={{ textDecoration: 'none' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#000', border: `2px solid rgba(255,255,255,0.05)`, overflow: 'hidden' }}>
              <img src={post.author?.profileImage?.url ? getFullUrl(post.author.profileImage.url) : 'https://via.placeholder.com/60'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            </div>
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link to={`/profile/${post.author?._id}`} style={{ textDecoration: 'none', color: '#fff', fontWeight: '700', fontSize: '1.2rem', letterSpacing: '-0.3px' }}>
                {post.author?.name || 'Unknown Operative'}
              </Link>
              {/* <div style={{ background: `${accentColor}11`, color: accentColor, padding: '4px 14px', borderRadius: '40px', fontSize: '0.65rem', fontWeight: '700', letterSpacing: '2px', border: `1px solid ${accentColor}22` }}>
                {isHiring ? 'HIRING SIGNAL' : 'WORK SIGNAL'}
              </div> */}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#222', fontSize: '0.75rem', fontWeight: '700', marginTop: '6px' }}>
              <FiClock size={12} /> {new Date(post.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {isAuthor && (
          <motion.button whileHover={{ scale: 1.1, color: '#ef4444' }} onClick={handleDeletePost} style={{ background: 'rgba(255,255,255,0.02)', border: 'none', color: '#111', cursor: 'pointer', padding: '12px', borderRadius: '15px' }}>
            <FiTrash2 size={18} />
          </motion.button>
        )}
      </div>

      {/* Intelligence Payload */}
      <div style={{ fontSize: '1.25rem', lineHeight: 1.7, color: '#aaa', marginBottom: '30px', fontWeight: '500', whiteSpace: 'pre-line', padding: '0 5px' }}>
        {post.content}
      </div>

      {/* Media Stream */}
      {post.media && post.media.length > 0 && (
        <motion.div
          whileHover={{ scale: 1.01 }}
          style={{ marginBottom: '35px', borderRadius: '40px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', background: '#000', maxHeight: '700px' }}
        >
          <img src={getFullUrl(post.media[0].url)} style={{ width: '100%', height: 'auto', display: 'block' }} alt="Pipeline media" />
        </motion.div>
      )}

      {/* Tactical Interaction Nodes */}
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleLike}
          className="glass"
          style={{
            height: '60px', borderRadius: '30px', border: `1px solid ${isLiked ? 'var(--accent)' : 'rgba(255,255,255,0.03)'}`,
            display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '0 30px',
            color: isLiked ? 'var(--accent)' : '#444', fontWeight: '700', fontSize: '0.95rem', transition: '0.3s'
          }}
        >
          <FiHeart fill={isLiked ? 'var(--accent)' : 'none'} size={20} />
          <span style={{ color: isLiked ? '#fff' : 'inherit' }}>{likesCount} <span style={{ fontSize: '0.7rem', opacity: 0.5, marginLeft: '5px' }}>Like</span></span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowComments(!showComments)}
          className="glass"
          style={{
            height: '60px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.03)',
            display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '0 30px',
            color: showComments ? 'var(--accent)' : '#444', fontWeight: '700', fontSize: '0.95rem', transition: '0.3s'
          }}
        >
          <FiMessageSquare size={20} />
          <span style={{ color: showComments ? '#fff' : 'inherit' }}>{comments.length} <span style={{ fontSize: '0.7rem', opacity: 0.5, marginLeft: '5px' }}>Comment</span></span>
        </motion.button>

        <div style={{ flex: 1 }} />

        <motion.button
          whileTap={{ scale: 0.95 }}
          className="glass"
          style={{
            width: '60px', height: '60px', borderRadius: '30px', display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.03)',
            justifyContent: 'center', cursor: 'pointer', color: '#111'
          }}
        >
          <FiShare2 size={20} />
        </motion.button>
      </div>

      {/* 🧬 Responses Feed Sub-System */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: '35px', overflow: 'hidden' }}
          >
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '35px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
                {comments.map((c, i) => {
                  const uId = userInfo?._id || userInfo?.id;
                  const isCommentOwner = c.user?._id === uId || c.user === uId;
                  const canDelete = isCommentOwner || isAuthor;

                  const toggleReplies = (cId) => setExpandedReplies(prev => ({ ...prev, [cId]: !prev[cId] }));

                  return (
                    <motion.div layout key={c._id || i} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#000', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', flexShrink: 0 }}>
                          <img src={c.user?.profileImage?.url ? getFullUrl(c.user.profileImage.url) : 'https://via.placeholder.com/40'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        </div>
                        <div className="glass" style={{ padding: '20px 25px', borderRadius: '30px', borderTopLeftRadius: '0', flex: 1, border: '1px solid rgba(255,255,255,0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontWeight: '700', fontSize: '0.8rem', color: 'var(--accent)', letterSpacing: '1px' }}>@{c.user?.name?.toUpperCase() || 'ANON USER'}</span>
                            {canDelete && <button onClick={() => handleDeleteComment(c._id)} style={{ background: 'none', border: 'none', color: '#111', cursor: 'pointer' }}><FiTrash2 size={14} /></button>}
                          </div>
                          <div style={{ fontSize: '1rem', color: '#666', fontWeight: '500', lineHeight: 1.5 }}>{c.text}</div>

                          {/* Reply Actions */}
                          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                            <button onClick={() => setReplyingTo(replyingTo === c._id ? null : c._id)} style={{ background: 'none', border: 'none', color: '#888', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}>
                              ตอบกลับ
                            </button>
                            {c.replies?.length > 0 && (
                              <button onClick={() => toggleReplies(c._id)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}>
                                {expandedReplies[c._id] ? 'ซ่อน' : `ดู ${c.replies.length} คำตอบ`}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reply Input Box */}
                      <AnimatePresence>
                        {replyingTo === c._id && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginLeft: '58px', marginTop: '5px' }}>
                            <form onSubmit={(e) => handleReply(e, c._id)} style={{ display: 'flex', gap: '10px' }}>
                              <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Reply to this comment..." style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '20px', padding: '10px 15px', fontSize: '0.85rem' }} />
                              <button type="submit" disabled={!replyText.trim()} style={{ background: replyText.trim() ? 'var(--accent)' : '#222', color: '#000', border: 'none', borderRadius: '20px', padding: '0 15px', fontWeight: '700', cursor: 'pointer' }}>Send</button>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Render Replies */}
                      <AnimatePresence>
                        {expandedReplies[c._id] && c.replies?.length > 0 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ marginLeft: '58px', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '5px' }}>
                            {c.replies.map((reply, rIdx) => (
                              <div key={reply._id || rIdx} style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#000', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', flexShrink: 0 }}>
                                  <img src={reply.user?.profileImage?.url ? getFullUrl(reply.user.profileImage.url) : 'https://via.placeholder.com/30'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 18px', borderRadius: '20px', borderTopLeftRadius: '0', flex: 1 }}>
                                  <span style={{ fontWeight: '700', fontSize: '0.75rem', color: 'var(--accent)' }}>@{reply.user?.name?.toUpperCase() || 'ANON USER'}</span>
                                  <div style={{ fontSize: '0.9rem', color: '#777', marginTop: '4px' }}>{reply.text}</div>
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
                <form onSubmit={handleComment} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#000', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={userInfo?.profileImage?.url ? getFullUrl(userInfo.profileImage.url) : 'https://via.placeholder.com/45'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  </div>
                  <div className="glass" style={{ flex: 1, borderRadius: '40px', display: 'flex', alignItems: 'center', padding: '5px 25px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <input
                      value={commentText} onChange={(e) => setCommentText(e.target.value)}
                      placeholder="ตอบกลับคอมเม้นท์..."
                      style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', outline: 'none', padding: '18px 0', fontSize: '0.95rem', fontWeight: '700' }}
                    />
                    <motion.button whileTap={{ scale: 0.9 }} type="submit" disabled={!commentText.trim()} style={{ background: 'none', border: 'none', color: commentText.trim() ? 'var(--accent)' : '#0a0a0a', cursor: 'pointer', transition: '0.3s' }}>
                      <FiSend size={22} />
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
