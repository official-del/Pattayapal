import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI } from '../utils/api';
import { getFullUrl } from '../utils/mediaUtils';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiSearch, FiUserPlus, FiUserCheck, FiUserX, FiGlobe, FiTarget, FiActivity, FiZap, FiTrash2, FiArrowRight, FiLoader } from 'react-icons/fi';
import ProfileFrame from '../components/ProfileFrame';

function Friends() {
  const { user: contextUser, token: contextToken } = useContext(AuthContext);
  const currentToken = contextToken || localStorage.getItem('userToken') || localStorage.getItem('token');
  const currentUser = contextUser || JSON.parse(localStorage.getItem('userInfo'));

  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState(new Set());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const myId = currentUser?._id || currentUser?.id;
        if (!myId || !currentToken) return;

        const profileData = await usersAPI.getPublicProfile(myId);
        setFriends(profileData.user?.friends || []);

        const reqs = await usersAPI.getMyFriendRequests(currentToken);
        setFriendRequests(reqs);
      } catch (err) {
        console.error('Friends load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, [currentToken]);

  const acceptRequest = async (requesterId, requesterName, requesterAvatar) => {
    try {
      await usersAPI.respondFriendRequest(requesterId, 'accept', currentToken);
      setFriendRequests(prev => prev.filter(r => r.from._id !== requesterId));
      setFriends(prev => [...prev, { _id: requesterId, name: requesterName, profileImage: requesterAvatar }]);
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + (err?.response?.data?.message || err.message));
    }
  };

  const rejectRequest = async (requesterId) => {
    try {
      await usersAPI.respondFriendRequest(requesterId, 'reject', currentToken);
      setFriendRequests(prev => prev.filter(r => r.from._id !== requesterId));
    } catch (err) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const removeFriend = async (friendId, friendName) => {
    if (!window.confirm(`ยืนยันการยกเลิกเพื่อนกับ ${friendName}?`)) return;
    try {
      await usersAPI.removeFriend(friendId, currentToken);
      setFriends(prev => prev.filter(f => f._id !== friendId));
    } catch (err) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const results = await usersAPI.searchUsers(query, currentToken);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const sendFriendRequest = async (targetId) => {
    try {
      await usersAPI.sendFriendRequest(targetId, currentToken);
      setSentRequests(prev => new Set([...prev, targetId]));
    } catch (err) {
      alert(err?.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  if (loading && !friends.length) {
    return (
      <div style={{ background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '40px', height: '40px', border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        <p style={{ color: '#444', fontWeight: '700', letterSpacing: '4px', fontSize: '0.8rem' }}>กำลังเชื่อมต่อเครือข่ายสมาชิก...</p>
      </div>
    );
  }

  const friendIds = new Set(friends.map(f => f._id));

  const tabs = [
    { id: 'search', label: 'ค้นหาและเพิ่มเพื่อน', icon: <FiSearch /> },
    { id: 'requests', label: `คำขอที่รออยู่ (${friendRequests.length})`, icon: <FiUserPlus /> },
    { id: 'friends', label: `รายชื่อเพื่อน (${friends.length})`, icon: <FiUsers /> },
  ];

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', paddingBottom: '150px' }}>

      {/* 🔮 Hero Header */}
      <section style={{ padding: '150px 5% 60px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <FiGlobe color="var(--accent)" size={18} />
            <span style={{ color: 'var(--accent)', fontWeight: '700', letterSpacing: '5px', fontSize: '0.8rem' }}>World Citizens</span>
          </div>
          <h1 style={{ fontSize: '4.5rem', fontWeight: '700', margin: 0, letterSpacing: '-2px', lineHeight: 1, marginTop: '30px' }}>รายชื่อสมาชิก</h1>
          <p style={{ color: '#444', marginTop: '15px', fontWeight: '700', fontSize: '1.1rem' }}>สร้างเครือข่ายและเชื่อมต่อกับครีเอเตอร์ทั่วประเทศ</p>
        </motion.div>
      </section>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 5%' }}>

        {/* 🧬 Interactive Tabs */}
        <div className="friends-tabs">
          {tabs.map(tab => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'var(--accent)' : 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? '#fff' : '#444',
                padding: '16px 30px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: '0.3s',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {tab.icon} {tab.label}
            </motion.button>
          ))}
        </div>

        {/* 🧪 Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
          >
            {/* 🔍 Content: Search */}
            {activeTab === 'search' && (
              <div>
                <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto 60px' }}>
                  <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '10px 30px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <FiSearch color="#444" size={24} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => handleSearch(e.target.value)}
                      placeholder="ค้นหาชื่อสมาชิก..."
                      style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', padding: '15px 0', outline: 'none', fontWeight: '700' }}
                    />
                    {searchLoading && <FiLoader className="spin" color="var(--accent)" />}
                  </div>
                </div>

                {searchResults.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 400px), 1fr))', gap: '25px' }}>
                    {searchResults.map(user => {
                      const isFriend = friendIds.has(user._id);
                      const isSent = sentRequests.has(user._id);
                      return (
                        <motion.div variants={itemVariants} key={user._id} className="glass friends-row-card">
                          <ProfileFrame rank={user.rank} size="70px">
                            <img src={user.profileImage?.url ? getFullUrl(user.profileImage.url) : 'https://via.placeholder.com/70'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </ProfileFrame>
                          <div style={{ flex: 1 }}>
                            <Link to={`/profile/${user._id}`} style={{ textDecoration: 'none', color: '#fff', fontSize: '1.3rem', fontWeight: '700', letterSpacing: '-0.5px' }}>{user.name}</Link>
                            <p style={{ color: 'var(--accent)', margin: '4px 0 0', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{user.profession || 'MEMBER'}</p>
                            
                            {user.skills && user.skills.length > 0 && (
                              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                                {user.skills.slice(0, 3).map((skill, sIdx) => (
                                  <span key={sIdx} style={{ fontSize: '0.6rem', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', color: '#666', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    {skill.name}
                                  </span>
                                ))}
                                {user.skills.length > 3 && <span style={{ color: '#222', fontSize: '0.6rem' }}>+{user.skills.length - 3}</span>}
                              </div>
                            )}
                          </div>
                          <div>
                            {isFriend ? (
                              <span style={{ color: '#22c55e', fontWeight: '700', fontSize: '0.8rem' }}>✓ เพื่อนกัน</span>
                            ) : isSent ? (
                              <span style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '0.8rem' }}>ส่งคำขอแล้ว</span>
                            ) : (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                onClick={() => sendFriendRequest(user._id)}
                                style={{ background: 'var(--accent)', color: '#fff', border: 'none', width: '45px', height: '45px', borderRadius: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 5px 15px var(--accent-glow)' }}
                              >
                                <FiUserPlus size={20} />
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '100px' }}>
                    <FiTarget size={60} color="#111" />
                    <p style={{ color: '#222', fontWeight: '700', marginTop: '20px', letterSpacing: '2px' }}>ค้นพบบุคคลที่น่าสนใจและเริ่มความร่วมมือใหม่</p>
                  </div>
                )}
              </div>
            )}

            {/* 📩 Content: Requests */}
            {activeTab === 'requests' && (
              <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                {friendRequests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '100px' }}>
                    <FiUserPlus size={60} color="#111" />
                    <p style={{ color: '#222', fontWeight: '700', marginTop: '20px' }}>ยังไม่มีคำขอเป็นเพื่อนในเวฟนี้</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {friendRequests.map(req => (
                      <motion.div variants={itemVariants} key={req._id} className="glass" style={{ padding: '30px', borderRadius: '35px', display: 'flex', alignItems: 'center', gap: '25px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <ProfileFrame rank={req.from.rank} size="60px">
                          <img src={req.from.profileImage?.url ? getFullUrl(req.from.profileImage.url) : 'https://via.placeholder.com/60'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </ProfileFrame>
                        <div style={{ flex: 1 }}>
                          <Link to={`/profile/${req.from._id}`} style={{ textDecoration: 'none', color: '#fff', fontSize: '1.2rem', fontWeight: '700' }}>{req.from.name}</Link>
                          <p style={{ color: '#444', margin: '4px 0 0', fontWeight: '700' }}>ต้องการเป็นเพื่อนกับคุณ</p>
                        </div>
                        <div style={{ display: 'flex', gap: '15px' }}>
                          <motion.button onClick={() => acceptRequest(req.from._id, req.from.name, req.from.profileImage)} whileHover={{ scale: 1.05 }} style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '20px', fontWeight: '700', cursor: 'pointer' }}>ยืนยัน</motion.button>
                          <motion.button onClick={() => rejectRequest(req.from._id)} whileHover={{ scale: 1.05 }} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 25px', borderRadius: '20px', fontWeight: '700', cursor: 'pointer' }}>ลบ</motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 👥 Content: Friends List */}
            {activeTab === 'friends' && (
              <div>
                {friends.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '100px' }}>
                    <FiUsers size={60} color="#111" />
                    <p style={{ color: '#222', fontWeight: '700', marginTop: '20px' }}>คุณยังไม่มีรายชื่อเพื่อนในระบบ</p>
                    <button onClick={() => setActiveTab('search')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: '700', marginTop: '10px', cursor: 'pointer' }}>ค้นหาเพื่อนใหม่เลย →</button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
                    {friends.map(friend => (
                      <motion.div variants={itemVariants} key={friend._id} className="glass" style={{ padding: '40px 30px', borderRadius: '40px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.03)', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                          <FiActivity color="#222" size={14} />
                        </div>
                        <ProfileFrame rank={friend.rank} size="100px">
                          <img src={friend.profileImage?.url ? getFullUrl(friend.profileImage.url) : 'https://via.placeholder.com/100'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </ProfileFrame>
                        <h4 style={{ margin: '25px 0 5px', fontSize: '1.4rem', fontWeight: '700', letterSpacing: '-0.5px' }}>{friend.name}</h4>
                        <p style={{ color: '#444', fontWeight: '700', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '30px' }}>{friend.profession || 'MEMBER'}</p>

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <Link to={`/profile/${friend._id}`} style={{ flex: 1, textDecoration: 'none', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', padding: '14px', borderRadius: '15px', fontWeight: '700', fontSize: '0.8rem', transition: '0.3s' }}>โปรไฟล์</Link>
                          <motion.button onClick={() => removeFriend(friend._id, friend.name)} whileHover={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#444', width: '50px', borderRadius: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s' }}>
                            <FiTrash2 />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .friends-tabs {
          display: flex; gap: 15px; margin-bottom: 60px; overflow-x: auto; padding-bottom: 10px;
          scroll-behavior: smooth;
        }
        .friends-tabs::-webkit-scrollbar { display: none; }
        .friends-tabs { -ms-overflow-style: none; scrollbar-width: none; }

        .friends-row-card {
          padding: 30px; border-radius: 35px; display: flex; align-items: center; gap: 25px; border: 1px solid rgba(255,255,255,0.03);
        }

        @media (max-width: 768px) {
          .friends-row-card {
            flex-direction: column;
            text-align: center;
            gap: 15px;
          }
          h1 { font-size: 2.5rem !important; }
        }
      `}</style>
    </div>
  );
}

export default Friends;
