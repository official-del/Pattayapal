import { motion } from 'framer-motion';
import Footer from "../components/Footer";
import { FiLayout, FiPenTool, FiVideo, FiMaximize, FiCamera, FiCpu, FiPhone, FiMail, FiMapPin, FiClock, FiActivity, FiArrowRight, FiZap, FiGrid, FiLayers } from 'react-icons/fi';

function Services() {
  const services = [
    {
      title: 'Productions',
      description: 'บริการผลิตสื่อวิดีโอและคอนเทนต์ครบวงจร ตั้งแต่การวางแผน ถ่ายทำ ตัดต่อ จนถึงการนำเสนอ',
      icon: <FiVideo />,
      items: ['ผลิตวิดีโอโฆษณา (TVC)', 'ผลิตสารคดี และ Presentation', 'Live Streaming & Events', 'Social Media Content', 'Motion Graphics'],
      color: '#ff5733'
    },
    {
      title: 'Online Marketing',
      description: 'บริการการตลาดออนไลน์เพื่อเพิ่มยอดขายและสร้างการรับรู้แบรนด์อย่างยั่งยืน',
      icon: <FiActivity />,
      items: ['Facebook & TikTok Ads', 'Google Ads (SEM) & SEO', 'Content & Influencer Marketing', 'Email & Line Official', 'Monthly Data Analytics'],
      color: '#22c55e'
    },
    {
      title: 'Digital Artwork',
      description: 'สร้างสรรค์กราฟิกและงานอาร์ตเวิร์คด้วยเทคนิคที่ล้ำสมัยเพื่อสื่อสิ่งพิมพ์และโฆษณา',
      icon: <FiPenTool />,
      items: ['ออกแบบโลโก้และ CI', 'Ads Banner & Social Post', 'Billboard & Signage Design', 'Brochures & Catalogs', 'Vinyl & Wrap Design'],
      color: '#a855f7'
    },
    {
      title: 'Web Application',
      description: 'พัฒนาเว็บไซต์และแอปพลิเคชันด้วยเทคโนโลยีสมัยใหม่ เน้นความปลอดภัยและใช้งานง่าย',
      icon: <FiCpu />,
      items: ['Corporate Website', 'E-Commerce Platforms', 'Custom CMS Systems', 'Mobile App (iOS/Android)', 'API & Systems Backend'],
      color: '#3b82f6'
    },
  ];

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <div style={{ background: '#000', color: '#fff', paddingTop: '100px' }}>

      {/* 🚀 Tactical Ecosystem Header */}
      <section style={{ padding: '150px 5% 100px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
            <FiLayers color="var(--accent)" size={20} />
            <span style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '0.8rem' }}></span>
          </div>
          <h1 style={{ fontSize: 'clamp(3rem, 10vw, 7rem)', fontWeight: '900', margin: 0, letterSpacing: '-5px', lineHeight: 0.9, textTransform: 'uppercase' }}>
            บริการ <br /> <span style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 20px var(--accent-glow))' }}>อัจฉริยะ</span>
          </h1>
          <p style={{ color: '#888', maxWidth: '850px', margin: '40px auto 0', fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', lineHeight: 1.7, fontWeight: '400' }}>
            เราผสานความคิดสร้างสรรค์เข้ากับเทคโนโลยีสมัยใหม่ เพื่อขับเคลื่อนธุรกิจของคุณสู่ความสำเร็จในระดับสากล
          </p>
        </motion.div>
      </section>

      {/* 🧬 Capabilities Pulse (Grid) */}
      <section style={{ padding: '50px 5%' }}>
        <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '40px' }}>
          {services.map((s, i) => (
            <motion.div
              key={i} variants={itemVariants}
              whileHover={{ y: -15, background: 'rgba(255,255,255,0.02)' }}
              className="glass"
              style={{ padding: '70px 50px', borderRadius: '60px', border: '1px solid rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden', transition: '0.3s' }}
            >
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: `radial-gradient(circle, ${s.color}15 0%, transparent 70%)` }}></div>

              <div style={{ width: '85px', height: '85px', borderRadius: '30px', background: 'rgba(255,255,255,0.01)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontSize: '2.5rem', marginBottom: '45px', border: `1px solid ${s.color}22`, boxShadow: `0 15px 30px ${s.color}22` }}>
                {s.icon}
              </div>

              <h2 style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: '700', color: '#fff', margin: '0 0 25px', letterSpacing: '-1.5px' }}>{s.title}</h2>
              <p style={{ color: '#999', lineHeight: 1.8, marginBottom: '50px', fontSize: '1.1rem', fontWeight: '400' }}>{s.description}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                {s.items.map((item, ii) => (
                  <div key={ii} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, boxShadow: `0 0 10px ${s.color}` }} />
                    <span style={{ fontSize: '0.95rem', color: '#888', fontWeight: '700', letterSpacing: '0.5px' }}>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 📡 Infrastructure Hub (Location & Map) */}
      <section style={{ padding: '150px 5%', background: 'linear-gradient(180deg, transparent 0%, rgba(255,87,51,0.02) 100%)' }}>
        <div className="services-hero-grid" style={{ gap: '100px', alignItems: 'center' }}>

          {/* Connection Signals */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
              <FiZap color="var(--accent)" size={16} />
              <span style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: '700' }}></span>
            </div>
            <h2 style={{ fontSize: '3.5rem', fontWeight: '700', margin: '0 0 60px', letterSpacing: '-2px' }}>ศูนย์บัญชาการพัทยา</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
              {[
                { label: 'NODE LOCATION', value: '264/21 ม.5 ถนนพัทยานาเกลือ พัทยา จ.ชลบุรี 20150', icon: <FiMapPin /> },
                { label: 'SIGNAL LINE', value: '085-552-5695', icon: <FiPhone /> },
                { label: 'DATA STREAM', value: 'info@pattayapal.com', icon: <FiMail /> },
                { label: 'OPERATIONAL STATUS', value: 'จันทร์ - ศุกร์: 09:00 - 18:00 น.', icon: <FiClock /> },
              ].map((info, i) => (
                <div key={i} style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                  <div className="glass" style={{ width: '65px', height: '65px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '1.4rem', background: 'rgba(255,87,51,0.05)' }}>{info.icon}</div>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--accent)', letterSpacing: '3px', display: 'block', marginBottom: '8px', opacity: 0.8 }}>{info.label}</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', letterSpacing: '-0.5px' }}>{info.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Tactical Map Grid */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="glass" style={{ padding: '20px', borderRadius: '60px', border: '1px solid rgba(255,255,255,0.03)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '40px', left: '40px', background: 'rgba(0,0,0,0.8)', padding: '10px 20px', borderRadius: '15px', border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '2px', zIndex: 10 }}>Pattayapal Station</div>
              <iframe
                title="Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.175389426574!2d100.8962755!3d12.9606263!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3102bf448c3f5975%3A0x4a0864986313f8a0!2sPattaya%20pal%20Entertainment%20%3A%20Co%20Station%20Space!5e0!3m2!1sth!2sth!4v1775459388251!5m2!1sth!2sth"
                width="100%" height="650" style={{ border: 0, borderRadius: '45px', filter: 'invert(90%) hue-rotate(180deg) brightness(0.8) contrast(1.2)' }} allowFullScreen="" loading="lazy"
              />
            </div>
          </motion.div>

        </div>
      </section>

      {/* 📡 Final Directive (CTA) */}
      <section style={{ padding: '100px 5% 150px' }}>
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="glass"
          style={{ padding: '100px', borderRadius: '70px', border: '1px solid rgba(255,87,51,0.1)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
        >
          <h3 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: '900', margin: '0 0 25px', letterSpacing: '-2px', textTransform: 'uppercase' }}>เริ่มภารกิจใหม่กับเรา</h3>
          <p style={{ color: '#888', marginBottom: '50px', fontWeight: '400', fontSize: '1.25rem' }}>ส่งซิกนัลเพื่อขอรับคำปรึกษาและวางแผนกลยุทธ์สำหรับธุรกิจของคุณ</p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 20px 50px var(--accent-glow)' }}
            style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '25px 60px', borderRadius: '40px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '20px', margin: '0 auto', fontSize: '1.2rem' }}
            onClick={() => window.location.href = '/contact'}
          >
            คุยรายละเอียดกับทีมงาน <FiArrowRight size={24} />
          </motion.button>
        </motion.div>
      </section>

      <Footer />
      
      <style>{`
        .services-hero-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
        }
        @media (max-width: 992px) {
          .services-hero-grid {
            grid-template-columns: 1fr;
            gap: 50px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Services;