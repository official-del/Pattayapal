import { motion } from 'framer-motion';
import {
  FiCamera, FiVideo, FiPenTool, FiCpu, FiLayout, FiMaximize, FiArrowRight, FiSliders, FiFilm
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

function ServiceGrid() {
  const navigate = useNavigate();

  const professions = [
    { name: 'Photographer', icon: <FiCamera />, description: 'ผู้บันทึกความทรงจำผ่านเลนส์ ด้วยเทคนิคการใช้แสงและมุมมองที่โดดเด่น' },
    { name: 'Videographer', icon: <FiVideo />, description: 'ผู้สร้างสรรค์เรื่องราวผ่านภาพเคลื่อนไหว บันทึกทุกโมเมนต์สำคัญด้วยคุณภาพระดับสูง' },
    { name: 'Editor', icon: <FiSliders />, description: 'นักตัดต่อและลำดับภาพผู้เปลี่ยนฟุตเทจดิบให้เป็นผลงานชิ้นเอกที่น่าติดตาม' },
    { name: 'Director', icon: <FiFilm />, description: 'ผู้นำวิสัยทัศน์และการสร้างสรรค์ ควบคุมทุกรายละเอียดเพื่อให้ผลงานออกมาดีที่สุด' },
    { name: 'Production Design', icon: <FiLayout />, description: 'ผู้ออกแบบรูปลักษณ์และบรรยากาศ จัดวางองค์ประกอบศิลป์เพื่อสื่อสารอารมณ์ของแบรนด์' },
    { name: 'Creative Content', icon: <FiPenTool />, description: 'นักคิดเนื้อหาสสร้างสรรค์ ออกแบบกลยุทธ์และเรื่องราวให้โดดเด่นและเป็นที่จดจำ' },
    { name: 'Film Production', icon: <FiVideo />, description: 'ทีมงานผู้ดูแลกระบวนการผลิตวิดีโอและภาพยนตร์อย่างครบวงจร ตั้งแต่เริ่มจนจบ' },
    { name: 'Post Production', icon: <FiMaximize />, description: 'ผู้ดูแลกระบวนการหลังการถ่ายทำ ทั้งการปรับสี ใส่เสียง และวิชวลเอฟเฟกต์' },
    { name: 'Digital Artist', icon: <FiCpu />, description: 'ศิลปินผู้ผสานเทคโนโลยีและจินตนาการ สร้างสรรค์งานกราฟิกและอาร์ตเวิร์คล้ำสมัย' },
  ];

  const handleCategoryClick = (roleName) => {
    // Navigate to freelancers page with the profession filter (User Professional Role)
    navigate(`/freelancers?profession=${encodeURIComponent(roleName)}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))',
        gap: '25px', padding: '20px 0'
      }}
    >
      {professions.map((role, i) => (
        <motion.div
          key={i}
          variants={itemVariants}
          whileHover={{ y: -10, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', borderColor: 'var(--accent-glow)' }}
          onClick={() => handleCategoryClick(role.name)}
          className="glass"
          style={{
            padding: '50px 40px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.03)',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left',
            transition: '0.4s cubic-bezier(0.23, 1, 0.32, 1)', cursor: 'pointer', minHeight: '380px'
          }}
        >
          <div style={{
            width: '60px', height: '60px', borderRadius: '20px', background: 'rgba(255,87,51,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
            fontSize: '1.5rem', marginBottom: '30px', border: '1px solid rgba(255,87,51,0.1)'
          }}>
            {role.icon}
          </div>
          <h3 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#fff', margin: '0 0 15px', letterSpacing: '-0.5px' }}>{role.name}</h3>
          <p style={{ color: '#555', fontSize: '1rem', lineHeight: 1.6, fontWeight: '500', marginBottom: '0' }}>{role.description}</p>

          <div style={{ marginTop: 'auto', paddingTop: '30px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', fontWeight: '700', fontSize: '0.8rem', letterSpacing: '2px' }}>
            FIND TALENT <FiArrowRight size={14} />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

export default ServiceGrid;