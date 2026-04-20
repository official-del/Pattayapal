import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiCamera, FiVideo, FiEdit, FiLayers, FiEye, FiAward, FiZap, FiActivity } from 'react-icons/fi';
import { usersAPI } from '../utils/api';
import { getFullUrl } from '../utils/mediaUtils';
import RankBadge from '../components/RankBadge';
import ProfileFrame from '../components/ProfileFrame';
import { CoinIcon, CoinBadge } from '../components/CoinIcon';

const RoleRankings = () => {
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
           <h1 style={{ fontSize: '5rem', fontWeight: '700', margin: 0, letterSpacing: '-3px', lineHeight: 1 }}>
             อันดับ <span style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 15px var(--accent-glow))' }}>สายอาชีพ</span>
           </h1>

           <p style={{ color: '#444', marginTop: '20px', fontSize: '1.2rem', fontWeight: '700' }}>
             เฟ้นหาผู้เล่นที่โดดเด่นที่สุดในแต่ละด้าน วัดผลจาก {category === 'views' ? 'ยอดการเข้าชม' : 'จำนวนเหรียญสะสม'}
           </p>

           {/* 🧬 Category Signal Toggle */}
           <div style={{ 
              marginTop: '50px', display: 'inline-flex', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)'
           }}>
             <button
               onClick={() => setCategory('views')}
               style={{
                 display: 'flex', alignItems: 'center', gap: '10px', padding: '15px 35px', borderRadius: '35px',
                 background: category === 'views' ? 'var(--accent)' : 'transparent', color: category === 'views' ? '#fff' : '#444', border: 'none',
                 cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem', transition: '0.3s',
                 boxShadow: category === 'views' ? '0 10px 25px var(--accent-glow)' : 'none'
               }}
             >
               <FiEye /> ยอดเข้าชมสูงสุด
             </button>
             <button
               onClick={() => setCategory('earnings')}
               style={{
                 display: 'flex', alignItems: 'center', gap: '10px', padding: '15px 35px', borderRadius: '35px',
                 background: category === 'earnings' ? 'var(--accent)' : 'transparent', color: category === 'earnings' ? '#fff' : '#444', border: 'none',
                 cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem', transition: '0.3s',
                 boxShadow: category === 'earnings' ? '0 10px 25px var(--accent-glow)' : 'none'
               }}
             >
               <CoinIcon size={18} /> เหรียญรายได้สูงสุด
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
                  className="glass"
                  style={{ 
                    borderRadius: '50px', 
                    padding: '50px',
                    border: '1px solid rgba(255,255,255,0.03)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: `radial-gradient(circle, ${role.color}15 0%, transparent 70%)` }}></div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '50px', position: 'relative', zIndex: 1 }}>
                     <div style={{ 
                        background: `linear-gradient(135deg, ${role.color}, ${role.color}aa)`, 
                        color: '#fff', width: '70px', height: '70px', borderRadius: '25px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', 
                        boxShadow: `0 15px 35px ${role.color}44`,
                        transform: 'rotate(-5deg)'
                     }}>
                       {role.icon}
                     </div>
                     <div>
                       <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', letterSpacing: '-1px' }}>{role.display}</h2>
                       <div style={{ fontSize: '0.7rem', color: role.color, fontWeight: '700', letterSpacing: '4px', textTransform: 'uppercase', marginTop: '4px' }}>{role.label}</div>
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
                            display: 'flex', alignItems: 'center', gap: '20px', padding: '18px 25px', background: idx === 0 ? 'rgba(255,255,255,0.03)' : 'transparent', borderRadius: '25px', textDecoration: 'none', border: idx === 0 ? `1px solid ${role.color}44` : '1px solid transparent', transition: '0.3s'
                          }}

                        >
                           <div style={{ width: '35px', fontWeight: '700', fontSize: '1.2rem', color: idx === 0 ? role.color : '#222' }}>
                             #{idx + 1}
                           </div>
                           <ProfileFrame rank={user.rank} size="55px">
                             <img 
                               src={user.profileImage?.url ? getFullUrl(user.profileImage.url) : 'https://via.placeholder.com/55'} 
                               style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                             />
                           </ProfileFrame>
                           <div style={{ flex: 1 }}>
                             <div style={{ color: '#fff', fontWeight: '700', fontSize: '1.1rem', letterSpacing: '-0.3px' }}>{user.name}</div>
                             <div style={{ color: '#444', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                               <RankBadge rank={user.rank} size="xs" /> {user.rank.toUpperCase()}
                             </div>
                           </div>
                           <div style={{ textAlign: 'right' }}>
                              <div style={{ color: category === 'earnings' ? '#f59e0b' : 'var(--accent)', fontWeight: '700', fontSize: '1.1rem' }}>
                                {category === 'earnings' ? <CoinBadge amount={user.totalEarnings || 0} size="sm" /> : (user.totalViews || 0).toLocaleString()}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: '#222', fontWeight: '700', letterSpacing: '1px' }}>
                                {category === 'earnings' ? 'เหรียญสะสม' : 'ยอดเข้าชม'}
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
          grid-template-columns: repeat(auto-fit, minmax(650px, 1fr));
        }
        @media (max-width: 768px) {
          .role-rank-grid {
            grid-template-columns: 1fr;
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
