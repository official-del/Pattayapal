import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postsAPI } from '../utils/api';
import { getFullUrl } from '../utils/mediaUtils';

export default function EmbeddedPost({ postId }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    postsAPI.getById(postId).then(res => {
      if (isMounted) {
        setPost(res);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, [postId]);

  if (loading) {
    return (
      <div style={{ 
        padding: '20px', 
        background: 'rgba(255,255,255,0.02)', 
        borderRadius: '16px', 
        marginTop: '12px',
        marginBottom: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }}></div>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>กำลังโหลดโพสต์...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!post) {
    return (
      <Link to={`/posts/${postId}`} style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
        /posts/{postId}
      </Link>
    );
  }

  // Render a mini card
  const hasMedia = post.media && post.media.length > 0;
  const firstMedia = hasMedia ? post.media[0] : null;
  const isVideo = firstMedia && firstMedia.mimetype && firstMedia.mimetype.startsWith('video/');

  return (
    <Link to={`/posts/${post._id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginTop: '12px', marginBottom: '12px' }}>
      <div 
        style={{
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'rgba(0,0,0,0.2)',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)';
          e.currentTarget.style.background = 'rgba(168, 85, 247, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.background = 'rgba(0,0,0,0.2)';
        }}
      >
        {firstMedia && (
          <div style={{ width: '100%', height: '240px', backgroundColor: '#0a0a0c', position: 'relative' }}>
            {isVideo ? (
               <video src={getFullUrl(firstMedia.url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
            ) : (
               <img src={getFullUrl(firstMedia.url)} alt="post media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            
            {hasMedia && post.media.length > 1 && (
              <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', color: '#fff', backdropFilter: 'blur(8px)', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.1)' }}>
                 +{post.media.length - 1} รูปภาพ/วิดีโอ
              </div>
            )}
            
            {isVideo && (
               <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', color: '#fff', backdropFilter: 'blur(8px)', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.1)' }}>
                 VIDEO
               </div>
            )}
          </div>
        )}
        
        {/* Post shared package preview if it has one instead of media */}
        {!hasMedia && post.sharedPackage && (
           <div style={{ width: '100%', height: '160px', backgroundColor: '#0a0a0c', position: 'relative', overflow: 'hidden' }}>
             {post.sharedPackage.coverImages && post.sharedPackage.coverImages.length > 0 ? (
                <img src={getFullUrl(post.sharedPackage.coverImages[0].url)} alt="package cover" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: '0.8' }} />
             ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(45deg, #2a0845 0%, #6441A5 100%)' }}>
                   <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '40px' }}>📦</span>
                </div>
             )}
             <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', padding: '20px 16px 12px', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>{post.sharedPackage.title}</h4>
             </div>
           </div>
        )}

        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            {post.author?.profilePicture ? (
              <img src={getFullUrl(post.author.profilePicture)} alt="author" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
            ) : (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#333' }}></div>
            )}
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>{post.author?.name || 'Unknown'}</span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>• โพสต์ต้นฉบับ</span>
          </div>
          
          {post.content && (
            <p style={{ 
              fontSize: '15px', 
              color: 'rgba(255,255,255,0.7)', 
              margin: 0, 
              display: '-webkit-box', 
              WebkitLineClamp: 3, 
              WebkitBoxOrient: 'vertical', 
              overflow: 'hidden',
              lineHeight: '1.5'
            }}>
              {post.content}
            </p>
          )}
          {!post.content && !hasMedia && !post.sharedPackage && (
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', margin: 0 }}>ไม่มีเนื้อหา</p>
          )}
        </div>
      </div>
    </Link>
  );
}
