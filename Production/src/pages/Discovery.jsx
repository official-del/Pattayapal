import { useState, useEffect, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usersAPI } from '../utils/api';
import { getFullUrl } from '../utils/mediaUtils';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiFilter, FiZap, FiTarget, FiLoader, FiArrowRight, FiCheckCircle,
  FiUserPlus, FiAward, FiMessageSquare, FiBriefcase, FiUsers, FiStar, FiGrid, FiArrowUpRight
} from 'react-icons/fi';
import ProfileFrame from '../components/ProfileFrame';
import HireModal from '../components/HireModal';
import { play8BitSuccess } from '../utils/soundEffects';
import { PRODUCTION_SKILLS } from './UserProfile';

function Discovery() {
  const { user: contextUser, token: contextToken } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const currentToken = contextToken || localStorage.getItem('userToken');
  const currentUser = contextUser || JSON.parse(localStorage.getItem('userInfo') || '{}');

  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeProfession, setActiveProfession] = useState('All');
  const [activeRank, setActiveRank] = useState('All');

  // Hire Modal State
  const [hireModal, setHireModal] = useState({ show: false, freelancerId: null, freelancerName: '' });

  const professions = ['All', 'Photographer', 'Editor', 'Videographer', 'Director', 'Production Design', 'Creative Content', 'Film Production', 'Post Production', 'Digital Artist', 'AI Operations'];
  const ranks = ['All', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const profParam = searchParams.get('profession');
      const rankParam = searchParams.get('rank');

      try {
        if (profParam) {
          setActiveProfession(profParam);
          const q = profParam === 'All' ? '' : profParam;
          const results = await usersAPI.searchUsers(q, currentToken);
          setFreelancers(results);
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

  const fetchInitialFreelancers = async () => {
    setLoading(true);
    try {
      // Fetch without query to get initial discovery set (now supported by backend)
      const results = await usersAPI.searchUsers('', currentToken);
      setFreelancers(results);
    } catch (err) {
      console.error('Initial discovery error:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectProfession = async (prof) => {
    setActiveProfession(prof);
    setSearchLoading(true);
    try {
      const q = prof === 'All' ? '' : prof;
      const results = await usersAPI.searchUsers(q, currentToken);
      setFreelancers(results);
    } catch (err) {
      console.error('Prof discovery error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectRank = (rank) => {
    setActiveRank(rank);
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    setSearchLoading(true);
    try {
      const results = await usersAPI.searchUsers(query, currentToken);
      setFreelancers(results);
    } catch (err) {
      console.error('Discovery search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const filteredFreelancers = freelancers.filter(f => {
    // 🚫 Block admins & normal users without a specific profession
    if (f.role === 'admin') return false;
    const hasProfession = f.profession && f.profession.toLowerCase() !== 'general';
    if (f.role !== 'freelancer' && !hasProfession) return false;

    const profMatch = activeProfession === 'All' || f.profession === activeProfession;
    const rankMatch = activeRank === 'All' || f.rank === activeRank;
    return profMatch && rankMatch;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', damping: 20 } }
  };

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', paddingBottom: '150px' }}>

      {/* 🚀 Immersive Hero Section */}
      <section style={{
        position: 'relative', height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', padding: '0 5%', background: 'radial-gradient(circle at 50% 50%, #111 0%, #000 100%)'
      }}>
        {/* Animated Background Elements */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 10, repeat: Infinity }}
          style={{ position: 'absolute', width: '800px', height: '800px', background: 'var(--accent)', borderRoll: '50%', filter: 'blur(200px)', zIndex: 0 }}
        />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '1000px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '25px' }}>
              <FiZap color="var(--accent)" size={20} />
              <span style={{ color: 'var(--accent)', fontWeight: '700', letterSpacing: '4px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Talent Discovery</span>
            </div>
            <h1 className="discovery-title" style={{ fontWeight: '900', margin: 0, letterSpacing: '-3px', lineHeight: 1.1, textTransform: 'uppercase' }}>DISCOVER THE FUTURE OF <span style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 15px var(--accent-glow))' }}>CREATION</span></h1>
            <p style={{ color: '#888', marginTop: '30px', fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', fontWeight: '400', maxWidth: '700px', margin: '30px auto', lineHeight: 1.6 }}>เชื่อมต่อกับครีเอเตอร์ระดับแนวหน้าของพัทยา ค้นหาพาร์ทเนอร์ที่ใช่สำหรับโปรเจกต์ถัดไปของคุณ</p>
          </motion.div>

          {/* 🔍 Global Professional Search Engine */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ position: 'relative', maxWidth: '800px', margin: '40px auto 0' }}
          >
            <div className="discovery-search-box glass">
              <div className="search-icon-wrapper" style={{ padding: '0 25px' }}><FiSearch size={22} color="var(--accent)" /></div>
              <input
                type="text"
                className="discovery-input"
                list="discovery-skills"
                placeholder="ค้นหาทักษะ, ตำแหน่งงาน หรือชื่อฟรีแลนซ์..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <datalist id="discovery-skills">
                {PRODUCTION_SKILLS.map(skill => (
                  <option key={skill} value={skill} />
                ))}
              </datalist>
              {searchLoading && <FiLoader size={20} className="spin" style={{ marginRight: '20px' }} />}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="discovery-btn"
                onClick={() => handleSearch(searchQuery)}
              >
                INITIALIZE SEARCH
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 🧬 Advanced Filter System */}
      <section style={{ padding: '60px 5% 0', maxWidth: '1440px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', justifyContent: 'space-between' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: '700', letterSpacing: '4px' }}>PROFESSIONAL FILTER</span>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {professions.map(p => (
                <button
                  key={p}
                  onClick={() => selectProfession(p)}
                  className={activeProfession === p ? 'filter-active' : 'filter-inactive'}
                  style={{
                    padding: '12px 24px', borderRadius: '15px', border: '1px solid', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', transition: '0.3s'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: '700', letterSpacing: '4px' }}>RANK EXCLUSIVITY</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              {ranks.map(r => (
                <button
                  key={r}
                  onClick={() => selectRank(r)}
                  style={{
                    padding: '0 12px', height: '40px', borderRadius: '12px', background: activeRank === r ? 'var(--accent-glow)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${activeRank === r ? 'var(--accent)' : 'rgba(255,255,255,0.05)'}`, color: activeRank === r ? '#fff' : '#444',
                    fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    minWidth: '40px'
                  }}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 📊 Discovery Grid */}
      <section style={{ padding: '80px 5%', maxWidth: '1440px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <FiLoader size={50} className="spin" color="var(--accent)" />
            <p style={{ marginTop: '20px', color: '#666', letterSpacing: '4px', fontWeight: '700', fontSize: '0.8rem' }}>SYNCHRONIZING TALENT POOL...</p>
          </div>
        ) : filteredFreelancers.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', gap: '30px' }}
          >
            {filteredFreelancers.map((freelancer) => (
              <motion.div
                key={freelancer._id}
                variants={itemVariants}
                className="talent-card glass"
                style={{ borderRadius: '35px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)', transition: '0.4s' }}
              >
                <div style={{ padding: '35px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                    <ProfileFrame rank={freelancer.rank} size="90px">
                      <div style={{ width: '100%', height: '100%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {freelancer.profileImage?.url || (typeof freelancer.profileImage === 'string' && freelancer.profileImage) ? (
                          <img
                            src={getFullUrl(freelancer.profileImage.url || freelancer.profileImage)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div style={{ display: (freelancer.profileImage?.url || typeof freelancer.profileImage === 'string') ? 'none' : 'flex' }}>
                          <FiUsers size={30} color="#444" />
                        </div>
                      </div>
                    </ProfileFrame>
                    <div style={{ textAlign: 'right' }}>
                      <span className="rank-label" style={{
                        fontSize: '0.65rem', fontWeight: '700', padding: '6px 12px', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.05)', color: 'var(--accent)', border: '1px solid var(--accent-glow)'
                      }}>
                        {freelancer.rank.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <Link to={`/profile/${freelancer._id}`} style={{ textDecoration: 'none' }}>
                    <h3 style={{ fontSize: '1.8rem', color: '#fff', margin: '0 0 5px 0', fontWeight: '700', letterSpacing: '-0.5px' }}>{freelancer.name}</h3>
                  </Link>
                  <p style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>{freelancer.profession || 'CREATIVE'}</p>

                  {/* Skill Badge Cloud */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '30px' }}>
                    {(freelancer.skills || []).slice(0, 3).map((skill, idx) => (
                      <span key={idx} style={{
                        fontSize: '0.7rem', padding: '6px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)', color: '#888', fontWeight: '600'
                      }}>
                        {skill.name}
                      </span>
                    ))}
                    {(freelancer.skills?.length > 3) && <span style={{ fontSize: '0.7rem', color: '#444', alignSelf: 'center', fontWeight: '700' }}>+{freelancer.skills.length - 3}</span>}
                  </div>

                  <div style={{ display: 'flex', gap: '15px' }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setHireModal({ show: true, freelancerId: freelancer._id, freelancerName: freelancer.name })}
                      style={{
                        flex: 2, background: 'var(--accent)', color: '#fff', border: 'none', padding: '18px',
                        borderRadius: '20px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer',
                        boxShadow: '0 10px 20px var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                      }}
                    >
                      HIRE TALENT <FiArrowRight size={18} />
                    </motion.button>

                    <Link to={`/profile/${freelancer._id}`} style={{ flex: 1 }}>
                      <motion.button
                        whileHover={{ background: 'rgba(255,255,255,0.05)' }}
                        style={{
                          width: '100%', height: '100%', background: 'transparent', color: '#fff',
                          border: '1px solid rgba(255,255,255,0.1)', padding: '18px', borderRadius: '20px',
                          fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <FiGrid size={18} />
                      </motion.button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <FiTarget size={60} color="#222" />
            <h2 style={{ fontSize: '2.5rem', color: '#fff', fontWeight: '900', marginTop: '30px', letterSpacing: '-1px' }}>EXCEPTION: NO TALENT DETECTED</h2>
            <p style={{ color: '#666', fontWeight: '500' }}>ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองเพื่อค้นหาครีเอเตอร์ที่คุณต้องการ</p>
          </div>
        )}
      </section>

      {/* 🛒 Modular Overlay components */}
      <AnimatePresence>
        {hireModal.show && (
          <HireModal
            freelancerId={hireModal.freelancerId}
            freelancerName={hireModal.freelancerName}
            currentToken={currentToken}
            onClose={() => setHireModal({ ...hireModal, show: false })}
          />
        )}
      </AnimatePresence>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .talent-card:hover { transform: translateY(-15px) scale(1.02); border-color: var(--accent-glow); box-shadow: 0 40px 80px rgba(0,0,0,0.8); }
        
        .filter-active { background: var(--accent); color: #fff; border-color: var(--accent); box-shadow: 0 0 25px var(--accent-glow); }
        .filter-inactive { background: rgba(255,255,255,0.03); color: #888; border-color: rgba(255,255,255,0.05); }
        .filter-inactive:hover { background: rgba(255,255,255,0.08); color: #fff; border-color: rgba(255,255,255,0.1); }

        input::placeholder { color: #444; text-overflow: ellipsis; }

        /* Responsive Hero Styles */
        .discovery-title { font-size: clamp(2.5rem, 8vw, 5rem); }
        .discovery-search-box {
          padding: 8px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; background: rgba(255,255,255,0.02);
        }
        .discovery-input {
          flex: 1; background: none; border: none; color: #fff; font-size: 1.1rem; padding: 18px 0; outline: none; font-weight: 500; min-width: 0;
        }
        .discovery-btn {
          background: var(--accent); color: #fff; border: none; padding: 15px 35px; border-radius: 40px; font-weight: 700; font-size: 0.9rem; cursor: pointer; box-shadow: 0 0 20px var(--accent-glow); flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .discovery-title { font-size: 2.5rem; }
          .discovery-search-box { 
            flex-direction: column; border-radius: 30px; padding: 20px 15px; gap: 15px; 
          }
          .search-icon-wrapper { display: none; }
          .discovery-input { text-align: center; padding: 5px 0; font-size: 1rem; width: 100%; box-sizing: border-box; }
          .discovery-btn { width: 100%; padding: 18px; border-radius: 20px; }
          section { padding-left: 20px !important; padding-right: 20px !important; }
        }
        @media (max-width: 480px) {
          .discovery-title { font-size: 2rem; }
          .talent-card { border-radius: 25px !important; }
          .talent-card > div { padding: 25px !important; }
        }
      `}</style>

    </div>
  );
}

export default Discovery;
