import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FiArrowLeft, FiBarChart2, FiEye, FiFolder, FiImage, FiVideo } from 'react-icons/fi';
import PremiumLoader from '../../components/PremiumLoader';
import { worksAPI } from '../../utils/api';

function AdminOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, totalViews: 0, videos: 0, images: 0 });
  const [topWorksData, setTopWorksData] = useState([]);
  const [topViewedChart, setTopViewedChart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await worksAPI.getAll();
        const allWorks = res.works || res || [];

        let viewsCount = 0;
        let videoCount = 0;
        let imageCount = 0;
        let publishedCount = 0;

        allWorks.forEach((work) => {
          viewsCount += work.views || 0;
          if (work.status === 'published') publishedCount += 1;

          const isVideo = work.type === 'video' || /\.(mp4|webm|ogg|mov)$/i.test(work.mediaUrl || '');
          if (isVideo) videoCount += 1;
          else imageCount += 1;
        });

        setStats({
          total: allWorks.length,
          published: publishedCount,
          drafts: allWorks.length - publishedCount,
          totalViews: viewsCount,
          videos: videoCount,
          images: imageCount,
        });

        const sortedByViews = [...allWorks].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);
        setTopWorksData(sortedByViews);
        setTopViewedChart(
          sortedByViews.map((work) => ({
            name: work.title?.length > 12 ? `${work.title.substring(0, 12)}..` : work.title,
            views: work.views || 0,
            fullName: work.title,
          })),
        );
      } catch (err) {
        console.error('Error fetching overview data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <PremiumLoader fullScreen={false} text="LOADING ADMIN OVERVIEW" subtext="Preparing content metrics..." />;
  }

  const metricCards = [
    { icon: FiFolder, label: 'Total assets', value: stats.total, tone: 'orange', helper: `${stats.published} published` },
    { icon: FiEye, label: 'Lifetime views', value: stats.totalViews.toLocaleString(), tone: 'green', helper: 'Across all works' },
    { icon: FiVideo, label: 'Video items', value: stats.videos, tone: 'blue', helper: `${stats.images} image items` },
    { icon: FiImage, label: 'Drafts', value: stats.drafts, tone: 'yellow', helper: 'Pending publish' },
  ];

  return (
    <section className="admin-overview-page">
      <header className="admin-overview-hero">
        <div>
          <p className="admin-overview-kicker">
            <FiBarChart2 />
            Performance analytics
          </p>
          <h1>Admin Overview</h1>
          <p>Track portfolio content, media mix, and the highest viewed works in one compact console.</p>
        </div>

        <button type="button" className="admin-pixel-button admin-pixel-button-muted" onClick={() => navigate('/admin/dashboard')}>
          <FiArrowLeft />
          <span>Back to manager</span>
        </button>
      </header>

      <div className="admin-overview-metrics">
        {metricCards.map((card) => {
          const Icon = card.icon;

          return (
            <article className={`admin-overview-metric is-${card.tone}`} key={card.label}>
              <div className="admin-overview-metric-icon">
                <Icon />
              </div>
              <div>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <p>{card.helper}</p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="admin-overview-grid">
        <article className="admin-overview-panel admin-overview-chart">
          <div className="admin-overview-panel-head">
            <div>
              <span>Top 10 chart</span>
              <h2>Views by project</h2>
            </div>
            <small>Live content data</small>
          </div>

          <div className="admin-overview-chart-box">
            <ResponsiveContainer>
              <BarChart data={topViewedChart} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={11} axisLine={false} tickLine={false} dy={12} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'rgba(255,87,51,0.08)' }}
                  labelFormatter={(label, payload) => (payload && payload.length > 0 ? payload[0].payload.fullName : label)}
                  contentStyle={{ backgroundColor: '#080808', border: '1px solid rgba(255,87,51,0.5)', borderRadius: 8, padding: 12 }}
                  itemStyle={{ color: '#ff5733', fontWeight: 800 }}
                />
                <Bar dataKey="views" radius={[6, 6, 0, 0]} barSize={42} fill="#ff5733" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="admin-overview-panel admin-overview-mix">
          <div className="admin-overview-panel-head">
            <div>
              <span>Media mix</span>
              <h2>Asset types</h2>
            </div>
          </div>

          <div className="admin-overview-pie">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={[{ name: 'Videos', value: stats.videos }, { name: 'Images', value: stats.images }]} innerRadius={54} outerRadius={78} dataKey="value" stroke="none">
                  <Cell fill="#38bdf8" />
                  <Cell fill="#ff5733" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="admin-overview-legend">
            <span><i className="is-blue" /> Videos</span>
            <span><i className="is-orange" /> Images</span>
          </div>
        </article>

        <article className="admin-overview-panel admin-overview-table">
          <div className="admin-overview-panel-head">
            <div>
              <span>Leaderboard</span>
              <h2>Top viewed works</h2>
            </div>
          </div>

          <div className="admin-overview-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Project</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Views</th>
                </tr>
              </thead>
              <tbody>
                {topWorksData.map((work, index) => (
                  <tr key={work._id}>
                    <td>#{index + 1}</td>
                    <td>{work.title}</td>
                    <td>{work.category?.name || 'General'}</td>
                    <td><span className={`admin-status-pill is-${work.status}`}>{work.status || 'draft'}</span></td>
                    <td>{(work.views || 0).toLocaleString()}</td>
                  </tr>
                ))}
                {topWorksData.length === 0 && (
                  <tr>
                    <td colSpan="5">No project data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}

export default AdminOverview;
