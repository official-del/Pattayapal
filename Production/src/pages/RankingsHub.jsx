import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiAward, FiStar, FiHeart, FiEye, FiCheckCircle, FiDollarSign, FiActivity, FiZap, FiTarget, FiArrowRight } from 'react-icons/fi';
import { CoinIcon, CoinBadge } from '../components/CoinIcon';
import { AuthContext } from '../context/AuthContext';
import { usersAPI } from '../utils/api';
import { getFullUrl } from '../utils/mediaUtils';
import ProfileFrame from '../components/ProfileFrame';
import RankBadge from '../components/RankBadge';

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.split(' ');
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
};

function PattyAvatar({ user, size = 40, border = 'none' }) {
  const imageUrl = user?.profileImage?.url ? getFullUrl(user.profileImage.url) : null;
  const sz = typeof size === 'string' ? parseInt(size) : size;
  return (
    <div style={{ width: sz, height: sz, borderRadius: '50%', overflow: 'hidden', border, flexShrink: 0, background: '#0a0a0a' }}>
      {imageUrl ? <img src={imageUrl} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: sz * 0.35, fontWeight: 900, color: '#222' }}>{getInitials(user?.name)}</div>}
    </div>
  );
}

function PodiumCard({ user, rankNum, category }) {
  const isFirst = rankNum === 1;
  const accent = isFirst ? 'var(--accent)' : rankNum === 2 ? '#9ca3af' : '#cd7f32';
  const avatarSize = isFirst ? 130 : 100;

  return (
    <div className={`podium-card ${isFirst ? 'is-first' : ''} rank-${rankNum}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: isFirst ? 10 : 5 }}>

      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: rankNum * 0.1 }} style={{ position: 'relative', marginBottom: '40px' }}>
        {isFirst && (
          <motion.div
            animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
            style={{ position: 'absolute', inset: -30, border: '1px dashed rgba(255,87,51,0.2)', borderRadius: '50%' }}
          />
        )}
        <Link to={`/profile/${user._id}`}>
          <ProfileFrame rank={user.rank} size={`${avatarSize}px`}>
            <PattyAvatar user={user} size={avatarSize - 15} />
          </ProfileFrame>
        </Link>
        <div style={{ position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)', background: accent, color: '#fff', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1.2rem', boxShadow: `0 0 15px ${accent}`, zIndex: 20 }}>
          {rankNum}
        </div>
      </motion.div>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h4 style={{ fontSize: isFirst ? '1.8rem' : '1.3rem', fontWeight: '700', color: '#fff', margin: 0, letterSpacing: '-1px' }}>{user.name}</h4>
        <p style={{ fontSize: '0.7rem', color: '#444', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '5px' }}>{user.profession || 'GENERAL'}</p>
      </div>

      <div className="glass" style={{
        width: '100%', height: isFirst ? '200px' : '140px',
        borderRadius: '40px 40px 10px 10px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${isFirst ? 'rgba(255,87,51,0.1)' : 'rgba(255,255,255,0.03)'}`,
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: `linear-gradient(180deg, ${accent}05 0%, transparent 100%)` }}></div>
        <div style={{ fontSize: isFirst ? '3rem' : '2rem', fontWeight: '700', color: '#fff', letterSpacing: '-2px', position: 'relative', zIndex: 1 }}>
          {category === 'earnings' ? <CoinBadge amount={user.totalEarnings || 0} size={isFirst ? "xl" : "lg"} /> : (user.points || 0).toLocaleString()}
        </div>
        <span style={{ fontSize: '0.65rem', color: '#222', fontWeight: '700', letterSpacing: '2px', marginTop: '10px', position: 'relative', zIndex: 1 }}>{category === 'earnings' ? 'TOTAL EARNINGS' : 'EXPERIENCE XP'}</span>

      </div>
    </div>
  );
}

export default function RankingsHub() {
  const { user: currentUser, authLoading } = useContext(AuthContext);
  const [category, setCategory] = useState('points');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const lbData = await usersAPI.getLeaderboard(category);
        setLeaderboard(lbData || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [category]);

  const top3 = leaderboard.slice(0, 3);
  const theRest = leaderboard.slice(3);
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumRanks = top3.length === 3 ? [2, 1, 3] : [1, 2, 3];

  const myRankIndex = currentUser ? leaderboard.findIndex(u => u._id === currentUser._id) : -1;
  const myRank = myRankIndex !== -1 ? myRankIndex + 1 : null;
  const myData = myRankIndex !== -1 ? leaderboard[myRankIndex] : null;

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingTop: '150px', paddingBottom: '150px', color: '#fff' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 5%' }}>

        <header style={{ textAlign: 'center', marginBottom: '100px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
              <FiAward color="var(--accent)" size={20} />
              <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: '700' }}></span>
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 8vw, 4.5rem)', fontWeight: '700', margin: 0, letterSpacing: '1px', lineHeight: 1 }}>RANKINGS OF COMMUNITY</h1>
            <p style={{ color: '#444', fontWeight: '700', letterSpacing: '1px', fontSize: '0.85rem', marginTop: '20px', maxWidth: '800px', margin: '20px auto 0', lineHeight: 1.5 }}>ทำเนียบเกียรติยศสำหรับครีเอเตอร์ผู้สร้างสรรค์ผลงานที่โดดเด่นและทรงอิทธิพลในระบบนิเวศของเรา</p>

          </motion.div>

          <div className="tab-switcher" style={{ display: 'inline-flex', gap: '10px', marginTop: '40px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.03)', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { id: 'points', label: 'XP', icon: <FiAward /> },
              { id: 'earnings', label: 'COINS', icon: <FiDollarSign /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCategory(tab.id)}
                style={{
                  padding: '10px 25px', borderRadius: '35px', border: 'none',
                  background: category === tab.id ? 'var(--accent)' : 'transparent', color: category === tab.id ? '#fff' : '#444',
                  fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', transition: '0.3s', display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: category === tab.id ? '0 10px 25px var(--accent-glow)' : 'none'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </header>

        <section style={{ marginBottom: '120px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '50px', height: '50px', border: '4px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto' }} />
            </div>
          ) : (
            <div className="podium-container">
              {podiumOrder.map((user, idx) => (
                <PodiumCard key={user._id} user={user} rankNum={podiumRanks[idx]} category={category} />
              ))}
            </div>
          )}
        </section>

        {myData && (
          <div style={{ marginBottom: '80px', padding: '0 20px' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass my-rank-banner"
              style={{
                maxWidth: '800px', margin: '0 auto',
                padding: '20px 40px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '30px',
                border: '1px solid var(--accent)', background: 'linear-gradient(90deg, rgba(255,87,51,0.05), transparent)',
                boxShadow: '0 0 40px var(--accent-glow)'
              }}
            >
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--accent)', minWidth: '70px', letterSpacing: '-2px' }}>#{myRank}</div>
              <PattyAvatar user={myData} size={70} border="3px solid var(--accent)" />
              <div className="my-rank-text" style={{ flex: 1 }}>
                <h5 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--accent)', letterSpacing: '1px' }}>YOUR CURRENT RANK</h5>
                <p style={{ margin: '5px 0 0', fontSize: '1.5rem', color: '#fff', fontWeight: '700', letterSpacing: '-1px' }}>{myData.name}</p>
              </div>
              <div className="my-rank-score" style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#fff' }}>
                  {category === 'earnings' ? <CoinBadge amount={myData.totalEarnings || 0} size="lg" /> : myData.points?.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: '700', letterSpacing: '2px', marginTop: '4px' }}>
                  {category === 'earnings' ? 'รายได้สะสม / TOTAL' : 'คะแนนแต้ม / XP SCORE'}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <div className="rankings-list-grid" style={{ gap: '25px' }}>
          {theRest.map((user, idx) => (
            <motion.div
              key={user._id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link to={`/profile/${user._id}`} style={{ textDecoration: 'none' }}>
                <motion.div
                  whileHover={{ x: 10, background: 'rgba(255,255,255,0.02)' }}
                  className="glass ranking-item-row"
                  style={{ padding: '20px', borderRadius: '35px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid rgba(255,255,255,0.03)', transition: '0.3s' }}
                >
                  <div className="rank-number" style={{ fontSize: '1.5rem', fontWeight: '900', color: '#111', minWidth: '45px', textAlign: 'center' }}>#{idx + 4}</div>
                  <div className="avatar-wrap">
                    <PattyAvatar user={user} size={window.innerWidth < 480 ? 50 : 60} border="2px solid rgba(255,255,255,0.05)" />
                  </div>
                  <div className="user-info-wrap" style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h5 className="user-name-text" style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#fff', letterSpacing: '-0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</h5>
                      <RankBadge rank={user.rank} size="xs" />
                    </div>
                    <p style={{ margin: '3px 0 0', fontSize: '0.7rem', color: '#333', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>{user.profession || 'CREATOR'}</p>
                  </div>
                  <div className="score-wrap" style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: category === 'earnings' ? '#f59e0b' : 'var(--accent)' }}>
                      {category === 'earnings' ? <CoinBadge amount={user.totalEarnings || 0} size="md" /> : user.points?.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: '#222', fontWeight: '700', letterSpacing: '1px', marginTop: '2px' }}>
                      {category === 'earnings' ? 'EARNED' : 'XP'}
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div style={{ marginTop: '100px', textAlign: 'center' }}>
          <Link to="/rankings/roles" style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ scale: 1.02, boxShadow: '0 0 40px var(--accent-glow)' }}
              className="glass profession-cta"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '15px', padding: '20px 40px', borderRadius: '40px', border: '1px solid var(--accent)', background: 'rgba(255,87,51,0.05)', maxWidth: '100%' }}
            >
              <FiTarget size={24} color="var(--accent)" />
              <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>BY PROFESSION</span>
              <FiArrowRight size={20} color="#fff" />
            </motion.div>
          </Link>
        </div>

      </div>

      <style>{`
        .rankings-list-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 600px), 1fr));
        }
        .podium-container {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 20px;
          padding: 40px 0;
        }
        .podium-card {
          width: 280px;
        }
        .podium-card.is-first {
          width: 340px;
        }
        @media (max-width: 1200px) {
          .podium-container {
            gap: 10px;
          }
          .podium-card {
            width: 240px;
          }
          .podium-card.is-first {
            width: 300px;
          }
        }
        @media (max-width: 992px) {
          .podium-container {
            flex-direction: column;
            align-items: center;
            gap: 60px;
            margin-top: 50px;
          }
          .podium-card {
            width: 100% !important;
            max-width: 340px;
          }
          .podium-card.rank-1 { order: 1; }
          .podium-card.rank-2 { order: 2; }
          .podium-card.rank-3 { order: 3; }
        }
        @media (max-width: 768px) {
          .rankings-list-grid {
            grid-template-columns: 1fr;
          }
          .my-rank-banner {
            flex-direction: column;
            text-align: center;
            padding: 25px !important;
            gap: 15px !important;
          }
          .my-rank-text, .my-rank-score {
            text-align: center !important;
          }
          .ranking-item-row {
            padding: 15px !important;
            gap: 15px !important;
            border-radius: 25px !important;
          }
        }
        @media (max-width: 480px) {
          .ranking-item-row {
            gap: 10px !important;
          }
          .rank-number {
            min-width: 35px !important;
            font-size: 1.2rem !important;
          }
          .user-name-text {
            font-size: 1rem !important;
          }
          .score-wrap {
            font-size: 0.9rem !important;
          }
          .profession-cta {
             padding: 15px 30px !important;
          }
          .profession-cta span {
             font-size: 0.9rem !important;
          }
        }
      `}</style>
    </div>
  );
}