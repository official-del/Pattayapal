import { useState, useEffect, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usersAPI, postsAPI } from '../utils/api';
import { getFullUrl, isVideoUrl } from '../utils/mediaUtils';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowRight,
  FiBriefcase,
  FiGrid,
  FiSearch,
  FiTarget,
  FiUsers,
  FiZap,
  FiFileText,
  FiClock,
  FiImage,
} from 'react-icons/fi';
import ProfileFrame from '../components/ProfileFrame';
import HireModal from '../components/HireModal';
import GasIcon from '../components/GasIcon';
import PremiumLoader from '../components/PremiumLoader';
import Footer from '../components/Footer';
import { PRODUCTION_SKILLS } from './UserProfile';
import '../css/Discovery.css';

const toDisplayText = (value, fallback = '') => {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (!value || typeof value !== 'object') return fallback;
  return String(value.name || value.label || value.title || value.category || value.level || value.rank || value._id || value.id || fallback);
};

function Discovery() {
  const { user: contextUser, token: contextToken } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const currentToken = contextToken || window.safeStorage.getItem('userToken');
  const currentUser = contextUser || JSON.parse(window.safeStorage.getItem('userInfo') || '{}');

  const [freelancers, setFreelancers] = useState([]);
  const [allFreelancers, setAllFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [activeProfession, setActiveProfession] = useState('All');
  const [activeRank, setActiveRank] = useState('All');
  const [hireModal, setHireModal] = useState({ show: false, freelancerId: null, freelancerName: '' });
  const [searchMode, setSearchMode] = useState('people'); // 'people' | 'posts'
  const [postResults, setPostResults] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const ranks = ['All', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
  const skillOptions = PRODUCTION_SKILLS
    .map((skill) => toDisplayText(skill, ''))
    .filter(Boolean);

  const fetchInitialFreelancers = async () => {
    setLoading(true);
    try {
      const results = await usersAPI.searchUsers('', currentToken);
      setFreelancers(results || []);
      setAllFreelancers(results || []);
    } catch (err) {
      console.error('Initial discovery error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const profParam = searchParams.get('profession');
      const rankParam = searchParams.get('rank');

      try {
        if (profParam) {
          setActiveProfession(profParam);
          const results = await usersAPI.searchUsers('', currentToken);
          setFreelancers(results || []);
          setAllFreelancers(results || []);
        } else {
          await fetchInitialFreelancers();
        }
        if (rankParam) setActiveRank(rankParam);
      } catch (err) {
        console.error('Mount sync error:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
    window.scrollTo(0, 0);
  }, [searchParams]);

  const selectProfession = async (prof) => {
    setActiveProfession(prof);
  };

  // Switch mode — clear results of the other mode
  const switchMode = (mode) => {
    setSearchMode(mode);
    setSearchQuery('');
    setPostResults([]);
    setShowSkillSuggestions(false);
    if (mode === 'people') {
      fetchInitialFreelancers();
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (searchMode === 'posts') {
      if (!query.trim()) { setPostResults([]); return; }
      setPostsLoading(true);
      try {
        const results = await postsAPI.search(query);
        setPostResults(results || []);
      } catch (err) {
        console.error('Post search error:', err);
      } finally {
        setPostsLoading(false);
      }
    } else {
      setSearchLoading(true);
      try {
        const results = await usersAPI.searchUsers(query, currentToken);
        setFreelancers(results || []);
      } catch (err) {
        console.error('Discovery search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }
  };

  const visibleSkillOptions = skillOptions
    .filter((skill) => !searchQuery || skill.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 36);

  const selectSkillSuggestion = (skill) => {
    setShowSkillSuggestions(false);
    handleSearch(skill);
  };

  const filteredFreelancers = freelancers.filter((freelancer) => {
    if (freelancer.role === 'admin') return false;
    const professionText = toDisplayText(freelancer.profession, 'General');
    const rankText = toDisplayText(freelancer.rank, 'Bronze');
    const hasProfession = professionText && professionText.toLowerCase() !== 'general';
    if (freelancer.role !== 'freelancer' && !hasProfession) return false;

    const profMatch = activeProfession === 'All' || professionText === activeProfession;
    const rankMatch = activeRank === 'All' || rankText === activeRank;
    return profMatch && rankMatch;
  });

  const professions = [
    'All',
    ...Array.from(new Set(
      (allFreelancers.length ? allFreelancers : freelancers)
        .filter((freelancer) => {
          if (freelancer.role === 'admin') return false;
          const professionText = toDisplayText(freelancer.profession, '');
          return professionText && professionText.toLowerCase() !== 'general';
        })
        .map((freelancer) => toDisplayText(freelancer.profession, ''))
        .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b)),
  ];

  const publishedCreators = filteredFreelancers.length;
  const highRankCount = filteredFreelancers.filter((freelancer) => ['Gold', 'Platinum', 'Diamond'].includes(toDisplayText(freelancer.rank, 'Bronze'))).length;
  const videoReadyCount = filteredFreelancers.filter((freelancer) => (freelancer.skills || []).some((skill) => isVideoUrl(skill?.sampleUrl || ''))).length;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.045 } },
  };

  const itemVariants = {
    hidden: { y: 14, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <>
      <main className="discovery-page">
        <section className="discovery-hero">
        <div className="discovery-hero-copy">
          <div className="discovery-kicker"><FiZap size={16} /><span>Talent Discovery</span></div>
          <h1>Find Freelancers</h1>
          <p>Search PattayaPal creators by role, rank, skill, and profile fit before opening a hire request.</p>
        </div>

        <div className="discovery-hud">
          <div className="discovery-hud-icon">
            <GasIcon gas={currentUser?.gas || 0} size="34px" />
          </div>
          <div>
            <span>Energy</span>
            <strong>{currentUser?.gas || 0}%</strong>
          </div>
        </div>
      </section>

      <section className="discovery-search-panel">
        {/* ── Mode Toggle ── */}
        <div className="discovery-mode-toggle">
          <button
            type="button"
            onClick={() => switchMode('people')}
            className={`discovery-mode-btn ${searchMode === 'people' ? 'active' : ''}`}
          >
            <FiUsers size={15} /> People
          </button>
          <button
            type="button"
            onClick={() => switchMode('posts')}
            className={`discovery-mode-btn ${searchMode === 'posts' ? 'active' : ''}`}
          >
            <FiFileText size={15} /> Posts
          </button>
        </div>

        <div className="discovery-search-box">
          <FiSearch size={20} />
          <input
            type="text"
            placeholder={searchMode === 'posts' ? 'ค้นหาเนื้อหาโพสต์ หรือชื่อผู้โพสต์...' : 'Search by skill, role, or creator name...'}
            value={searchQuery}
            onFocus={() => searchMode === 'people' && setShowSkillSuggestions(true)}
            onBlur={() => window.setTimeout(() => setShowSkillSuggestions(false), 140)}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {(searchLoading || postsLoading) && <PremiumLoader bare size="small" />}
          <button type="button" onClick={() => handleSearch(searchQuery)}>
            Search
          </button>
        </div>

        {/* Skill suggestions — People mode only */}
        <AnimatePresence>
          {searchMode === 'people' && showSkillSuggestions && visibleSkillOptions.length > 0 && (
            <motion.div
              className="discovery-suggestion-panel"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <div className="discovery-suggestion-head">
                <span>Skill shortcuts</span>
                <strong>{visibleSkillOptions.length} showing</strong>
              </div>
              <div className="discovery-suggestion-grid">
                {visibleSkillOptions.map((skill) => (
                  <button
                    type="button"
                    key={skill}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectSkillSuggestion(skill)}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters — People mode only */}
        {searchMode === 'people' && (
          <div className="discovery-filter-grid">
            <div className="discovery-filter-group">
              <span>Browse by role</span>
              <div>
                {professions.map((profession) => (
                  <button
                    type="button"
                    key={profession}
                    onClick={() => selectProfession(profession)}
                    className={activeProfession === profession ? 'active' : ''}
                  >
                    {profession}
                  </button>
                ))}
              </div>
            </div>

            <div className="discovery-filter-group">
              <span>Rank filter</span>
              <div>
                {ranks.map((rank) => (
                  <button
                    type="button"
                    key={rank}
                    onClick={() => setActiveRank(rank)}
                    className={activeRank === rank ? 'active' : ''}
                  >
                    {rank}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Stats — People mode only */}
      {searchMode === 'people' && (
        <section className="discovery-stats-grid" aria-label="Discovery summary">
          <div className="discovery-stat-card"><span>Showing</span><strong>{publishedCreators}</strong></div>
          <div className="discovery-stat-card is-green"><span>High rank</span><strong>{highRankCount}</strong></div>
          <div className="discovery-stat-card is-blue"><span>Video ready</span><strong>{videoReadyCount}</strong></div>
          <div className="discovery-stat-card is-orange"><span>Roles</span><strong>{Math.max(professions.length - 1, 0)}</strong></div>
        </section>
      )}

      {/* ── People Results Board ── */}
      {searchMode === 'people' && (
        <section className="discovery-board">
          <div className="discovery-board-header">
            <div>
              <div className="discovery-kicker"><FiTarget size={15} /><span>Creator Market</span></div>
              <h2>Available freelancers</h2>
            </div>
            <span>{filteredFreelancers.length} creators</span>
          </div>

          {loading ? (
            <div className="discovery-loader">
              <PremiumLoader bare size="small" />
              <p>Synchronizing talent pool...</p>
            </div>
          ) : filteredFreelancers.length > 0 ? (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="talent-grid">
              {filteredFreelancers.map((freelancer) => (
                <TalentCard
                  key={freelancer._id}
                  freelancer={freelancer}
                  itemVariants={itemVariants}
                  onHire={() => setHireModal({
                    show: true,
                    freelancerId: freelancer._id,
                    freelancerName: toDisplayText(freelancer.name, 'Creator'),
                    freelancerRank: toDisplayText(freelancer.rank, 'Bronze'),
                  })}
                />
              ))}
            </motion.div>
          ) : (
            <div className="discovery-empty-state">
              <FiTarget size={34} />
              <h2>No freelancers found</h2>
              <p>Try another role, rank, or skill keyword to widen the creator search.</p>
            </div>
          )}
        </section>
      )}

      {/* ── Posts Results Board ── */}
      {searchMode === 'posts' && (
        <section className="discovery-board">
          <div className="discovery-board-header">
            <div>
              <div className="discovery-kicker"><FiFileText size={15} /><span>Post Search</span></div>
              <h2>{searchQuery ? `ผลลัพธ์สำหรับ "${searchQuery}"` : 'ค้นหาเนื้อหาโพสต์'}</h2>
            </div>
            {postResults.length > 0 && <span>{postResults.length} โพสต์</span>}
          </div>

          {postsLoading ? (
            <div className="discovery-loader">
              <PremiumLoader bare size="small" />
              <p>กำลังค้นหา...</p>
            </div>
          ) : !searchQuery.trim() ? (
            <div className="discovery-empty-state">
              <FiSearch size={34} />
              <h2>พิมพ์คำค้นหาเพื่อเริ่มต้น</h2>
              <p>ค้นหาจากเนื้อหาโพสต์ หรือชื่อผู้โพสต์บนแพลตฟอร์ม</p>
            </div>
          ) : postResults.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {postResults.map((post) => (
                <PostCard key={post._id} post={post} itemVariants={itemVariants} />
              ))}
            </motion.div>
          ) : (
            <div className="discovery-empty-state">
              <FiFileText size={34} />
              <h2>ไม่พบโพสต์</h2>
              <p>ลองเปลี่ยนคำค้นหาใหม่</p>
            </div>
          )}
        </section>
      )}

      <AnimatePresence>
        {hireModal.show && (
          <HireModal
            freelancerId={hireModal.freelancerId}
            freelancerName={hireModal.freelancerName}
            freelancerRank={hireModal.freelancerRank}
            currentToken={currentToken}
            onClose={() => setHireModal({ ...hireModal, show: false })}
          />
        )}
        </AnimatePresence>
      </main>
      <Footer />
    </>
  );
}

function TalentCard({ freelancer, itemVariants, onHire }) {
  const profileImage = freelancer.profileImage?.url || (typeof freelancer.profileImage === 'string' ? freelancer.profileImage : '');
  const skills = freelancer.skills || [];
  const name = toDisplayText(freelancer.name, 'Unnamed creator');
  const rank = toDisplayText(freelancer.rank, 'Bronze');
  const profession = toDisplayText(freelancer.profession, 'Creative');
  const getSkillLabel = (skill) => {
    return toDisplayText(skill, 'Skill');
  };

  return (
    <motion.article variants={itemVariants} className="talent-card">
      <div className="talent-card-top">
        <ProfileFrame rank={rank} points={freelancer.points || 0} size="78px">
          <div className="talent-avatar">
            {profileImage ? (
              <img src={getFullUrl(profileImage)} alt={name} />
            ) : (
              <FiUsers size={26} />
            )}
          </div>
        </ProfileFrame>
        <span className="talent-rank">{rank}</span>
      </div>

      <div className="talent-card-body">
        <Link to={`/profile/${freelancer._id}`}>
          <h3>{name}</h3>
        </Link>
        <p>{profession}</p>

        <div className="talent-skills">
          {skills.slice(0, 3).map((skill, index) => {
            const label = getSkillLabel(skill);
            return <span key={`${label}-${index}`}>{label}</span>;
          })}
          {skills.length > 3 && <em>+{skills.length - 3}</em>}
        </div>
      </div>

      <div className="talent-actions">
        <button type="button" onClick={onHire}>
          <FiBriefcase size={15} /> Hire
        </button>
        <Link to={`/profile/${freelancer._id}`} aria-label={`View ${name} profile`}>
          <FiGrid size={16} />
        </Link>
        <Link to={`/profile/${freelancer._id}`} className="talent-profile-link">
          Profile <FiArrowRight size={14} />
        </Link>
      </div>
    </motion.article>
  );
}

function PostCard({ post, itemVariants }) {
  const author = post.author || {};
  const profileImage = author.profileImage?.url || '';
  const authorName = toDisplayText(author.name, 'Unknown');
  const profession = toDisplayText(author.profession, '');
  const content = post.content || '';
  const preview = content.length > 150 ? content.slice(0, 150) + '...' : content;
  const thumbnail = post.media?.[0]?.url;
  const hasMedia = post.media && post.media.length > 0;
  const mediaCount = post.media?.length || 0;

  const dateStr = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <motion.article
      variants={itemVariants}
      className="discovery-post-card"
    >
      {/* Thumbnail */}
      {thumbnail && (
        <Link to={`/posts/${post._id}`} className="discovery-post-card-thumb">
          <img src={getFullUrl(thumbnail)} alt="" />
          {mediaCount > 1 && (
            <div className="discovery-post-card-count">
              <FiImage size={9} /> {mediaCount}
            </div>
          )}
        </Link>
      )}

      {/* Content */}
      <div className="discovery-post-card-body">
        {/* Author row */}
        <div className="discovery-post-card-author">
          <Link to={`/profile/${author._id}`}>
            <img src={profileImage ? getFullUrl(profileImage) : 'https://via.placeholder.com/32'} alt={authorName} />
          </Link>
          <div className="discovery-post-card-author-info">
            <Link to={`/profile/${author._id}`} className="discovery-post-card-author-name">
              {authorName}
            </Link>
            {profession && (
              <div className="discovery-post-card-author-role">{profession}</div>
            )}
          </div>
          <div className="discovery-post-card-date">
            <FiClock size={11} /> {dateStr}
          </div>
        </div>

        {/* Post content preview */}
        <p className="discovery-post-card-content">{preview}</p>

        {/* CTA */}
        <Link to={`/posts/${post._id}`} className="discovery-post-card-link">
          อ่านโพสต์เต็ม <FiArrowRight size={13} />
        </Link>
      </div>
    </motion.article>
  );
}

export default Discovery;
