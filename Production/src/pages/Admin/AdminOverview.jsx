import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { worksAPI, usersAPI } from '../../utils/api';
import { CONFIG } from '../../utils/config';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { FiTrendingUp, FiUsers, FiLayers, FiArrowLeft, FiActivity } from 'react-icons/fi';

function AdminOverview({ embedded = false }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, totalViews: 0, videos: 0, images: 0 });
  const [topWorksData, setTopWorksData] = useState([]); 
  const [topViewedChart, setTopViewedChart] = useState([]); 
  const [proStats, setProStats] = useState({ topByWorks: [], topByFriends: [], growthStats: [] });
  const [loading, setLoading] = useState(true);

  const COLORS = {
    primary: '#ff6b35',
    primaryGlow: 'rgba(255, 107, 53, 0.4)',
    bg: '#050505',
    cardBg: 'rgba(18, 18, 18, 0.7)',
    border: 'rgba(255, 255, 255, 0.08)',
    textMain: '#ffffff',
    textSub: '#888888',
    success: '#00e676',
    warning: '#ffea00',
    info: '#00b0ff'
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('userToken');
        const [resWorks, resAdmin] = await Promise.all([
          worksAPI.getAll(),
          usersAPI.getAdminStats(token).catch(() => ({ topByWorks: [], topByFriends: [], growthStats: [] }))
        ]);

        const allWorks = resWorks.works || resWorks || [];
        setProStats(resAdmin);

        let viewsCount = 0; let videoCount = 0; let imageCount = 0; let publishedCount = 0;

        allWorks.forEach(work => {
          viewsCount += (work.views || 0);
          if (work.status === 'published') publishedCount++;
          const isVideo = work.type === 'video' || /\.(mp4|webm|ogg|mov)$/i.test(work.mediaUrl || "");
          if (isVideo) videoCount++; else imageCount++;
        });

        setStats({ 
          total: allWorks.length, 
          published: publishedCount, 
          drafts: allWorks.length - publishedCount, 
          totalViews: viewsCount, 
          videos: videoCount, 
          images: imageCount 
        });

        const sortedByViews = [...allWorks]
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, 10);

        setTopWorksData(sortedByViews);
        setTopViewedChart(sortedByViews.map(w => ({
          name: w.title.length > 12 ? w.title.substring(0, 12) + '..' : w.title,
          views: w.views || 0,
          fullName: w.title 
        })));

      } catch (err) { console.error("Error fetching overview data:", err); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const glassCard = {
    background: COLORS.cardBg,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '24px',
    padding: '32px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  };

  if (loading) return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="loader-orbit">
        <div className="inner-orbit"></div>
        <p style={{ color: COLORS.primary, marginTop: '20px', letterSpacing: '4px', fontWeight: '700' }}>PATTAYA PAL</p>
      </div>
    </div>
  );

  return (
    <div style={embedded ? { fontFamily: "'Inter', sans-serif" } : { padding: '40px 60px', color: COLORS.textMain, background: COLORS.bg, minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      
      {!embedded && (
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700', letterSpacing: '-1.5px' }}>Platform <span style={{color: COLORS.primary}}>Analytics</span></h1>
            <p style={{ margin: '5px 0 0 0', color: COLORS.textSub, fontWeight: '500', fontSize: '0.9rem' }}>REAL-TIME BUSINESS INTELLIGENCE & INSIGHTS</p>
          </div>
          <button onClick={() => navigate('/admin/dashboard')} className="btn-modern-back">
            <FiArrowLeft /> BACK TO MANAGER
          </button>
        </header>
      )}

      <div className="bento-grid">
        
        {/* 🏆 1. TOP 10 VISUALS CHART */}
        <div style={{ ...glassCard, gridArea: 'chart' }}>
          <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700' }}><FiActivity style={{color: COLORS.primary, marginRight: '10px'}}/> Top Performance Leaderboard</h3>
                <p style={{ color: COLORS.textSub, fontSize: '0.8rem' }}>ENGAGEMENT BY VIEWS</p>
             </div>
             <div className="live-indicator">LIVE</div>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={topViewedChart}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.primary} stopOpacity={1}/>
                    <stop offset="100%" stopColor="#80361b" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" stroke={COLORS.textSub} fontSize={11} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: `1px solid ${COLORS.primary}`, borderRadius: '12px' }}
                  itemStyle={{ color: COLORS.primary, fontWeight: '700' }}
                />
                <Bar dataKey="views" radius={[6, 6, 0, 0]} barSize={40} fill="url(#barGradient)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 📊 2. STATS CARDS */}
        <div style={{ ...glassCard, gridArea: 'stat1' }}>
          <p style={{ color: COLORS.textSub, fontSize: '0.75rem', fontWeight: 'bold' }}>TOTAL ASSETS</p>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', margin: '10px 0' }}>{stats.total}</div>
          <div style={{ fontSize: '0.8rem', color: COLORS.success }}>● {stats.published} Active</div>
        </div>

        <div style={{ ...glassCard, gridArea: 'stat2' }}>
          <p style={{ color: COLORS.textSub, fontSize: '0.75rem', fontWeight: 'bold' }}>LIFETIME VIEWS</p>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', color: COLORS.info, margin: '10px 0' }}>{stats.totalViews.toLocaleString()}</div>
          <div style={{ height: '4px', background: '#222', borderRadius: '10px', marginTop: '10px' }}><div style={{ width: '100%', height: '100%', background: COLORS.info, borderRadius: '10px' }}></div></div>
        </div>

        <div style={{ ...glassCard, gridArea: 'stat3' }}>
          <p style={{ color: COLORS.textSub, fontSize: '0.75rem', fontWeight: 'bold' }}>MEDIA SPLIT</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>🎬 {stats.videos} / 📷 {stats.images}</div>
            <div style={{ width: '50px', height: '50px' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={[{v:stats.videos},{v:stats.images}]} innerRadius={15} outerRadius={25} dataKey="v" stroke="none">
                    <Cell fill={COLORS.info} /><Cell fill={COLORS.primary} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 🏆 3. TOP RANKING */}
        <div style={{ ...glassCard, gridArea: 'rankings' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}><FiTrendingUp style={{marginRight: '10px', color: COLORS.warning}}/> Top Creators</h3>
            <p style={{ color: COLORS.textSub, fontSize: '0.75rem' }}>MOST WORKS UPLOADED</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {proStats.topByWorks.map((user, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                <div style={{ fontWeight: '700', color: idx === 0 ? COLORS.warning : COLORS.textSub, width: '20px' }}>{idx+1}</div>
                <img src={user.profileImage?.url ? `${CONFIG.API_BASE_URL}/${user.profileImage.url}` : 'https://via.placeholder.com/40'} alt="" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {user.name}
                    {user.rank && (
                      <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: COLORS.warning, fontWeight: '800' }}>
                        {user.rank.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: COLORS.textSub }}>{user.worksCount} Works {user.points ? `• ${user.points} PTS` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 📈 4. GROWTH CHART */}
        <div style={{ ...glassCard, gridArea: 'growth' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}><FiUsers style={{marginRight: '10px', color: COLORS.success}}/> User Growth</h3>
            <p style={{ color: COLORS.textSub, fontSize: '0.75rem' }}>MONTHLY REGISTRATIONS</p>
          </div>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={proStats.growthStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" stroke={COLORS.textSub} fontSize={10} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#000', border: '1px solid #333' }} />
                <Line type="monotone" dataKey="users" stroke={COLORS.success} strokeWidth={3} dot={{ r: 4, fill: COLORS.success }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <style>{`
        .bento-grid {
          display: grid;
          grid-template-areas: 
            "chart chart chart"
            "stat1 stat2 stat3"
            "rankings growth growth";
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
        }
        .live-indicator {
          background: rgba(0, 230, 118, 0.1); color: ${COLORS.success};
          padding: 4px 12px; border-radius: 50px; font-size: 0.65rem; font-weight: 700;
          border: 1px solid ${COLORS.success}; animation: pulse 2s infinite;
        }
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
        .btn-modern-back {
          background: #fff; color: #000; border: none; padding: 10px 20px; border-radius: 10px; 
          font-weight: 800; font-size: 0.75rem; cursor: pointer; transition: 0.3s;
          display: flex; alignItems: center; gap: 8px;
        }
        .btn-modern-back:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(255,255,255,0.2); }
        .loader-orbit { text-align: center; }
        .inner-orbit { 
          width: 30px; height: 30px; border: 2px solid #222; border-top: 2px solid ${COLORS.primary}; 
          border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @media (max-width: 1100px) {
          .bento-grid { grid-template-areas: "chart chart" "stat1 stat2" "stat3 rankings" "growth growth"; grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}

export default AdminOverview;