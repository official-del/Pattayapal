import { useState, useEffect } from 'react';
import axios from 'axios';
import { usersAPI, analyticsAPI } from '../../utils/api';
import { FiGrid, FiUsers, FiPackage, FiActivity, FiZap, FiTrendingUp, FiHeart, FiEye, FiAward, FiBarChart2 } from 'react-icons/fi';
import { CoinIcon, CoinBadge } from '../../components/CoinIcon';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import RankBadge from '../../components/RankBadge';
import { CONFIG } from '../../utils/config';

const API_BASE_URL = CONFIG.API_BASE_URL;

function DashboardOverview() {
  const [summary, setSummary] = useState(null);
  const [viewData, setViewData] = useState([]);
  const [platformData, setPlatformData] = useState([]);
  const [rankProgress, setRankProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem('userToken') || localStorage.getItem('token');
        const [summaryData, views, platforms, rank] = await Promise.allSettled([
          usersAPI.getDashboardSummary(token),
          analyticsAPI.getViewTrend(token),
          analyticsAPI.getPlatformBreakdown(token),
          axios.get(`${API_BASE_URL}/api/users/me/rank-progress`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (summaryData.status === 'fulfilled') {
          const val = summaryData.value;
          const summaryObj = val.user || val.data || val;
          // Normalization
          summaryObj.coinBalance = summaryObj.coinBalance ?? summaryObj.balance ?? summaryObj.coins ?? 0;
          setSummary(summaryObj);
        }
        if (views.status === 'fulfilled') setViewData(views.value);
        if (platforms.status === 'fulfilled') setPlatformData(platforms.value);
        if (rank.status === 'fulfilled') setRankProgress(rank.value.data);
      } catch (err) {
        console.error('Dashboard Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '20px' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        style={{ width: '40px', height: '40px', border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }}
      />
      <p style={{ marginTop: '20px', color: '#444', fontWeight: '700', letterSpacing: '4px', fontSize: '0.8rem' }}>Syncing Data...</p>
    </div>
  );

  const isFreelancer = summary?.profession && summary.profession !== 'General';
  const isClient = summary?.role === 'client' || (summary?.role === 'user' && !isFreelancer);

  const statCards = isClient ? [
    { label: 'ACTIVE JOBS', value: summary?.jobsPostedCount || 0, icon: <FiPackage />, color: '#ff5733' },
    { label: 'COIN BALANCE', value: summary?.coinBalance || 0, isCoin: true, icon: <CoinIcon size={28} />, color: '#f59e0b' },
    { label: 'ACTIVE HIRES', value: summary?.activeHiresCount || 0, icon: <FiUsers />, color: '#6366f1' },
    { label: 'TOTAL BUDGET', value: summary?.totalBudgetSpent || 0, isCoin: true, icon: <FiActivity />, color: '#22c55e' },
  ] : [
    { label: 'PORTFOLIO', value: summary?.totalWorks || 0, icon: <FiPackage />, color: '#ff5733' },
    { label: 'REACH', value: summary?.totalViews || 0, icon: <FiEye />, color: '#6366f1' },
    { label: 'COIN BALANCE', value: summary?.coinBalance || 0, isCoin: true, icon: <CoinIcon size={28} />, color: '#f59e0b' },
    { label: 'POINTS', value: (summary?.points || 0).toLocaleString(), icon: <FiAward />, color: '#c026d3' },
  ];

  const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b'];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="fadeIn" style={{ paddingBottom: '100px' }}>

      {/* 🌌 Header & Rank Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '30px', marginBottom: '50px' }}>
        <motion.header variants={itemVariants}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '700', margin: 0, letterSpacing: '-3px', lineHeight: 1 }}>
            DASHBOARD <span style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 10px var(--accent-glow))' }}>/ {isClient ? 'CLIENT' : 'CREATOR'}</span>
          </h1>
          <p style={{ color: '#444', marginTop: '12px', fontWeight: '700', fontSize: '1.8rem', letterSpacing: '1px' }}>Freshly Updated</p>
        </motion.header>

        {!isClient && rankProgress && (
          <motion.div variants={itemVariants} className="glass rank-progress-card" style={{
            padding: '24px 30px', borderRadius: '30px', flex: 1, display: 'flex', gap: '20px', alignItems: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)',
            minWidth: 'min(380px, 100%)'
          }}>
            <RankBadge rank={rankProgress.currentRank} size="xl" showName={false} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--accent)', letterSpacing: '2px' }}>EXPERIENCE LEVEL</span>
                <span style={{ fontSize: '1.2rem', fontWeight: '700' }}>{rankProgress.currentRank.toUpperCase()}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${rankProgress.progress}%` }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  style={{
                    height: '100%', background: 'linear-gradient(90deg, var(--accent), #ffbd33)',
                    boxShadow: '0 0 15px var(--accent-glow)'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.7rem', color: '#333', fontWeight: '700' }}>
                <span>{rankProgress.currentPoints.toLocaleString()} PTS</span>
                <span>Next Milestone: {rankProgress.nextRank}</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ⚡ Stats Grid */}
      <div className="client-stats-grid">
        {statCards.map((card) => (
          <motion.div
            key={card.label}
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="glass-card"
            style={{ padding: '35px', borderRadius: '35px', display: 'flex', alignItems: 'center', gap: '25px', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{
              width: '70px', height: '70px', borderRadius: '24px', background: `${card.color}15`, color: card.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem'
            }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', letterSpacing: '-1px', lineHeight: 1 }}>
                {card.isCoin ? <CoinBadge amount={card.value} size="xl" /> : card.value}
              </div>
              <p style={{ margin: 0, fontSize: '0.6rem', color: '#444', fontWeight: '700', letterSpacing: '2px', opacity: 0.6 }}>{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 📈 Analytics Section */}
      {!isClient && (
        <div className="analytics-grid">
          <motion.div variants={itemVariants} className="glass" style={{ borderRadius: '40px', padding: '40px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <h3 style={{ margin: '0 0 35px', fontSize: '1rem', fontWeight: '700', letterSpacing: '2px', color: '#fff' }}>
              <FiBarChart2 style={{ color: 'var(--accent)', verticalAlign: 'middle', marginRight: '10px' }} /> ENGAGEMENT TREND (7D)
            </h3>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={viewData}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#222" tick={{ fill: '#222', fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#222" tick={{ fill: '#222', fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{ background: '#050505', border: '1px solid #222', borderRadius: '15px' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="views" stroke="var(--accent)" strokeWidth={4} fillOpacity={1} fill="url(#colorViews)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass" style={{ borderRadius: '40px', padding: '40px', display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '5px' }}>ภาพรวม / OVERVIEW</span>
            <div style={{ width: '100%', flex: 1, minHeight: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformData}
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ background: '#050505', border: '1px solid #222', borderRadius: '15px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
              {platformData.map((entry, index) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: '#444', fontWeight: '700' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[index] }}></div>
                  {entry.name.toUpperCase()}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      <style>{`
        .client-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 25px;
          margin-bottom: 50px;
        }
        .analytics-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 30px;
        }

        @media (max-width: 992px) {
          .analytics-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          h1 {
            font-size: clamp(2rem, 10vw, 3.5rem) !important;
          }
          .rank-progress-card {
            padding: 20px !important;
            flex-direction: column;
            text-align: center;
          }
          .rank-progress-card > div {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .client-stats-grid {
            grid-template-columns: 1fr;
          }
          h1 {
            font-size: 2.2rem !important;
          }
          p {
            font-size: 1.2rem !important;
          }
        }
      `}</style>
    </motion.div>
  );
}

export default DashboardOverview;
