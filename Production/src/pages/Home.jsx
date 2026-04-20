import React from 'react';
import VideoSlider from '../components/VideoSlider';
import TopRanking from '../components/TopRanking';
import WorksSlider from '../components/WorksSlider';
import ServiceGrid from '../components/ServiceGrid';
import Footer from '../components/Footer';
import Clientses from '../components/Clientses';
import { motion } from 'framer-motion';
import { FiArrowRight, FiZap, FiActivity, FiLayers, FiUsers, FiCheckCircle, FiTrendingUp, FiTarget, FiHexagon } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* 🌌 Phase 1: High-Impact Hero Stream */}
      <section style={{ height: '100vh', position: 'relative' }}>
        <VideoSlider />
      </section>

      {/* 📡 Phase 2: Tactical Intelligence (Trending) */}
      <section style={{ padding: '120px 0', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,87,51,0.1), transparent)' }} />
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 5%' }}>
          <TopRanking label="HEATING UP THE FEED" />
        </div>
      </section>

      {/* 🚀 Phase 3: Service Ecosystem */}
      <section style={{ padding: '150px 0', background: 'radial-gradient(circle at 50% 50%, rgba(255,87,51,0.03) 0%, transparent 70%)' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 5%' }}>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '100px' }}
          >
            <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '25px' }}>
              <FiZap color="var(--accent)" size={24} />
              <span style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '0.8rem' }}></span>
            </motion.div>
            <motion.h2 variants={itemVariants} style={{ fontSize: 'clamp(3.5rem, 8vw, 6.5rem)', fontWeight: '700', margin: 0, letterSpacing: '-4px', lineHeight: 0.85 }}>
              <span style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 15px var(--accent-glow))' }}>Power Your Ideas</span> <br />
              <span style={{ color: 'transparent', WebkitTextStroke: '1px rgba(255,255,255,0.05)' }}>with Modern Tech</span>
            </motion.h2>
            <motion.p variants={itemVariants} style={{ color: '#444', maxWidth: '800px', margin: '40px auto 0', fontSize: '1.25rem', fontWeight: '500', lineHeight: 1.6 }}>
              We are the driver of creative business and premium digital innovation, ensuring high-performance outcomes for your brand.
            </motion.p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <ServiceGrid />
          </motion.div>
        </div>
      </section>

      {/* 🧬 Phase 4: Discovery Grid (Works) */}
      <section style={{ padding: '150px 0', background: '#000', borderTop: '1px solid rgba(255,255,255,0.03)', position: 'relative' }}>
        {/* Floating background identifier */}
        <div style={{ position: 'absolute', top: '100px', right: '-100px', fontSize: '15rem', fontWeight: '700', color: 'rgba(255,255,255,0.01)', pointerEvents: 'none', userSelect: 'none' }}>ARCHIVE</div>

        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 5%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '80px', flexWrap: 'wrap', gap: '40px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <FiLayers color="var(--accent)" size={20} />
                <span style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '0.8rem' }}></span>
              </div>
              <h3 style={{ fontSize: '4.5rem', fontWeight: '700', margin: 0, letterSpacing: '-px' }}>USER CREATIONS</h3>
              <motion.p variants={itemVariants} style={{ color: '#444', maxWidth: '800px', margin: '40px auto 0', fontSize: '1rem', fontWeight: '500', lineHeight: 1.6 }}>User Creations" refers to any digital content, artwork, tools, or projects that are built, designed, and uploaded by the platform's users User-Generated Content, rather than by the platform's official team.</motion.p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '120px' }}>
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <WorksSlider category={{ label: 'Photography', href: '/works' }} />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <WorksSlider category={{ label: 'Motion Graphic', href: '/works' }} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* 📊 Phase 5: Platform Metrics (Real-Time Signals) */}
      {/* <section style={{ padding: '150px 0', borderTop: '1px solid rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: '-200px', left: '-200px', width: '600px', height: '600px', background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', opacity: 0.05, filter: 'blur(100px)' }} />

        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 5%' }}>
          <div style={{ textAlign: 'center', marginBottom: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
              <FiActivity color="var(--accent)" size={20} />
              <span style={{ color: 'var(--accent)', fontWeight: '700', letterSpacing: '8px', fontSize: '0.8rem' }}>ข้อมูลระบบ / LIVE NETWORK DATA</span>
            </div>
            <h2 style={{ fontSize: '4rem', fontWeight: '700', letterSpacing: '-2px' }}>ประสิทธิภาพแพลตฟอร์ม</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            {[
              { label: 'จำนวนผู้ใช้ / USERS', value: '25,000+', icon: <FiUsers />, color: '#6366f1' },
              { label: 'งานที่สำเร็จ / PROJECTS', value: '1,250+', icon: <FiCheckCircle />, color: '#10b981' },
              { label: 'ความเสถียร / UPTIME', value: '99.9%', icon: <FiActivity />, color: '#ff5733' },
              { label: 'เหรียญหมุนเวียน / TOTAL COINS', value: '45.2M', icon: <FiTrendingUp />, color: '#f59e0b' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -15, scale: 1.02 }}
                className="glass"
                style={{ padding: '70px 40px', borderRadius: '50px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden', transition: '0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: `radial-gradient(circle, ${stat.color}15 0%, transparent 70%)` }}></div>
                <div style={{ color: stat.color, fontSize: '2.5rem', marginBottom: '30px', display: 'flex', justifyContent: 'center', filter: `drop-shadow(0 0 10px ${stat.color}44)` }}>{stat.icon}</div>
                <div style={{ fontSize: '4.5rem', fontWeight: '700', letterSpacing: '-3px', marginBottom: '10px', color: '#fff' }}>{stat.value}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#222', letterSpacing: '4px', textTransform: 'uppercase' }}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}

      {/* 🤝 Phase 6: Partner Logistics */}
      <section style={{ padding: '120px 0', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 5%' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: '700', color: '#333', letterSpacing: '6px' }}>TRUSTED PARTNERS</h4>
          </div>
          <Clientses />
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;