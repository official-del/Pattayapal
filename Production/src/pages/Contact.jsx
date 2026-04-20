import React, { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';
import { FaFacebookF, FaInstagram, FaTiktok, FaLine } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin, FiSend, FiActivity, FiZap, FiArrowRight, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export default function Contact() {
  const form = useRef();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const sendEmail = (e) => {
    e.preventDefault();
    setLoading(true);

    const SERVICE_ID = "service_6izxkas"; 
    const TEMPLATE_ID = "template_x7syd0x";
    const PUBLIC_KEY = "N12QMH7zmCLMOJBFq";

    emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form.current, PUBLIC_KEY)
      .then((result) => {
          setStatus('SUCCESS');
          setLoading(false);
          e.target.reset();
      }, (error) => {
          setStatus('FAILED');
          setLoading(false);
      });
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', paddingBottom: '150px' }}>
      
      {/* 🚀 Signal Transmission Header */}
      <section style={{ padding: '150px 5% 80px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '15px' }}>
              <FiBriefcase color="var(--accent)" size={18} />
              <span style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '0.8rem' }}></span>
           </div>
           <h1 style={{ fontSize: '5rem', fontWeight: '700', margin: 0, letterSpacing: '-3px', lineHeight: 1 }}>เริ่มต้น <span style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 15px var(--accent-glow))' }}>โปรเจกต์</span></h1>
           <p style={{ color: '#444', marginTop: '20px', fontSize: '1.2rem', fontWeight: '700' }}>เชื่อมต่อกับทีมผู้เชี่ยวชาญเพื่อเปลี่ยนวิสัยทัศน์ของคุณให้เป็นจริง</p>
        </motion.div>
      </section>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="contact-grid"
        style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 5%', gap: '80px', alignItems: 'start' }}
      >
        
        {/* 🧬 Contact Node Intelligence */}
        <motion.div variants={itemVariants} className="glass" style={{ padding: '60px', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.03)' }}>
           <div style={{ marginBottom: '50px' }}>
              <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '30px' }}>ข้อมูลการเชื่อมต่อ</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                 <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ width: '50px', height: '50px', background: 'rgba(255,255,255,0.02)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', border: '1px solid rgba(255,255,255,0.05)' }}>
                       <FiMail size={22} />
                    </div>
                    <div>
                       <div style={{ color: '#444', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '1px', marginBottom: '5px' }}>อีเมล</div>
                       <a href="mailto:touchja7@gmail.com" style={{ color: '#fff', textDecoration: 'none', fontSize: '1.2rem', fontWeight: '700' }}>touchja7@gmail.com</a>
                    </div>
                 </div>

                 <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ width: '50px', height: '50px', background: 'rgba(255,255,255,0.02)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', border: '1px solid rgba(255,255,255,0.05)' }}>
                       <FiPhone size={22} />
                    </div>
                    <div>
                       <div style={{ color: '#444', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '1px', marginBottom: '5px' }}>โทรศัพท์</div>
                       <a href="tel:+66829954745" style={{ color: '#fff', textDecoration: 'none', fontSize: '1.2rem', fontWeight: '700' }}>+66 82 995 4745</a>
                    </div>
                 </div>

                 <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ width: '50px', height: '50px', background: 'rgba(255,255,255,0.02)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', border: '1px solid rgba(255,255,255,0.05)' }}>
                       <FiMapPin size={22} />
                    </div>
                    <div>
                       <div style={{ color: '#444', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '1px', marginBottom: '5px' }}>พิกัดสำนักงาน</div>
                       <p style={{ color: '#fff', margin: 0, fontSize: '1.2rem', fontWeight: '700', lineHeight: 1.5 }}>123 Modern Building, <br/>Chonburi, Thailand</p>
                    </div>
                 </div>
              </div>
           </div>

           <div>
              <h4 style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent)', letterSpacing: '2px', marginBottom: '25px' }}>ช่องทางติดต่อโซเชียล</h4>
              <div style={{ display: 'flex', gap: '15px' }}>
                {[ {Icon: FaFacebookF, url: 'https://facebook.com'}, {Icon: FaInstagram, url: 'https://instagram.com'}, {Icon: FaTiktok, url: 'https://tiktok.com'}, {Icon: FaLine, url: 'https://line.me'} ].map((s, i) => (
                  <motion.a 
                    key={i} href={s.url} target="_blank" whileHover={{ y: -5, background: 'var(--accent)', color: '#fff' }}
                    style={{ width: '55px', height: '55px', borderRadius: '18px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', border: '1px solid rgba(255,255,255,0.05)', fontSize: '1.3rem', transition: '0.3s' }}
                  >
                    <s.Icon />
                  </motion.a>
                ))}
              </div>
           </div>
        </motion.div>

        {/* 🎬 Form: Project Ingestion */}
        <motion.div variants={itemVariants} className="glass" style={{ padding: '60px', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.03)', position: 'relative' }}>
           <form ref={form} onSubmit={sendEmail}>
              <div className="form-row-grid" style={{ gap: '30px', marginBottom: '30px' }}>
                 <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#444', marginBottom: '12px', letterSpacing: '1px' }}>ชื่อของคุณ</label>
                    <input type="text" name="name" required placeholder="ระบุชื่อ-นามสกุล..." style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '20px', color: '#fff', outline: 'none', fontWeight: '700' }} />
                 </div>
                 <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#444', marginBottom: '12px', letterSpacing: '1px' }}>อีเมลสำหรับติดต่อกลับ</label>
                    <input type="email" name="email" required placeholder="contact@example.com" style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '20px', color: '#fff', outline: 'none', fontWeight: '700' }} />
                 </div>
              </div>

              <div style={{ marginBottom: '30px' }}>
                 <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#444', marginBottom: '12px', letterSpacing: '1px' }}>บริการที่คุณสนใจ</label>
                 <select name="title" required style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '20px', color: '#fff', outline: 'none', fontWeight: '700', appearance: 'none' }}>
                    <option value="">เลือกประเภทบริการที่ต้องการ...</option>
                    <option value="Production">Production & Cinematography</option>
                    <option value="Creative Design">Creative & Brand Design</option>
                    <option value="Digital Marketing">Modern Digital Marketing</option>
                 </select>
              </div>

              <div style={{ marginBottom: '40px' }}>
                 <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#444', marginBottom: '12px', letterSpacing: '1px' }}>รายละเอียดเบื้องต้น</label>
                 <textarea name="message" rows="6" required placeholder="เล่าให้เราฟังคร่าวๆ เกี่ยวกับโปรเจกต์ที่คุณกำลังมองหา..." style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '20px', color: '#fff', outline: 'none', fontWeight: '500', lineHeight: 1.6, resize: 'none' }}></textarea>
              </div>

              <motion.button 
                type="submit" disabled={loading}
                whileHover={{ scale: 1.02, boxShadow: '0 0 40px var(--accent-glow)' }}
                style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', padding: '22px', borderRadius: '25px', fontWeight: '700', fontSize: '1.1rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}
              >
                {loading ? 'กำลับส่งซิกนัล...' : 'ส่งข้อความเพื่อเริ่มต้นโปรเจกต์'}
                <FiSend />
              </motion.button>

              <AnimatePresence>
                {status === 'SUCCESS' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '25px', padding: '20px', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '20px', border: '1px solid rgba(34,197,94,0.1)', color: '#22c55e', fontWeight: '700', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                     <FiCheckCircle /> ส่งซิกนัลสำเร็จ! เราจะตอบกลับคุณอย่างรวดเร็วที่สุด
                  </motion.div>
                )}
                {status === 'FAILED' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '25px', padding: '20px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '20px', border: '1px solid rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: '700', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                     <FiAlertCircle /> เกิดข้อผิดพลาดในระบบการสื่อสาร กรุณาลองอีกครั้ง
                  </motion.div>
                )}
              </AnimatePresence>
           </form>
        </motion.div>
      </motion.div>

      <style>{`
        select option { background: #000; color: #fff; }
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
        }
        .form-row-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        @media (max-width: 992px) {
          .contact-grid { grid-template-columns: 1fr; gap: 40px !important; }
          .form-row-grid { grid-template-columns: 1fr; gap: 20px !important; }
        }
      `}</style>
    </div>
  );
}