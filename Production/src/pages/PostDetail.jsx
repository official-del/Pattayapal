import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiArrowLeft, FiMessageSquare } from 'react-icons/fi';
import { Helmet } from 'react-helmet-async';
import FeedPost from '../components/FeedPost';
import Footer from '../components/Footer';
import PremiumLoader from '../components/PremiumLoader';
import { PATHS } from '../routes/paths';
import { postsAPI } from '../utils/api';
import { getFullUrl } from '../utils/mediaUtils';
import '../css/PostDetail.css';

function PostDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const data = await postsAPI.getById(id);
        setPost(data);
        setError(false);
      } catch (err) {
        console.error('Fetch post error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return <PremiumLoader text="SYNCING POST" subtext="Loading community update..." />;
  }

  if (error || !post) {
    return (
      <>
        <main className="post-detail-shell post-detail-empty">
          <motion.section
            className="post-detail-error-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          >
            <FiAlertTriangle className="post-detail-error-icon" />
            <p className="post-detail-kicker">Post unavailable</p>
            <h1>Community signal not found</h1>
            <p>The post may have been deleted, moved, or is no longer public.</p>
            <Link to="/" className="post-detail-back is-primary">
              <FiArrowLeft />
              <span>Back to feed</span>
            </Link>
          </motion.section>
        </main>
        <Footer />
      </>
    );
  }

  const postTitle = post ? `โพสต์จาก ${post.author?.name || 'PattayaPal'}` : 'Post Detail | PattayaPal';
  const postDesc = post?.content ? (post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content) : 'ดูโพสต์นี้บน PattayaPal';
  const postImage = post?.media?.[0]?.url ? getFullUrl(post.media[0].url) : '';
  const postUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <>
      {post && (
        <Helmet>
          <title>{postTitle}</title>
          <meta name="description" content={postDesc} />
          <meta property="og:title" content={postTitle} />
          <meta property="og:description" content={postDesc} />
          {postImage && <meta property="og:image" content={postImage} />}
          <meta property="og:url" content={postUrl} />
          <meta property="og:type" content="article" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={postTitle} />
          <meta name="twitter:description" content={postDesc} />
          {postImage && <meta name="twitter:image" content={postImage} />}
        </Helmet>
      )}
      <main className="post-detail-shell">
        <section className="post-detail-container" aria-label="Community post detail">
          <div className="post-detail-toolbar">
            <Link to="/" className="post-detail-back">
              <FiArrowLeft />
              <span>Back to feed</span>
            </Link>
            <div className="post-detail-context">
              <FiMessageSquare />
              <span>Community post</span>
            </div>
          </div>

          <motion.div
            className="post-detail-card-wrap"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          >
            <FeedPost post={post} onPostDeleted={() => navigate(PATHS.home)} />
          </motion.div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default PostDetail;
