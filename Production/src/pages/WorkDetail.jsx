import { customConfirm } from '../utils/customConfirm';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { worksAPI } from '../utils/api';
import { getFullUrl, getMediaUrl, getWorkPosterUrl, getWorkVideoUrl, workIsVideo } from '../utils/mediaUtils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  FiArrowLeft,
  FiHeart,
  FiMessageSquare,
  FiSend,
  FiTrash2,
  FiExternalLink,
  FiMaximize2,
  FiZap,
  FiTarget,
  FiBox,
  FiAlertTriangle,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiEye,
} from 'react-icons/fi';
import HoverVideoPlayer from '../components/HoverVideoPlayer';
import PremiumLoader from '../components/PremiumLoader';
import Footer from '../components/Footer';
import { CONFIG } from '../utils/config';
import '../css/WorkDetail.css';

const API_BASE_URL = CONFIG.API_BASE_URL;
const sessionViewedIds = new Set();

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
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});

  const userInfo = JSON.parse(window.safeStorage.getItem('userInfo'));
  const token = window.safeStorage.getItem('token') || window.safeStorage.getItem('userToken');

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        let resView = null;
        if (!sessionViewedIds.has(id)) {
          sessionViewedIds.add(id);
          resView = await axios.post(`${API_BASE_URL}/api/works/${id}/view`).catch(() => null);
        }

        const resDetail = await worksAPI.getById(id);
        const data = resDetail.work || resDetail;

        if (resView?.data) {
          data.views = resView.data.views;
        }

        setWork(data);
        setComments(data.comments || []);
        setLikesCount(data.likes?.length || 0);

        if (userInfo && data.likes) {
          setIsLiked(data.likes.some((likeId) => likeId === (userInfo._id || userInfo.id)));
        }

        const resAll = await worksAPI.getAll();
        const all = resAll.works || resAll || [];
        setRecommendedWorks(all.filter((item) => item._id !== id).slice(0, 4));
        setFetchError(false);
      } catch (err) {
        console.error('Fetch Error:', err);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
    window.scrollTo(0, 0);
  }, [id]);

  const handleLike = async () => {
    if (!token) return toast.error('Please log in to like this project');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/works/${id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLikesCount(res.data.likesCount);
      setIsLiked(res.data.isLiked);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!userInfo) return toast.error('Please log in to join the discussion');
    if (!token) return toast.error('Please log in again');
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/works/${id}/comment`, {
        text: commentText,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-auth-token': token,
        },
      });
      setComments(res.data);
      setCommentText('');
    } catch (err) {
      toast.error('Comment protocol failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (e, commentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    if (!userInfo) return toast.error('Please log in to reply');
    if (!token) return toast.error('Please log in again');
    try {
      const res = await worksAPI.replyComment(id, commentId, {
        text: replyText,
      });
      setComments(res);
      setReplyText('');
      setReplyingTo(null);
      setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
    } catch (err) {
      toast.error('Reply failed.');
    }
  };

  const deleteComment = async (commentId) => {
    if (!await customConfirm('Are you sure you want to delete this comment?')) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/works/${id}/comment/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(res.data);
    } catch (err) {
      toast.error('Deletion signal failed.');
    }
  };

  if (loading) {
    return (
      <PremiumLoader
        text="Loading Project..."
        subtext="Preparing creator work details..."
      />
    );
  }

  if (fetchError || !work) {
    return (
      <>
        <main className="work-detail-page">
          <section className="work-detail-error">
            <FiAlertTriangle size={42} />
            <h1>Project data unreachable</h1>
            <p>This work detail could not be loaded. Try refreshing the interface.</p>
            <button type="button" onClick={() => window.location.reload()}>Retry sync</button>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const albumMedia = [
    work.mainImage?.url || work.videoUrl || work.mediaUrl,
    ...(work.album?.map((item) => item.url) || []),
  ].filter(Boolean);

  const handlePrevMedia = (e) => {
    e.stopPropagation();
    const currentIndex = albumMedia.indexOf(selectedMedia);
    if (currentIndex === -1) return;
    setSelectedMedia(albumMedia[(currentIndex - 1 + albumMedia.length) % albumMedia.length]);
  };

  const handleNextMedia = (e) => {
    e.stopPropagation();
    const currentIndex = albumMedia.indexOf(selectedMedia);
    if (currentIndex === -1) return;
    setSelectedMedia(albumMedia[(currentIndex + 1) % albumMedia.length]);
  };

  const handleShare = async () => {
    const shareData = {
      title: `${work.title} | PattayaPal`,
      text: work.description?.substring(0, 100) || 'Check out this project on PattayaPal.',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard.');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const mainIsVideo = workIsVideo(work);
  const creatorId = work.createdBy?._id || work.createdBy?.id;
  const creatorImage = work.createdBy?.profileImage?.url
    ? getFullUrl(work.createdBy.profileImage.url)
    : 'https://via.placeholder.com/96';

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { y: 18, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.26, ease: [0.23, 1, 0.32, 1] } },
  };

  return (
    <>
      <motion.main
        className="work-detail-page"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <Helmet>
          <title>{work?.title} | {work?.category?.name || 'Project'} | PattayaPal Portfolio</title>
          <meta name="description" content={work?.description?.substring(0, 160) || `View ${work?.title} on PattayaPal`} />
          <meta property="og:title" content={`${work?.title} | PattayaPal Portfolio`} />
          <meta property="og:description" content={work?.description?.substring(0, 160)} />
          <meta property="og:image" content={getMediaUrl(work) || 'https://pattayapal.com/og-image.jpg'} />
          <meta property="og:type" content="article" />
        </Helmet>

      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            className="work-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMedia(null)}
          >
            <button className="lightbox-close" type="button" onClick={() => setSelectedMedia(null)} aria-label="Close media">
              <FiX />
            </button>

            {albumMedia.length > 1 && (
              <button className="lightbox-nav is-prev" type="button" onClick={handlePrevMedia} aria-label="Previous media">
                <FiChevronLeft />
              </button>
            )}

            <div className="lightbox-stage" onClick={(e) => e.stopPropagation()}>
              {selectedMedia.match(/\.(mp4|webm|mov)$/i) ? (
                <motion.video
                  key={selectedMedia}
                  src={getFullUrl(selectedMedia)}
                  controls
                  autoPlay
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                />
              ) : (
                <motion.img
                  key={selectedMedia}
                  src={getFullUrl(selectedMedia)}
                  alt=""
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                />
              )}
              <span className="lightbox-count">{albumMedia.indexOf(selectedMedia) + 1} / {albumMedia.length}</span>
            </div>

            {albumMedia.length > 1 && (
              <button className="lightbox-nav is-next" type="button" onClick={handleNextMedia} aria-label="Next media">
                <FiChevronRight />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="work-detail-shell">
        <motion.button
          variants={itemVariants}
          type="button"
          className="work-back-btn"
          onClick={() => navigate(-1)}
        >
          <FiArrowLeft />
          <span>Back</span>
        </motion.button>

        <div className="work-detail-grid">
          <motion.section className="work-main-column" variants={itemVariants}>
            <div className="work-media-panel">
              <div className="work-media-topbar">
                <span>{mainIsVideo ? 'Video Work' : 'Project Cover'}</span>
                <button
                  type="button"
                  onClick={() => setSelectedMedia(work.mainImage?.url || work.videoUrl || work.mediaUrl)}
                  aria-label="Open media preview"
                >
                  <FiMaximize2 />
                </button>
              </div>

              <div className="work-media-frame">
                {mainIsVideo ? (
                  <video
                    src={getWorkVideoUrl(work)}
                    poster={getWorkPosterUrl(work)}
                    controls
                    muted
                    loop
                  />
                ) : (
                  <img
                    src={getMediaUrl(work)}
                    alt={work.title || 'Project media'}
                    onClick={() => setSelectedMedia(work.mainImage?.url || work.videoUrl || work.mediaUrl)}
                  />
                )}
              </div>
            </div>

            {work.album && work.album.length > 0 && (
              <section className="work-assets-section">
                <div className="work-section-heading">
                  <div>
                    <span><FiBox /> Project Assets</span>
                    <h2>More from this work</h2>
                  </div>
                  <strong>{work.album.length} items</strong>
                </div>
                <div className="work-assets-grid">
                  {work.album.map((item, index) => {
                    const isVid = item.url && item.url.match(/\.(mp4|webm|mov)$/i);
                    return (
                      <button
                        key={item._id || item.url || index}
                        type="button"
                        className="asset-card"
                        onClick={() => setSelectedMedia(item.url)}
                      >
                        {isVid ? (
                          <video src={getFullUrl(item.url)} />
                        ) : (
                          <img src={getFullUrl(item.url)} loading="lazy" alt="" />
                        )}
                        <span><FiMaximize2 /> Preview</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </motion.section>

          <motion.aside className="work-side-column" variants={itemVariants}>
            <section className="work-info-panel">
              <div className="creator-card">
                <img src={creatorImage} alt={work.createdBy?.name || 'Creator'} />
                <div>
                  <span>Creator</span>
                  {creatorId ? (
                    <Link to={`/profile/${creatorId}`}>{work.createdBy?.name || 'Unknown'}</Link>
                  ) : (
                    <strong>{work.createdBy?.name || 'Unknown'}</strong>
                  )}
                </div>
              </div>

              <div className="work-meta-grid">
                <div>
                  <span>Category</span>
                  <strong>{work.category?.name || 'General'}</strong>
                </div>
                <div>
                  <span>Views</span>
                  <strong>{Number(work.views || 0).toLocaleString()}</strong>
                </div>
              </div>

              <div className="work-action-row">
                <button
                  type="button"
                  onClick={handleLike}
                  className={isLiked ? 'is-liked' : ''}
                >
                  <FiHeart fill={isLiked ? 'currentColor' : 'none'} />
                  {likesCount}
                </button>
                <button type="button" onClick={handleShare}>
                  <FiExternalLink />
                  Share
                </button>
              </div>
            </section>

            <section className="work-content-block">
              <div className="work-kicker">
                <FiZap />
                <span>Project Detail</span>
              </div>
              <h1>{work.title}</h1>
              <p>{work.description || 'Project details have not been added yet.'}</p>
            </section>

            <section className="work-comments-panel">
              <div className="work-section-heading is-compact">
                <div>
                  <span><FiMessageSquare /> Conversation</span>
                  <h2>{comments.length} comments</h2>
                </div>
              </div>

              <div className="work-comments-list">
                {comments.length === 0 && (
                  <div className="comment-empty">No comments yet. Start the conversation.</div>
                )}

                {comments.map((comment, index) => (
                  <article className="comment-card" key={comment._id || index}>
                    <div className="comment-row">
                      <img
                        src={comment.profileImage ? getFullUrl(comment.profileImage) : 'https://via.placeholder.com/40'}
                        alt=""
                      />
                      <div className="comment-bubble">
                        <div className="comment-head">
                          <strong>@{comment.user || 'Anonymous'}</strong>
                          {(userInfo?.name === comment.user || userInfo?._id === comment.userId || userInfo?.id === comment.userId) && (
                            <button type="button" onClick={() => deleteComment(comment._id)} aria-label="Delete comment">
                              <FiTrash2 />
                            </button>
                          )}
                        </div>
                        <p>{comment.text}</p>
                        <div className="comment-actions">
                          <button type="button" onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}>
                            Reply
                          </button>
                          {comment.replies?.length > 0 && (
                            <button type="button" onClick={() => toggleReplies(comment._id)}>
                              {expandedReplies[comment._id] ? 'Hide replies' : `See ${comment.replies.length} replies`}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {replyingTo === comment._id && (
                        <motion.form
                          className="reply-form"
                          onSubmit={(e) => handleReplySubmit(e, comment._id)}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <input
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Reply to this comment..."
                          />
                          <button type="submit" disabled={!replyText.trim()}>Send</button>
                        </motion.form>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {expandedReplies[comment._id] && comment.replies?.length > 0 && (
                        <motion.div
                          className="reply-list"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {comment.replies.map((reply, replyIndex) => (
                            <div className="reply-card" key={reply._id || replyIndex}>
                              <img
                                src={reply.profileImage ? getFullUrl(reply.profileImage) : 'https://via.placeholder.com/32'}
                                alt=""
                              />
                              <div>
                                <strong>@{reply.user || 'Anonymous'}</strong>
                                <p>{reply.text}</p>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </article>
                ))}
              </div>

              {token && (
                <form className="comment-form" onSubmit={handleCommentSubmit}>
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                  />
                  <button type="submit" disabled={isSubmitting || !commentText.trim()}>
                    <FiSend />
                  </button>
                </form>
              )}
            </section>
          </motion.aside>
        </div>

        {recommendedWorks.length > 0 && (
          <motion.section className="related-section" variants={itemVariants}>
            <div className="work-section-heading">
              <div>
                <span><FiTarget /> Related Works</span>
                <h2>You might like</h2>
              </div>
              <Link to="/works">View all</Link>
            </div>

            <div className="related-grid">
              {recommendedWorks.map((rec) => (
                <Link to={`/works/${rec._id}`} className="related-card" key={rec._id}>
                  <div className="related-media">
                    {workIsVideo(rec) ? (
                      <HoverVideoPlayer
                        src={getWorkVideoUrl(rec)}
                        poster={getWorkPosterUrl(rec)}
                      />
                    ) : (
                      <img src={getMediaUrl(rec)} loading="lazy" alt={rec.title || 'Related work'} />
                    )}
                  </div>
                  <div className="related-body">
                    <span>{rec.category?.name || 'General'}</span>
                    <h3>{rec.title}</h3>
                    <p><FiEye /> {Number(rec.views || 0).toLocaleString()} views</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}
        </div>
      </motion.main>
      <Footer />
    </>
  );
}

export default WorkDetail;
