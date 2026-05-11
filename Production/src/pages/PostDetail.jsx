import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postsAPI } from '../utils/api';
import FeedPost from '../components/FeedPost';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiLoader, FiAlertTriangle } from 'react-icons/fi';

function PostDetail() {
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
    return (
      <div style={{ background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '20px' }}>
        <FiLoader className="spin" size={40} color="var(--accent)" />
        <span style={{ fontWeight: '700', letterSpacing: '2px', opacity: 0.5 }}>FETCHING INTEL...</span>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: '20px', textAlign: 'center' }}>
        <FiAlertTriangle size={60} color="var(--accent)" style={{ marginBottom: '20px' }} />
        <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>DATA CORRUPTED OR NOT FOUND</h2>
        <p style={{ color: '#444', fontWeight: '700', margin: '20px 0' }}>The intelligence you are looking for has been moved or deleted.</p>
        <Link to="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '800', border: '1px solid var(--accent)', padding: '12px 30px', borderRadius: '30px' }}>BACK TO BASE</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingTop: 'clamp(20px, 4vh, 40px)', paddingBottom: '100px', color: '#fff' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', padding: '0 20px' }}>
        
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: '#666', textDecoration: 'none', fontWeight: '700', marginBottom: '30px', transition: '0.3s' }} className="back-link">
          <FiArrowLeft /> BACK TO FEED
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FeedPost post={post} onPostDeleted={() => window.location.href = '/'} />
        </motion.div>
      </div>

      <style>{`
        .back-link:hover { color: var(--accent) !important; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default PostDetail;
