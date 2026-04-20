import { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { FiAlertCircle } from 'react-icons/fi';
import { CoinIcon, CoinBadge } from './CoinIcon';

function HireModal({ freelancerId, freelancerName, onClose, currentToken, initialData = null }) {
  const { user, fetchProfile } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    budget: initialData?.budget || 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fetchProfile) fetchProfile();
  }, []);
  const coinBalance = user?.coinBalance || 0;

  const isInsufficient = formData.budget > coinBalance;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await jobsAPI.create({
        freelancerId,
        ...formData
      }, currentToken);
      alert(`ส่งคำขอจ้างงานให้คุณ ${freelancerName} สำเร็จ!`);
      if (fetchProfile) fetchProfile();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'จ้างงานไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: '#0a0a0a', border: '1px solid #333', borderRadius: '20px',
        padding: '30px', width: '100%', maxWidth: '500px', position: 'relative'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        
        <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>จ้างงาน {freelancerName}</h2>
        <p style={{ color: '#555', fontSize: '0.85rem', marginBottom: '24px' }}>กรอกรายละเอียดงานที่คุณต้องการจ้างเพื่อให้ฟรีแลนซ์พิจารณา</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', color: '#aaa', fontSize: '0.75rem', marginBottom: '8px', letterSpacing: '1px' }}>ชื่องาน / โปรเจกต์</label>
            <input 
              type="text" 
              required
              placeholder="เช่น งานถ่ายรูปงานแต่งงาน"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              style={{ width: '100%', background: '#111', border: '1px solid #222', padding: '12px 16px', borderRadius: '10px', color: '#fff', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#aaa', fontSize: '0.75rem', marginBottom: '8px', letterSpacing: '1px' }}>งบประมาณ (GOLD COINS)</label>
            <input 
              type="number" 
              required
              placeholder="0.00"
              value={formData.budget === 0 ? '' : formData.budget}
              onChange={e => setFormData({...formData, budget: Number(e.target.value)})}
              style={{ width: '100%', background: '#111', border: '1px solid #222', padding: '12px 16px', borderRadius: '10px', color: '#fff', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#aaa', fontSize: '0.75rem', marginBottom: '8px', letterSpacing: '1px' }}>รายละเอียดงาน</label>
            <textarea 
              required
              rows={4}
              placeholder="ระบุสิ่งที่ต้องการจ้าง วันเวลา และสถานที่..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              style={{ width: '100%', background: '#111', border: '1px solid #222', padding: '12px 16px', borderRadius: '10px', color: '#fff', outline: 'none', resize: 'none' }}
            />
          </div>

          <div style={{ 
            background: 'rgba(255, 87, 51, 0.05)', 
            border: '1px solid rgba(255, 87, 51, 0.2)', 
            padding: '15px', 
            borderRadius: '12px',
            fontSize: '0.8rem',
            color: '#ff8c33',
            display: 'flex',
            gap: '10px'
          }}>
            <FiAlertCircle style={{ fontSize: '2rem' }} />
            <div>
              <strong>หมายเหตุระบบ Escrow:</strong> เมื่อคุณกดส่งคำขอจ้างงาน ระบบจะ "พักเงิน" (Escrow) ตามงบประมาณที่คุณระบุไว้จากกระเป๋าเงินของคุณทันที เพื่อเป็นการการันตีโปรเจกต์
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
            <div style={{ color: '#888', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Coin ของคุณ: <CoinBadge amount={coinBalance} size="sm" />
            </div>
            {isInsufficient && (
              <Link to="/dashboard/wallet" style={{ color: '#ff5733', fontSize: '0.85rem', fontWeight: 'bold' }}>เติม Coin เพิ่มที่นี่</Link>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading || isInsufficient}
            style={{
              background: isInsufficient ? '#333' : 'linear-gradient(45deg, #ff5733, #ff8c33)',
              color: isInsufficient ? '#666' : '#fff', border: 'none', padding: '14px', borderRadius: '12px',
              fontWeight: '700', fontSize: '1rem', cursor: isInsufficient ? 'not-allowed' : 'pointer', marginTop: '5px',
              opacity: loading ? 0.6 : 1, transition: '0.3s'
            }}
          >
            {loading ? 'กำลังส่งคำขอ...' : (isInsufficient ? 'ยอด Coin ไม่เพียงพอ' : 'ยืนยันจ้างงานและวางเงิน')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default HireModal;
