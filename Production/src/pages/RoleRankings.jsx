import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiCamera, FiVideo, FiEdit, FiLayers, FiEye, FiAward, FiZap, FiActivity } from 'react-icons/fi';
import { usersAPI } from '../utils/api';
import { getFullUrl } from '../utils/mediaUtils';
import { AuthContext } from '../context/AuthContext';
import RankBadge from '../components/RankBadge';
import ProfileFrame from '../components/ProfileFrame';
import { CoinIcon, CoinBadge } from '../components/CoinIcon';

const RoleRankings = () => {
  const { user: currentUser, profileUpdateTag } = React.useContext(AuthContext);
  const [category, setCategory] = useState('views'); // 'views' | 'earnings'
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const data = await usersAPI.getLeaderboard(category);
        setLeaderboard(data || []);
      } catch (err) {
        console.error("Fetch leaderboard failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [category]);

  const roles = [
    { name: 'Photographer', icon: <FiCamera />, color: '#6366f1', label: 'ช่างภาพมือโปร / PROFESSIONAL PHOTOGRAPHER', display: 'ช่างภาพ' },
    { name: 'Videographer', icon: <FiVideo />, color: '#10b981', label: 'มือผลิตวิดีโอ / VIDEO PRODUCTION', display: 'ช่างวิดีโอ' },
    { name: 'Editor', icon: <FiEdit />, color: '#ec4899', label: 'ช่างตัดต่อระดับเทพ / MASTER EDITOR', display: 'ตัดต่อ' },
    { name: 'Director', icon: <FiLayers />, color: '#f59e0b', label: 'ผู้กำกับวิสัยทัศน์ / VISIONARY DIRECTOR', display: 'ผู้กำกับ' }

  ];

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', paddingBottom: '150px' }}>
      
      {/* 🚀 Tactical Header */}
      <section style={{ padding: '150px 5% 80px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
           <Link to="/rankings" style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#444', textDecoration: 'none', fontWeight: '700', fontSize: '0.9rem', marginBottom: '35px', letterSpacing: '2px', background: 'rgba(255,255,255,0.02)', padding: '12px 24px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)'
           }}>
             <FiArrowLeft /> กลับไปที่ศูนย์รวมอันดับ
           </Link>
           <h1 style={{ fontSize: 'clamp(2.5rem, 10vw, 5rem)', fontWeight: '700', margin: 0, letterSpacing: '-3px', lineHeight: 1 }}>
             อันดับ <span style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 15px var(--accent-glow))' }}>สายอาชีพ</span>
           </h1>

           <p style={{ color: '#444', marginTop: '20px', fontSize: 'clamp(0.9rem, 4vw, 1.2rem)', fontWeight: '700', padding: '0 10%' }}>
             เฟ้นหาผู้เล่นที่โดดเด่นที่สุดในแต่ละด้าน วัดผลจาก {category === 'views' ? 'ยอดการเข้าชม' : 'จำนวนเหรียญสะสม'}
           </p>

           {/* 🧬 Category Signal Toggle */}
           <div style={{ 
              marginTop: '40px', display: 'inline-flex', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap', justifyContent: 'center', gap: '5px'
           }}>
             <button
               onClick={() => setCategory('views')}
               style={{
                 display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 25px', borderRadius: '35px',
                 background: category === 'views' ? 'var(--accent)' : 'transparent', color: category === 'views' ? '#fff' : '#444', border: 'none',
                 cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', transition: '0.3s',
                 boxShadow: category === 'views' ? '0 10px 25px var(--accent-glow)' : 'none'
               }}
             >
               <FiEye /> ยอดเข้าชม
             </button>
             <button
               onClick={() => setCategory('earnings')}
               style={{
                 display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 25px', borderRadius: '35px',
                 background: category === 'earnings' ? 'var(--accent)' : 'transparent', color: category === 'earnings' ? '#fff' : '#444', border: 'none',
                 cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', transition: '0.3s',
                 boxShadow: category === 'earnings' ? '0 10px 25px var(--accent-glow)' : 'none'
               }}
             >
               <CoinIcon size={16} /> รายได้สูงสุด
             </button>
           </div>
        </motion.div>
      </section>

      {/* 🔮 Dynamic Legends Grid */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 5%' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px' }}>
             <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '40px', height: '40px', border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto' }} />
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="role-rank-grid" style={{ gap: '40px' }}>
            {roles.map(role => {
              const roleUsers = leaderboard.filter(u => u.profession === role.name).slice(0, 5);
              return (
                <motion.div 
                  variants={itemVariants}
                  key={role.name} 
                  className="glass role-rank-card"
                  style={{ 
                    borderRadius: '40px', 
                    padding: '35px',
                    border: '1px solid rgba(255,255,255,0.03)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: `radial-gradient(circle, ${role.color}15 0%, transparent 70%)` }}></div>

                  <div className="role-card-header" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '35px', position: 'relative', zIndex: 1 }}>
                     <div className="role-icon-box" style={{ 
                        background: `linear-gradient(135deg, ${role.color}, ${role.color}aa)`, 
                        color: '#fff', width: '55px', height: '55px', borderRadius: '18px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', 
                        boxShadow: `0 10px 25px ${role.color}44`,
                        transform: 'rotate(-5deg)', flexShrink: 0
                     }}>
                       {role.icon}
                     </div>
                     <div style={{ minWidth: 0 }}>
                       <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '700', letterSpacing: '-1px' }}>{role.display}</h2>
                       <div style={{ fontSize: '0.65rem', color: role.color, fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{role.label}</div>
                     </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 1 }}>
                    {roleUsers.length === 0 ? (
                      <div style={{ padding: '60px', textAlign: 'center', color: '#111', border: '2px dashed rgba(255,255,255,0.02)', borderRadius: '35px', fontWeight: '700', letterSpacing: '4px' }}>
                        ยังไม่มีอันดับในสายอาชีพนี้
                      </div>
                    ) : (
                      roleUsers.map((user, idx) => (
                        <Link 
                          key={user._id} 
                          to={`/profile/${user._id}`} 
                          className="rank-item"
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 20px', background: idx === 0 ? 'rgba(255,255,255,0.03)' : 'transparent', borderRadius: '20px', textDecoration: 'none', border: idx === 0 ? `1px solid ${role.color}44` : '1px solid transparent', transition: '0.3s'
                          }}

                        >
                           <div className="rank-num-role" style={{ width: '30px', fontWeight: '900', fontSize: '1.1rem', color: idx === 0 ? role.color : '#111', textAlign: 'center' }}>
                             #{idx + 1}
                           </div>
                           <div className="avatar-role-wrap">
                             <ProfileFrame rank={user.rank} size="45px">
                               <img 
                                 src={user.profileImage?.url ? (getFullUrl(user.profileImage.url) + (user._id === (currentUser?._id || currentUser?.id) ? `?t=${profileUpdateTag}` : '')) : 'https://via.placeholder.com/55'} 
                                 style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                               />
                             </ProfileFrame>
                           </div>
                           <div style={{ flex: 1, minWidth: 0 }}>
                             <div className="user-name-role" style={{ color: '#fff', fontWeight: '700', fontSize: '1rem', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                             <div style={{ color: '#333', fontSize: '0.65rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                               <RankBadge rank={user.rank} size="xs" /> <span className="hide-mobile">{user.rank.toUpperCase()}</span>
                             </div>
                           </div>
                           <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ color: category === 'earnings' ? '#f59e0b' : 'var(--accent)', fontWeight: '700', fontSize: '1rem' }}>
                                {category === 'earnings' ? <CoinBadge amount={user.totalEarnings || 0} size="sm" /> : (user.totalViews || 0).toLocaleString()}
                              </div>
                              <div style={{ fontSize: '0.6rem', color: '#111', fontWeight: '700', letterSpacing: '1px' }}>
                                {category === 'earnings' ? 'COINS' : 'VIEWS'}
                              </div>
                           </div>
                        </Link>
                      ))
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      <style>{`
        .role-rank-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 600px), 1fr));
        }
        @media (max-width: 992px) {
           .role-rank-grid {
             grid-template-columns: 1fr;
           }
        }
        @media (max-width: 768px) {
          .role-rank-card {
            padding: 25px !important;
            border-radius: 30px !important;
          }
          .role-card-header {
             margin-bottom: 30px !important;
          }
          .hide-mobile {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .role-rank-card {
            padding: 20px !important;
          }
          .role-icon-box {
            width: 45px !important;
            height: 45px !important;
            font-size: 1.4rem !important;
          }
          .role-card-header h2 {
            font-size: 1.3rem !important;
          }
          .rank-item {
            padding: 12px 15px !important;
            gap: 10px !important;
          }
          .rank-num-role {
            width: 25px !important;
            font-size: 1rem !important;
          }
          .user-name-role {
            font-size: 0.9rem !important;
          }
          .avatar-role-wrap {
            transform: scale(0.9);
          }
        }
        .rank-item:hover {
          background: rgba(255,255,255,0.05) !important;
          transform: translateX(10px);
        }
      `}</style>

    </div>
  );
};

export default RoleRankings;
