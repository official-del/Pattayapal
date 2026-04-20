import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiAward, FiTrendingUp, FiDollarSign, FiUsers } from 'react-icons/fi';
import RankBadge from '../components/RankBadge';
import { getFullUrl } from '../utils/mediaUtils';
import { CoinIcon, CoinBadge } from '../components/CoinIcon';

import { CONFIG } from '../utils/config';

const API_BASE_URL = CONFIG.API_BASE_URL;

const Leaderboard = () => {
  const [category, setCategory] = useState('points');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/users/leaderboard?category=${category}`);
        setUsers(res.data);
      } catch (err) {
        console.error("Leaderboard fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [category]);

  const categories = [
    { id: 'points', label: 'แต้มสะสมรวม / GLOBAL POINTS', icon: <FiAward /> },
    { id: 'earnings', label: 'ผู้ทำรายได้สูงสุด / TOP EARNERS', icon: <CoinIcon size={18} /> },
    { id: 'popularity', label: 'ยอดนิยมสูงสุด / MOST POPULAR', icon: <FiTrendingUp /> }

  ];

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', paddingTop: '100px', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '700', margin: '0 0 10px 0', background: 'linear-gradient(to right, #ff5733, #ffbd33)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            HALL OF FAME / ทำเนียบเกียรติยศ
          </h1>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>สุดยอดครีเอเตอร์และผู้ใช้งานที่โดดเด่นที่สุดในเครือข่าย Pattaya Pal</p>

        </div>

        {/* Category Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '40px', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 24px',
                borderRadius: '40px',
                background: category === cat.id ? '#ff5733' : '#111',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '700',
                transition: 'all 0.3s ease',
                boxShadow: category === cat.id ? '0 0 20px rgba(255,87,51,0.3)' : 'none'
              }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div style={{ background: '#0a0a0a', borderRadius: '30px', border: '1px solid #1a1a1a', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '100px', textAlign: 'center', color: '#ff5733' }}>LOADING RANKINGS...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #111' }}>
                    <th style={{ padding: '20px', color: '#444', fontSize: '0.8rem', textTransform: 'uppercase' }}>อันดับ / RANK</th>
                    <th style={{ padding: '20px', color: '#444', fontSize: '0.8rem', textTransform: 'uppercase' }}>ครีเอเตอร์ / CREATOR</th>
                    <th style={{ padding: '20px', color: '#444', fontSize: '0.8rem', textTransform: 'uppercase' }}>ระดับ / TIER</th>
                    <th style={{ padding: '20px', textAlign: 'right', color: '#444', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                      {category === 'earnings' ? 'รายได้ / COINS' : 'แต้ม / POINTS'}
                    </th>

                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr 
                      key={user._id} 
                      style={{ 
                        borderBottom: '1px solid #111', 
                        background: index < 3 ? 'rgba(255,87,51,0.02)' : 'transparent',
                        transition: '0.3s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseOut={e => e.currentTarget.style.background = index < 3 ? 'rgba(255,87,51,0.02)' : 'transparent'}
                    >
                      <td style={{ padding: '20px', fontWeight: '700', fontSize: '1.2rem', color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#444' }}>
                        #{index + 1}
                      </td>
                      <td style={{ padding: '20px' }}>
                        <Link to={`/profile/${user._id}`} style={{ display: 'flex', alignItems: 'center', gap: '15px', textDecoration: 'none' }}>
                          <img 
                            src={user.profileImage?.url ? getFullUrl(user.profileImage.url) : 'https://via.placeholder.com/40'} 
                            alt={user.name}
                            style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #222' }}
                          />
                          <div>
                            <div style={{ color: '#fff', fontWeight: '700' }}>{user.name}</div>
                            <div style={{ color: '#555', fontSize: '0.75rem' }}>{user.profession}</div>
                          </div>
                        </Link>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <RankBadge rank={user.rank} size="sm" showName={true} />
                      </td>
                      <td style={{ padding: '20px', textAlign: 'right', fontWeight: '700', color: category === 'earnings' ? '#f59e0b' : '#fff' }}>
                         {category === 'earnings' ? <CoinBadge amount={user.totalEarnings} size="sm" /> : user.points.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div style={{ padding: '50px', textAlign: 'center', color: '#555' }}>ไม่พบข้อมูลอันดับในหมวดหมู่นี้ / NO DATA FOUND</div>

              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
