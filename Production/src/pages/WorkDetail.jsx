import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { worksAPI } from '../utils/api';
import { getMediaUrl, workIsVideo, getFullUrl } from '../utils/mediaUtils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { FiArrowLeft, FiHeart, FiMessageSquare, FiClock, FiSend, FiTrash2, FiExternalLink, FiMaximize2, FiActivity, FiZap, FiTarget, FiBox, FiAlertTriangle } from 'react-icons/fi';

import { CONFIG } from '../utils/config';

const API_BASE_URL = CONFIG.API_BASE_URL;

function WorkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [recommendedWorks, setRecommendedWorks] = useState([]);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);

  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState({});

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const token = localStorage.getItem('token') || localStorage.getItem('userToken');

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const resDetail = await worksAPI.getById(id);
        const data = resDetail.work || resDetail;
        setWork(data);
        setComments(data.comments || []);
        setLikesCount(data.likes?.length || 0);

        if (userInfo && data.likes) {
          setIsLiked(data.likes.some(likeId => likeId === (userInfo._id || userInfo.id)));
        }

        const resAll = await worksAPI.getAll();
        const all = resAll.works || resAll || [];
        setRecommendedWorks(all.filter(w => w._id !== id).slice(0, 4));
        setFetchError(false);
      } catch (err) {
        console.error("Fetch Error:", err);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
    window.scrollTo(0, 0);
  }, [id]);

  const handleLike = async () => {
    if (!token) return alert("Please log in to like this project");
    try {
      const res = await axios.post(`${API_BASE_URL}/api/works/${id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLikesCount(res.data.likesCount);
      setIsLiked(res.data.isLiked);
    } catch (err) { console.error(err); }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!userInfo) return alert("Please log in to join the discussion");
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/works/${id}/comment`, {
        user: userInfo?.name || "Anonymous",
        profileImage: userInfo?.profileImage?.url || "",
        userId: userInfo?._id || userInfo?.id || "",
        text: commentText
      });
      setComments(res.data);
      setCommentText("");
    } catch (err) { alert("Comment protocol failed."); }
    finally { setIsSubmitting(false); }
  };

  const handleReplySubmit = async (e, commentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    if (!userInfo) return alert("Please log in to reply 🙏");
    try {
      const res = await worksAPI.replyComment(id, commentId, {
        user: userInfo?.name || "Anonymous",
        profileImage: userInfo?.profileImage?.url || "",
        userId: userInfo?._id || userInfo?.id || "",
        text: replyText
      }, token);
      setComments(res);
      setReplyText("");
      setReplyingTo(null);
      setExpandedReplies(prev => ({ ...prev, [commentId]: true }));
    } catch (err) { alert("Reply failed."); }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/works/${id}/comment/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(res.data);
    } catch (err) { alert("Deletion signal failed."); }
  };

  if (loading) return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '20px' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '40px', height: '40px', border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }} />
      <span style={{ fontWeight: '700', color: '#222', letterSpacing: '4px', fontSize: '0.8rem' }}>LOADING PROJECT DETAILS...</span>
    </div>
  );

  if (fetchError || !work) return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '25px', textAlign: 'center' }}>
      <FiAlertTriangle size={50} color="var(--accent)" />
      <span style={{ fontWeight: '700', letterSpacing: '2px', fontSize: '1rem', color: '#fff' }}>PROJECT DATA UNREACHABLE</span>
      <p style={{ color: '#444', maxWidth: '400px' }}>The creative parameters for this project could not be synced. Please check your uplink.</p>
      <button onClick={() => window.location.reload()} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' }}>RETRY SYNC</button>
    </div>
  );

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ background: "#000", color: "#fff", minHeight: "100vh", paddingBottom: '150px' }}>
      <Helmet>
        <title>{work?.title} | {work?.category?.name || 'Project'} | Pattayapal Portfolio</title>
        <meta name="description" content={work?.description?.substring(0, 160) || `ชมรายละเอียดโปรเจกต์ ${work?.title} บน Pattayapal`} />
        
        {/* OpenGraph */}
        <meta property="og:title" content={`${work?.title} | Pattayapal Portfolio`} />
        <meta property="og:description" content={work?.description?.substring(0, 160)} />
        <meta property="og:image" content={getMediaUrl(work)} />
        <meta property="og:type" content="article" />
      </Helmet>

      {/* 🖼️ Full-Res Immersive Overlay */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedImg(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.98)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", cursor: 'zoom-out', backdropFilter: 'blur(20px)' }}
          >
            <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} src={getFullUrl(selectedImg)} style={{ maxHeight: "90vh", maxWidth: "95vw", borderRadius: "10px", boxShadow: '0 0 100px rgba(0,0,0,1)' }} />
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "150px 5% 0" }}>

        {/* 📑 Tactical Case Grid */}
        <div className="work-detail-grid" style={{ gap: '80px', alignItems: 'start' }}>

          {/* 📽️ Cinematic Media Node */}
          <motion.div variants={itemVariants}>
            <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", color: "#fff", cursor: "pointer", width: '50px', height: '50px', borderRadius: '15px', display: "flex", alignItems: "center", justifyContent: 'center', marginBottom: '40px' }}>
              <FiArrowLeft size={20} />
            </button>

            <div className="glass" style={{ borderRadius: '50px', overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,0.03)', boxShadow: '0 50px 100px rgba(0,0,0,0.8)' }}>
              {workIsVideo(work) ? (
                <video src={getMediaUrl(work)} controls autoPlay muted loop style={{ width: '100%', display: 'block' }} />
              ) : (
                <img src={getMediaUrl(work)} style={{ width: '100%', display: 'block', cursor: 'zoom-in' }} onClick={() => setSelectedImg(getMediaUrl(work))} />
              )}
            </div>

            {/* Content Payload */}
            <div style={{ marginTop: '70px', padding: '0 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <FiZap color="var(--accent)" size={18} />
                <span style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '1.3rem', letterSpacing: '5px' }}>Project Detail</span>
              </div>
              <h3 style={{ fontSize: 'clamp(3rem, 7vw, 6rem)', fontWeight: '700', margin: '0 0 35px', letterSpacing: '-3px', lineHeight: 0.9 }}>{work.title}</h3>
              <div style={{ width: '60px', height: '4px', background: 'var(--accent)', marginBottom: '50px', borderRadius: '2px', boxShadow: '0 0 15px var(--accent-glow)' }}></div>
            </div>

            {/* Sub-Data Gallery */}
            {work.album && work.album.length > 0 && (
              <div style={{ marginTop: '100px', paddingTop: '80px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
                  <FiBox color="#222" size={16} />
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#222', letterSpacing: '4px' }}>Project Assets</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                  {work.album.map((img, i) => (
                    <motion.div
                      whileHover={{ y: -10, scale: 1.02 }}
                      key={i} onClick={() => setSelectedImg(img.url)}
                      style={{ aspectRatio: '16/10', borderRadius: '35px', overflow: 'hidden', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.03)', cursor: 'zoom-in' }}
                    >
                      <img src={getFullUrl(img.url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* 📡 Right: Tactical Stats Node */}
          <motion.aside variants={itemVariants} style={{ position: 'sticky', top: '150px' }}>
            <div className="glass" style={{ padding: '50px', borderRadius: '60px', border: '1px solid rgba(255,255,255,0.03)' }}>
              {/* Operative Bio */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '50px' }}>
                <div style={{ width: '65px', height: '65px', borderRadius: '50%', background: '#000', border: '2px solid var(--accent)', overflow: 'hidden' }}>
                  <img src={work.createdBy?.profileImage?.url ? getFullUrl(work.createdBy.profileImage.url) : 'https://via.placeholder.com/65'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent)', letterSpacing: '2px' }}>Creator</span>
                  <Link to={`/profile/${work.createdBy?._id || work.createdBy?.id}`} style={{ display: 'block', color: '#fff', fontSize: '1.5rem', fontWeight: '700', textDecoration: 'none', letterSpacing: '-0.5px', marginTop: '4px' }}>{work.createdBy?.name || 'Unknown'}</Link>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#222', letterSpacing: '2px', display: 'block', marginBottom: '10px' }}>Category</span>
                  <div className="glass" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: '15px', color: 'var(--accent)', fontWeight: '700', fontSize: '0.85rem', border: '1px solid rgba(255,87,51,0.1)' }}>{work.category?.name?.toUpperCase() || 'GENERAL'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#222', letterSpacing: '2px', display: 'block', marginBottom: '10px' }}>Description</span>
                  <span style={{ color: '#fff', fontWeight: '700', fontSize: '1.2rem' }}>
                    <p style={{ fontSize: '1.25rem', lineHeight: 1.8, color: '#666', fontWeight: '500', maxWidth: '950px', whiteSpace: 'pre-wrap' }}>{work.description || "Project parameters not specified by the operative."}</p>
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                  <motion.button
                    onClick={handleLike}
                    whileHover={{ scale: 1.05, boxShadow: isLiked ? '0 0 30px var(--accent-glow)' : 'none' }}
                    className="glass"
                    style={{ flex: 1, padding: '20px', borderRadius: '30px', color: isLiked ? 'var(--accent)' : '#444', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', border: `1px solid ${isLiked ? 'var(--accent)' : 'rgba(255,255,255,0.03)'}`, cursor: 'pointer', transition: '0.3s' }}
                  >
                    <FiHeart fill={isLiked ? 'var(--accent)' : 'none'} size={20} /> {likesCount}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} className="glass" style={{ flex: 1, padding: '20px', borderRadius: '30px', color: '#444', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', border: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                    <FiExternalLink size={20} /> Share
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Intelligence Responses (Comments) */}
            <div style={{ marginTop: '60px', padding: '0 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
                <FiMessageSquare color="#222" size={16} />
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#222', letterSpacing: '4px' }}>Conversation</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                {comments.map((c, i) => {
                  const toggleReplies = (cId) => setExpandedReplies(prev => ({ ...prev, [cId]: !prev[cId] }));

                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '18px' }}>
                        <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#0a0a0a', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.05)' }}>
                          <img src={c.profileImage ? getFullUrl(c.profileImage) : 'https://via.placeholder.com/35'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div className="glass" style={{ padding: '20px 25px', borderRadius: '25px', borderTopLeftRadius: 0, flex: 1, position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontWeight: '700', color: 'var(--accent)', fontSize: '0.75rem', letterSpacing: '1px' }}>@{c.user?.toUpperCase()}</span>
                            {(userInfo?.name === c.user || userInfo?._id === c.userId || userInfo?.id === c.userId) && <button onClick={() => deleteComment(c._id)} style={{ background: 'none', border: 'none', color: '#111', cursor: 'pointer' }}><FiTrash2 size={14} /></button>}
                          </div>
                          <p style={{ margin: 0, color: '#888', lineHeight: 1.5, fontSize: '0.95rem', fontWeight: '500' }}>{c.text}</p>

                          {/* Reply Actions */}
                          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                            <button onClick={() => setReplyingTo(replyingTo === c._id ? null : c._id)} style={{ background: 'none', border: 'none', color: '#666', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}>
                              Reply
                            </button>
                            {c.replies?.length > 0 && (
                              <button onClick={() => toggleReplies(c._id)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}>
                                {expandedReplies[c._id] ? 'Hide' : `See ${c.replies.length} Reply`}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reply Input Box */}
                      <AnimatePresence>
                        {replyingTo === c._id && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginLeft: '53px', marginTop: '5px' }}>
                            <form onSubmit={(e) => handleReplySubmit(e, c._id)} style={{ display: 'flex', gap: '10px' }}>
                              <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Reply to this comment..." style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '20px', padding: '10px 15px', fontSize: '0.85rem' }} />
                              <button type="submit" disabled={!replyText.trim()} style={{ background: replyText.trim() ? 'var(--accent)' : '#222', color: '#000', border: 'none', borderRadius: '20px', padding: '0 15px', fontWeight: '700', cursor: 'pointer' }}>ส่ง</button>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Render Replies */}
                      <AnimatePresence>
                        {expandedReplies[c._id] && c.replies?.length > 0 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ marginLeft: '53px', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '5px' }}>
                            {c.replies.map((reply, rIdx) => (
                              <div key={reply._id || rIdx} style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#000', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', flexShrink: 0 }}>
                                  <img src={reply.profileImage ? getFullUrl(reply.profileImage) : 'https://via.placeholder.com/30'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 18px', borderRadius: '20px', borderTopLeftRadius: '0', flex: 1 }}>
                                  <span style={{ fontWeight: '700', fontSize: '0.75rem', color: 'var(--accent)' }}>@{reply.user?.toUpperCase() || 'ANON USER'}</span>
                                  <div style={{ fontSize: '0.9rem', color: '#777', marginTop: '4px' }}>{reply.text}</div>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}

                {token && (
                  <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                    <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment..." style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '30px', padding: '18px 25px', color: '#fff', outline: 'none', fontSize: '0.9rem', fontWeight: '500' }} />
                    <motion.button disabled={isSubmitting} whileTap={{ scale: 0.9 }} type="submit" style={{ background: 'var(--accent)', border: 'none', width: '55px', height: '55px', borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 10px 20px var(--accent-glow)' }}>
                      <FiSend />
                    </motion.button>
                  </form>
                )}
              </div>
            </div>
          </motion.aside>
        </div>

        {/* --- Related Signals (Recommendations) --- */}
        <div style={{ marginTop: '180px' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <FiTarget color="var(--accent)" size={30} style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#fff', letterSpacing: '-1px' }}>You Might Like</h3>
            <p style={{ color: '#222', fontWeight: '700', letterSpacing: '4px', fontSize: '1.2rem', marginTop: '10px' }}>More Like This</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '40px' }}>
            {recommendedWorks.map(rec => ( // <--- ตัวแปร rec จะถูกนิยามตรงนี้
              <motion.div whileHover={{ y: -10 }} key={rec._id}>
                <Link to={`/works/${rec._id}`} style={{ textDecoration: 'none' }}>
                  <div className="glass" style={{ padding: '20px', borderRadius: '45px', border: '1px solid rgba(255,255,255,0.03)' }}>

                    {/* ส่วนนี้คือตำแหน่งที่แสดงสื่อ (Media) */}
                    <div style={{ aspectRatio: '16/10', borderRadius: '30px', overflow: 'hidden', background: '#0a0a0a', marginBottom: '25px' }}>
                      {workIsVideo(rec) ? (
                        <video
                          src={getMediaUrl(rec)}
                          muted
                          loop
                          playsInline
                          autoPlay
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <img
                          src={getMediaUrl(rec)}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </div>

                    <div style={{ padding: '0 15px 15px' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--accent)', letterSpacing: '2px' }}>{rec.category?.name?.toUpperCase()}</span>
                      <h4 style={{ color: '#fff', margin: '8px 0 0', fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.5px' }}>{rec.title}</h4>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

        </div>

      </div>

      <style>{`
        .work-detail-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.8fr) 450px;
        }
        @media (max-width: 1024px) {
          .work-detail-grid {
            grid-template-columns: 1fr;
            gap: 40px !important;
          }
        }
      `}</style>
    </motion.div>
  );
}

export default WorkDetail;