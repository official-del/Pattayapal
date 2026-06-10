import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiAward, FiArrowRight, FiTarget } from 'react-icons/fi';
import { CoinIcon, CoinBadge } from '../components/CoinIcon';
import { AuthContext } from '../context/AuthContext';
import { usersAPI } from '../utils/api';
import { getFullUrl } from '../utils/mediaUtils';
import ProfileFrame from '../components/ProfileFrame';
import RankBadge from '../components/RankBadge';
import PremiumLoader from '../components/PremiumLoader';
import '../css/RankingsHub.css';

const MotionDiv = motion.div;

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
};

function PattyAvatar({ user, size = 40, border = 'none' }) {
  const imageUrl = user?.profileImage?.url ? getFullUrl(user.profileImage.url) : null;
  const sz = typeof size === 'string' ? parseInt(size, 10) : size;

  return (
    <div className="rankings-avatar" style={{ width: sz, height: sz, border }}>
      {imageUrl ? (
        <img src={imageUrl} alt={user?.name || 'Creator'} />
      ) : (
        <div className="rankings-avatar-fallback" style={{ fontSize: sz * 0.34 }}>
          {getInitials(user?.name)}
        </div>
      )}
    </div>
  );
}

function ScoreValue({ user, category, size = 'md' }) {
  if (category === 'earnings') {
    return <CoinBadge amount={user?.totalEarnings || 0} size={size} />;
  }

  return <>{(user?.points || 0).toLocaleString()}</>;
}

function PodiumCard({ user, rankNum, category }) {
  const isFirst = rankNum === 1;
  const frameSize = isFirst ? 124 : 104;
  const avatarSize = isFirst ? 108 : 90;

  return (
    <MotionDiv
      className={`rankings-podium-card rank-${rankNum} ${isFirst ? 'is-first' : ''}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, delay: rankNum * 0.04, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="rankings-podium-rank">#{rankNum}</div>

      <Link to={`/profile/${user._id}`} className="rankings-podium-avatar">
        <ProfileFrame rank={user.rank} points={user.points || 0} size={`${frameSize}px`}>
          <PattyAvatar user={user} size={avatarSize} />
        </ProfileFrame>
      </Link>

      <div className="rankings-podium-copy">
        <h2>{user.name}</h2>
        <p>{user.profession || 'Creator'}</p>
      </div>

      <div className="rankings-podium-score">
        <strong>
          <ScoreValue user={user} category={category} size={isFirst ? 'xl' : 'lg'} />
        </strong>
        <span>{category === 'earnings' ? 'Total coins' : 'Experience XP'}</span>
      </div>
    </MotionDiv>
  );
}

export default function RankingsHub() {
  const { user: currentUser } = useContext(AuthContext);
  const [category, setCategory] = useState('points');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const lbData = await usersAPI.getLeaderboard(category);
        setLeaderboard(lbData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category]);

  const top3 = leaderboard.slice(0, 3);
  const theRest = leaderboard.slice(3);
  const podiumOrder = top3;
  const podiumRanks = [1, 2, 3];

  const myRankIndex = currentUser ? leaderboard.findIndex(u => u._id === currentUser._id) : -1;
  const myRank = myRankIndex !== -1 ? myRankIndex + 1 : null;
  const myData = myRankIndex !== -1 ? leaderboard[myRankIndex] : null;

  return (
    <main className="rankings-page">
      <section className="rankings-shell">
        <header className="rankings-hero">
          <MotionDiv
            className="rankings-hero-copy"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="rankings-kicker">
              <FiAward />
              <span>Community Hall</span>
            </div>
            <h1>Rankings of community</h1>
            <p>ดูอันดับครีเอเตอร์ที่โดดเด่นจากคะแนน XP และ Coin flow ในระบบ PattayaPal</p>
          </MotionDiv>

          <div className="rankings-tabs" role="tablist" aria-label="Ranking category">
            {[
              { id: 'points', label: 'XP', icon: <FiAward /> },
              { id: 'earnings', label: 'Coins', icon: <CoinIcon size={16} /> }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                className={category === tab.id ? 'is-active' : ''}
                onClick={() => setCategory(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </header>

        <section className="rankings-podium-section" aria-label="Top ranking creators">
          <AnimatePresence mode="wait">
            {loading ? (
              <PremiumLoader key="loader" fullScreen={false} text="Loading Rankings..." subtext="กำลังคำนวณอันดับ..." />
            ) : (
              <MotionDiv
                key={category}
                className="rankings-podium-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {podiumOrder.map((user, idx) => (
                  <PodiumCard key={user._id} user={user} rankNum={podiumRanks[idx]} category={category} />
                ))}
              </MotionDiv>
            )}
          </AnimatePresence>
        </section>

        {myData && (
          <MotionDiv
            className="rankings-my-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="rankings-my-number">#{myRank}</div>
            <PattyAvatar user={myData} size={58} border="2px solid var(--accent)" />
            <div className="rankings-my-copy">
              <span>Your current rank</span>
              <strong>{myData.name}</strong>
            </div>
            <div className="rankings-my-score">
              <strong><ScoreValue user={myData} category={category} size="lg" /></strong>
              <span>{category === 'earnings' ? 'Total coins' : 'XP score'}</span>
            </div>
          </MotionDiv>
        )}

        <section className="rankings-board" aria-label="Leaderboard">
          <div className="rankings-board-header">
            <div>
              <div className="rankings-kicker">
                <FiAward />
                <span>Leaderboard</span>
              </div>
              <h2>Creators on the rise</h2>
            </div>
            <span className="rankings-board-count">{leaderboard.length} creators</span>
          </div>

          <div className="rankings-list">
            {theRest.map((user, idx) => (
              <MotionDiv
                key={user._id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.025, 0.2) }}
              >
                <Link to={`/profile/${user._id}`} className="rankings-row">
                  <div className="rankings-row-number">#{idx + 4}</div>
                  <ProfileFrame rank={user.rank} points={user.points || 0} size="56px" showBadge={false} showXpRing={false}>
                    <PattyAvatar user={user} size={46} />
                  </ProfileFrame>
                  <div className="rankings-row-copy">
                    <div>
                      <strong>{user.name}</strong>
                      <RankBadge rank={user.rank} size="xs" />
                    </div>
                    <span>{user.profession || 'Creator'}</span>
                  </div>
                  <div className="rankings-row-score">
                    <strong><ScoreValue user={user} category={category} size="md" /></strong>
                    <span>{category === 'earnings' ? 'Earned' : 'XP'}</span>
                  </div>
                </Link>
              </MotionDiv>
            ))}
          </div>
        </section>

        <div className="rankings-role-cta-wrap">
          <Link to="/rankings/roles" className="rankings-role-cta">
            <FiTarget />
            <span>View by profession</span>
            <FiArrowRight />
          </Link>
        </div>
      </section>
    </main>
  );
}
