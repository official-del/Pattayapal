import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiCamera, FiVideo, FiEdit, FiLayers, FiEye } from 'react-icons/fi';
import { usersAPI } from '../utils/api';
import { getFullUrl } from '../utils/mediaUtils';
import { AuthContext } from '../context/AuthContext';
import RankBadge from '../components/RankBadge';
import ProfileFrame from '../components/ProfileFrame';
import { CoinIcon, CoinBadge } from '../components/CoinIcon';
import PremiumLoader from '../components/PremiumLoader';
import Footer from '../components/Footer';
import '../css/RoleRankings.css';

const MotionDiv = motion.div;

const ROLES = [
  { name: 'Photographer', icon: <FiCamera />, label: 'Photography', display: 'Photographer' },
  { name: 'Videographer', icon: <FiVideo />, label: 'Video production', display: 'Videographer' },
  { name: 'Editor', icon: <FiEdit />, label: 'Editing and post', display: 'Editor' },
  { name: 'Director', icon: <FiLayers />, label: 'Creative direction', display: 'Director' },
];

function RoleAvatar({ user, profileUpdateTag }) {
  const myId = user?._id || user?.id;
  const imageUrl = user?.profileImage?.url
    ? `${getFullUrl(user.profileImage.url)}${myId ? `?t=${profileUpdateTag}` : ''}`
    : 'https://via.placeholder.com/55';

  return <img className="role-avatar-img" src={imageUrl} alt={user?.name || 'Creator'} />;
}

function Score({ user, category }) {
  if (category === 'earnings') return <CoinBadge amount={user.totalEarnings || 0} size="sm" />;
  return <>{(user.totalViews || 0).toLocaleString()}</>;
}

const RoleRankings = () => {
  const { user: currentUser, profileUpdateTag } = useContext(AuthContext);
  const [category, setCategory] = useState('views');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const data = await usersAPI.getLeaderboard(category);
        setLeaderboard(data || []);
      } catch (err) {
        console.error('Fetch leaderboard failed', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [category]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } },
  };

  const itemVariants = {
    hidden: { y: 12, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <>
      <main className="role-rankings-page">
        <section className="role-rankings-shell">
        <header className="role-rankings-hero">
          <MotionDiv
            className="role-rankings-copy"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link to="/rankings" className="role-back-link">
              <FiArrowLeft />
              <span>Back to rankings hub</span>
            </Link>
            <div className="role-kicker">
              <FiEye />
              <span>Role Leaderboards</span>
            </div>
            <h1>Rankings by profession</h1>
            <p>
              Compare creators by role and see who is standing out by views or coin earnings.
            </p>
          </MotionDiv>

          <div className="role-tabs" role="tablist" aria-label="Role ranking category">
            <button
              type="button"
              className={category === 'views' ? 'is-active' : ''}
              onClick={() => setCategory('views')}
            >
              <FiEye />
              <span>Views</span>
            </button>
            <button
              type="button"
              className={category === 'earnings' ? 'is-active' : ''}
              onClick={() => setCategory('earnings')}
            >
              <CoinIcon size={16} />
              <span>Coins</span>
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {loading ? (
            <PremiumLoader key="loader" fullScreen={false} text="Loading Role Rankings..." subtext="กำลังจัดอันดับตามสายงาน..." />
          ) : (
            <MotionDiv
              key={category}
              className="role-rank-grid"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
            >
              {ROLES.map(role => {
                const roleUsers = leaderboard.filter(u => u.profession === role.name).slice(0, 5);

                return (
                  <MotionDiv variants={itemVariants} key={role.name} className="role-rank-card">
                    <div className="role-card-header">
                      <div className="role-icon-box">
                        {role.icon}
                      </div>
                      <div className="role-card-title">
                        <span>{role.label}</span>
                        <h2>{role.display}</h2>
                      </div>
                    </div>

                    <div className="role-rank-list">
                      {roleUsers.length === 0 ? (
                        <div className="role-empty-state">
                          No creators ranked in this role yet
                        </div>
                      ) : (
                        roleUsers.map((user, idx) => (
                          <Link key={user._id} to={`/profile/${user._id}`} className={`role-rank-row ${idx === 0 ? 'is-top' : ''}`}>
                            <div className="role-rank-number">#{idx + 1}</div>
                            <ProfileFrame rank={user.rank} points={user.points || 0} size="48px" showBadge={false} showXpRing={false}>
                              <RoleAvatar user={user} profileUpdateTag={user._id === (currentUser?._id || currentUser?.id) ? profileUpdateTag : ''} />
                            </ProfileFrame>
                            <div className="role-user-copy">
                              <strong>{user.name}</strong>
                              <span>
                                <RankBadge rank={user.rank} size="xs" />
                                {user.rank || 'Bronze'}
                              </span>
                            </div>
                            <div className="role-score">
                              <strong><Score user={user} category={category} /></strong>
                              <span>{category === 'earnings' ? 'Coins' : 'Views'}</span>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </MotionDiv>
                );
              })}
            </MotionDiv>
          )}
        </AnimatePresence>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default RoleRankings;
