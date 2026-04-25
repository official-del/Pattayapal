import { useState, useEffect } from 'react';
import axios from 'axios';
import { usersAPI, analyticsAPI } from '../../utils/api';
import { FiGrid, FiUsers, FiPackage, FiActivity, FiZap, FiTrendingUp, FiHeart, FiEye, FiAward, FiBarChart2 } from 'react-icons/fi';
import { CoinIcon, CoinBadge } from '../../components/CoinIcon';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import RankBadge from '../../components/RankBadge';
import { CONFIG } from '../../utils/config';
import '../../css/DashboardOverview.css';

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
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="dashboard-overview-container">

      {/* 🌌 Header & Rank Progress */}
      <div className="db-header-row">
        <motion.header variants={itemVariants} className="db-header">
          <h1 className="db-title">
            DASHBOARD <span className="db-accent-text">/ {isClient ? 'CLIENT' : 'CREATOR'}</span>
          </h1>
          <p className="db-subtitle">Freshly Updated</p>
        </motion.header>

        {!isClient && rankProgress && (
          <motion.div variants={itemVariants} className="rank-progress-card stat-card">
            <RankBadge rank={rankProgress.currentRank} size="xl" showName={false} />
            <div className="rank-details">
              <div className="rank-header">
                <span className="rank-label">EXPERIENCE LEVEL</span>
                <span className="rank-name">{rankProgress.currentRank.toUpperCase()}</span>
              </div>
              <div className="rank-bar-bg">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${rankProgress.progress}%` }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className="rank-bar-fill"
                />
              </div>
              <div className="rank-footer">
                <span>{rankProgress.currentPoints.toLocaleString()} PTS</span>
                <span>Next Milestone: {rankProgress.nextRank}</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ⚡ Stats Grid */}
      <div className="db-stats-grid">
        {statCards.map((card) => (
          <motion.div
            key={card.label}
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="stat-card"
          >
            <div className="stat-icon-box" style={{ background: `${card.color}15`, color: card.color }}>
              {card.icon}
            </div>
            <div className="stat-content">
              <span className="stat-label">{card.label}</span>
              <div className="stat-value-group">
                <span className="stat-value">
                  {card.isCoin ? <CoinBadge amount={card.value} size="xl" /> : card.value}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 📈 Analytics Section */}
      {!isClient && (
        <div className="db-charts-row">
          <motion.div variants={itemVariants} className="chart-container">
            <div className="chart-header">
              <h3 className="chart-title">
                <FiBarChart2 className="chart-icon-main" /> ENGAGEMENT TREND (7D)
              </h3>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={viewData}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--p-accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--p-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#444" tick={{ fill: '#444', fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#444" tick={{ fill: '#444', fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '15px' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="views" stroke="var(--p-accent)" strokeWidth={4} fillOpacity={1} fill="url(#colorViews)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="chart-container pie-chart-section">
            <span className="p-group-label-small">ภาพรวม / OVERVIEW</span>
            <div className="pie-wrapper">
              <ResponsiveContainer width="100%" height={250}>
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
                    contentStyle={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '15px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="pie-legend">
              {platformData.map((entry, index) => (
                <div key={entry.name} className="legend-item">
                  <div className="legend-dot" style={{ background: COLORS[index] }}></div>
                  {entry.name.toUpperCase()}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

export default DashboardOverview;
