import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiActivity,
  FiArrowRight,
  FiAward,
  FiBox,
  FiBriefcase,
  FiCamera,
  FiCheckCircle,
  FiCpu,
  FiGrid,
  FiLayers,
  FiPenTool,
  FiSearch,
  FiShield,
  FiTarget,
  FiUploadCloud,
  FiVideo,
  FiZap,
} from 'react-icons/fi';
import Footer from '../components/Footer';
import { PATHS } from '../routes/paths';
import '../css/Services.css';

const serviceCategories = [
  {
    title: 'Video & Film',
    description: 'ค้นหา videographer, director, editor และทีม production สำหรับงานโฆษณา, event, social video และ short film',
    icon: <FiVideo />,
    tags: ['Videographer', 'Director', 'Editor', 'Post Production'],
    accent: '#ff5733',
  },
  {
    title: 'Photography',
    description: 'รวมช่างภาพสำหรับ event, portrait, product, studio และ content set ที่ต้องการภาพใช้งานจริง',
    icon: <FiCamera />,
    tags: ['Event Photo', 'Product Photo', 'Portrait', 'Retouching'],
    accent: '#fbca1f',
  },
  {
    title: 'Design & Branding',
    description: 'จ้าง designer สำหรับ brand asset, poster, social content, logo, packaging และ visual identity',
    icon: <FiPenTool />,
    tags: ['Graphic Design', 'Branding', 'Poster', 'Social Media'],
    accent: '#4ade80',
  },
  {
    title: 'Web & Product UI',
    description: 'หา creator สาย web, UI/UX, landing page, dashboard และ prototype สำหรับทีมที่ต้องการงานเร็ว',
    icon: <FiCpu />,
    tags: ['Web App', 'UI/UX', 'Figma', 'Frontend'],
    accent: '#38bdf8',
  },
  {
    title: 'Motion & 3D',
    description: 'รวม motion designer, animator, 3D artist และ VFX creator สำหรับคอนเทนต์ที่ต้องมี movement',
    icon: <FiActivity />,
    tags: ['Motion Graphic', '3D Model', 'VFX', 'Animation'],
    accent: '#a78bfa',
  },
  {
    title: 'AI & Creator Tools',
    description: 'พื้นที่สำหรับ creator ที่ใช้ AI workflow, prompt, image generation, video AI และ automation ช่วยผลิตงาน',
    icon: <FiZap />,
    tags: ['AI Artist', 'AI Video', 'Automation', 'Prompt Work'],
    accent: '#f87171',
  },
];

const marketplaceActions = [
  {
    title: 'Find Freelancers',
    label: 'Browse creators',
    description: 'ค้นหา creator ตาม role, rank, skill และ portfolio ก่อนส่งคำขอจ้างงาน',
    icon: <FiSearch />,
    path: PATHS.discovery,
  },
  {
    title: 'Explore Works',
    label: 'View works',
    description: 'ดูผลงานจริงของ community เพื่อหา reference และเลือกคนที่ style ตรงกับงาน',
    icon: <FiGrid />,
    path: PATHS.works,
  },
  {
    title: 'Post a Job',
    label: 'Open mission',
    description: 'สร้างงานหรือ mission brief พร้อม budget, milestone และสถานะงานใน Dashboard',
    icon: <FiBriefcase />,
    path: PATHS.dashboardHiring,
  },
  {
    title: 'Upload Creations',
    label: 'Join as creator',
    description: 'ลงผลงานเพื่อให้ผู้จ้างเห็น profile, rank, portfolio และ service package ของคุณ',
    icon: <FiUploadCloud />,
    path: PATHS.uploadWork,
  },
];

const trustSignals = [
  { label: 'Creator Profiles', value: 'Portfolio, rank, skill tags', icon: <FiAward /> },
  { label: 'Quest Flow', value: 'Brief, budget, milestones', icon: <FiTarget /> },
  { label: 'Coin Economy', value: 'Wallet, rewards, XP signals', icon: <FiBox /> },
  { label: 'Community Feed', value: 'Hiring posts and creator updates', icon: <FiLayers /> },
];

const steps = [
  'Browse creators or works that match the style you need.',
  'Open a job request with scope, budget, deadline, and references.',
  'Track status, milestones, chat, coins, and creator delivery inside PattayaPal.',
];

function Services() {
  const navigate = useNavigate();
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
  const itemVariants = { hidden: { y: 18, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <div className="services-page">
      <section className="services-hero">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="services-hero-copy">
          <span className="services-kicker"><FiZap /> Creator Marketplace</span>
          <h1>Services for hiring creators, not a company service desk.</h1>
          <p>
            PattayaPal ช่วยให้ผู้จ้างค้นหา freelancer/creator ที่เหมาะกับงาน และช่วยให้ creator เปิด profile,
            package, portfolio และรับ mission ได้ในที่เดียว
          </p>
          <div className="services-hero-actions">
            <button type="button" className="services-primary-btn" onClick={() => navigate(PATHS.discovery)}>
              Find Freelancers <FiArrowRight />
            </button>
            <button type="button" className="services-secondary-btn" onClick={() => navigate(PATHS.works)}>
              View Community Works
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="services-hud">
          {trustSignals.map((signal) => (
            <div key={signal.label} className="services-hud-row">
              <span>{signal.icon}</span>
              <div>
                <strong>{signal.label}</strong>
                <small>{signal.value}</small>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      <section className="services-section">
        <div className="services-section-head">
          <span className="services-kicker"><FiLayers /> Browse by work type</span>
          <h2>หมวดงานที่ควรอยู่ใน PattayaPal</h2>
          <p>หน้านี้ควรสื่อว่า PattayaPal เป็นตลาดรวมคนทำงานสร้างสรรค์ ไม่ใช่ทีมบริษัทที่รับทำทุกอย่างเอง</p>
        </div>

        <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.18 }} className="services-category-grid">
          {serviceCategories.map((service) => (
            <motion.article variants={itemVariants} key={service.title} className="services-category-card" style={{ '--service-accent': service.accent }}>
              <div className="services-category-icon">{service.icon}</div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <div className="services-tag-list">
                {service.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            </motion.article>
          ))}
        </motion.div>
      </section>

      <section className="services-section services-actions-section">
        <div className="services-section-head">
          <span className="services-kicker"><FiBriefcase /> Marketplace actions</span>
          <h2>เลือกเส้นทางตามสิ่งที่ต้องการทำ</h2>
        </div>
        <div className="services-action-grid">
          {marketplaceActions.map((action) => (
            <button type="button" key={action.title} className="services-action-card" onClick={() => navigate(action.path)}>
              <span className="services-action-icon">{action.icon}</span>
              <span>
                <strong>{action.title}</strong>
                <small>{action.description}</small>
              </span>
              <em>{action.label}</em>
            </button>
          ))}
        </div>
      </section>

      <section className="services-flow">
        <div className="services-flow-panel">
          <div>
            <span className="services-kicker"><FiShield /> How it works</span>
            <h2>จากไอเดียงาน ไปถึง creator ที่รับงานได้จริง</h2>
          </div>
          <div className="services-step-list">
            {steps.map((step, index) => (
              <div key={step} className="services-step">
                <span>{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="services-final-cta">
        <div>
          <span className="services-kicker"><FiCheckCircle /> Ready for the marketplace</span>
          <h2>เริ่มจากการดู creator ที่มีอยู่ หรือเปิด mission แรกของคุณ</h2>
        </div>
        <div className="services-cta-actions">
          <button type="button" className="services-primary-btn" onClick={() => navigate(PATHS.discovery)}>
            Browse Creators <FiArrowRight />
          </button>
          <button type="button" className="services-secondary-btn" onClick={() => navigate(PATHS.dashboardHiring)}>
            Post a Job
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Services;
