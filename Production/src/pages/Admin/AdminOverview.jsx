import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { worksAPI } from '../../utils/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

function AdminOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, totalViews: 0, videos: 0, images: 0 });
  const [topWorksData, setTopWorksData] = useState([]); // สำหรับแสดงในตาราง (เรียงตามวิว)
  const [topViewedChart, setTopViewedChart] = useState([]); // สำหรับแสดงในกราฟ
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
        const res = await worksAPI.getAll();
        const allWorks = res.works || res || [];

        let viewsCount = 0; let videoCount = 0; let imageCount = 0; let publishedCount = 0;

        allWorks.forEach(work => {
          viewsCount += (work.views || 0);
          if (work.status === 'published') publishedCount++;
          const isVideo = work.type === 'video' || /\.(mp4|webm|ogg|mov)$/i.test(work.mediaUrl || "");
          if (isVideo) videoCount++; else imageCount++;
        });

        setStats({ total: allWorks.length, published: publishedCount, drafts: allWorks.length - publishedCount, totalViews: viewsCount, videos: videoCount, images: imageCount });

        // ✅ แก้ไข: เรียงลำดับจากยอดวิว (Views) มากไปน้อย 10 อันดับแรก
        const sortedByViews = [...allWorks]
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, 10);

        setTopWorksData(sortedByViews);

        // ✅ เตรียมข้อมูลสำหรับกราฟจากชุดข้อมูลที่เรียงแล้ว
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
        <p style={{ color: COLORS.primary, marginTop: '20px', letterSpacing: '4px', fontWeight: '900' }}>PATTAYA PAL</p>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '40px 60px', color: COLORS.textMain, background: COLORS.bg, minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ── HEADER ── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1.5px' }}>Performance <span style={{ color: COLORS.primary }}>Analytics</span></h1>
          <p style={{ margin: '5px 0 0 0', color: COLORS.textSub, fontWeight: '500', fontSize: '0.9rem' }}>TOP 10 PERFORMANCE LEADERS & INSIGHTS</p>
        </div>
        <button onClick={() => navigate('/admin/dashboard')} className="btn-modern-back">
          ← BACK TO MANAGER
        </button>
      </header>

      <div className="bento-grid">

        {/* 🏆 1. TOP 10 CHART (FULL WIDTH TOP) */}
        <div style={{ ...glassCard, gridArea: 'chart' }}>
          <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900' }}><span style={{ color: COLORS.primary }}>🏆</span> Top 10 Performance Chart</h3>
              <p style={{ color: COLORS.textSub, fontSize: '0.8rem' }}>RANKED BY VIEWS ENGAGEMENT</p>
            </div>
            <div className="live-indicator">REAL-TIME DATA</div>
          </div>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={topViewedChart} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.primary} stopOpacity={1} />
                    <stop offset="100%" stopColor="#80361b" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" stroke={COLORS.textSub} fontSize={11} axisLine={false} tickLine={false} dy={15} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  labelFormatter={(label, payload) => payload && payload.length > 0 ? payload[0].payload.fullName : label}
                  contentStyle={{ backgroundColor: '#000', border: `1px solid ${COLORS.primary}`, borderRadius: '12px', padding: '15px' }}
                  itemStyle={{ color: COLORS.primary, fontWeight: '900', fontSize: '1.1rem' }}
                />
                <Bar dataKey="views" radius={[8, 8, 0, 0]} barSize={50} fill="url(#barGradient)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 📊 2. STATS CARDS */}
        <div style={{ ...glassCard, gridArea: 'stat1' }}>
          <p style={{ color: COLORS.textSub, fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '1px' }}>TOTAL ASSETS</p>
          <div style={{ fontSize: '3rem', fontWeight: '900', margin: '10px 0' }}>{stats.total}</div>
          <div style={{ fontSize: '0.85rem', color: COLORS.success }}>● {stats.published} Active</div>
        </div>

        <div style={{ ...glassCard, gridArea: 'stat2' }}>
          <p style={{ color: COLORS.textSub, fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '1px' }}>LIFETIME VIEWS</p>
          <div style={{ fontSize: '3rem', fontWeight: '900', color: COLORS.success, margin: '10px 0' }}>{stats.totalViews.toLocaleString()}</div>
          <div className="stat-progress-bg"><div className="stat-progress-fill" style={{ width: '100%' }}></div></div>
        </div>

        <div style={{ ...glassCard, gridArea: 'stat3' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: COLORS.textSub, fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '1px' }}>MEDIA MIX</p>
              <div style={{ marginTop: '15px' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>🎬 {stats.videos} <span style={{ fontSize: '0.7rem', color: COLORS.info }}>VIDEOS</span></div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '5px' }}>📷 {stats.images} <span style={{ fontSize: '0.7rem', color: COLORS.primary }}>IMAGES</span></div>
              </div>
            </div>
            <div style={{ width: '80px', height: '80px' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={[{ v: stats.videos }, { v: stats.images }]} innerRadius={28} outerRadius={38} dataKey="v" stroke="none">
                    <Cell fill={COLORS.info} /><Cell fill={COLORS.primary} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 🏆 3. TOP LEADERBOARD TABLE (เรียงตามวิวจากมากไปน้อย) */}
        <div style={{ ...glassCard, gridArea: 'table' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900' }}>Top 10 Performance Leaderboard</h3>
            <div style={{ fontSize: '0.75rem', color: COLORS.textSub, letterSpacing: '1px', fontWeight: 'bold' }}>RANKED BY VIEWS</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: COLORS.textSub, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                <th style={{ padding: '15px 10px', borderBottom: `1px solid ${COLORS.border}` }}>Rank & Project</th>
                <th style={{ padding: '15px 10px', borderBottom: `1px solid ${COLORS.border}` }}>Category</th>
                <th style={{ padding: '15px 10px', borderBottom: `1px solid ${COLORS.border}` }}>Status</th>
                <th style={{ padding: '15px 10px', borderBottom: `1px solid ${COLORS.border}`, textAlign: 'right' }}>Engagement (Views)</th>
              </tr>
            </thead>
            <tbody>
              {topWorksData.map((work, index) => (
                <tr key={work._id} className="table-row">
                  <td style={{ padding: '18px 10px', fontWeight: '700', fontSize: '0.95rem' }}>
                    <span style={{ color: index < 3 ? COLORS.primary : COLORS.textSub, marginRight: '15px' }}>{index + 1}</span>
                    {work.title}
                  </td>
                  <td style={{ padding: '18px 10px' }}>
                    <span className="cat-badge">{work.category?.name || 'GENERIC'}</span>
                  </td>
                  <td style={{ padding: '18px 10px' }}>
                    <div className="status-indicator">
                      <span className={`dot ${work.status}`}></span>
                      <span className={`txt ${work.status}`}>{work.status}</span>
                    </div>
                  </td>
                  <td style={{ padding: '18px 10px', textAlign: 'right', fontWeight: '900', color: COLORS.primary, fontSize: '1.2rem' }}>
                    {work.views?.toLocaleString() || 0}
                  </td>
                </tr>
              ))}
              {topWorksData.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: COLORS.textSub }}>No project data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .bento-grid {
          display: grid;
          grid-template-areas: 
            "chart chart chart"
            "stat1 stat2 stat3"
            "table table table";
          grid-template-columns: 1fr 1.2fr 1fr;
          gap: 25px;
        }

        .live-indicator {
          background: rgba(0, 230, 118, 0.1);
          color: ${COLORS.success};
          padding: 6px 15px;
          border-radius: 50px;
          font-size: 0.7rem;
          font-weight: 800;
          border: 1px solid ${COLORS.success};
          animation: pulse 2s infinite;
        }

        .btn-modern-back {
          background: #fff; color: #000; border: none; padding: 12px 25px; border-radius: 12px; 
          font-weight: 900; font-size: 0.75rem; cursor: pointer; transition: 0.3s;
        }
        .btn-modern-back:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(255,255,255,0.2); }

        .cat-badge { background: #151515; padding: 4px 10px; border-radius: 6px; font-size: 0.65rem; color: #888; border: 1px solid #252525; }

        .status-indicator { display: flex; align-items: center; gap: 8px; }
        .dot { width: 6px; height: 6px; border-radius: 50%; }
        .dot.published { background: ${COLORS.success}; box-shadow: 0 0 10px ${COLORS.success}; }
        .dot.draft { background: ${COLORS.warning}; }
        .txt { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
        .txt.published { color: ${COLORS.success}; }
        .txt.draft { color: ${COLORS.warning}; }

        .table-row { border-bottom: 1px solid rgba(255,255,255,0.02); transition: 0.2s; }
        .table-row:hover { background: rgba(255, 255, 255, 0.015); }

        .stat-progress-bg { background: #222; height: 4px; border-radius: 10px; margin-top: 15px; }
        .stat-progress-fill { background: ${COLORS.success}; height: 100%; border-radius: 10px; }

        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }

        .loader-orbit { text-align: center; }
        .inner-orbit { 
          width: 40px; height: 40px; border: 2px solid #222; border-top: 2px solid ${COLORS.primary}; 
          border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        @media (max-width: 1100px) {
          .bento-grid { grid-template-areas: "chart chart" "stat1 stat2" "stat3 stat3" "table table"; grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}

export default AdminOverview;