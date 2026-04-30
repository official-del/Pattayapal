import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiZap, FiEdit3, FiAlignLeft, FiTarget, FiAward, FiSettings, FiStar, FiCalendar, FiUsers, FiClock, FiCheckCircle } from 'react-icons/fi';
import { questsAPI } from '../utils/api';
import { CoinIcon } from './CoinIcon';

const EMPTY_FORM = {
  title: '',
  description: '',
  taskType: 'MANUAL',
  rewardType: 'COIN',
  coinReward: 0,
  xpReward: 0,
  requiredRank: 'All',
  maxParticipants: 0,
  durationDays: 0,
  expiresAt: '',   // ISO string or empty
};

// ─── FormGroup Component for Layout ───────────────────────────────────────────
function FormGroup({ title, icon, children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.2), transparent)' }} />
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '1.05rem', margin: '0 0 20px 0', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
        <span style={{ color: '#f59e0b', display: 'flex' }}>{icon}</span> {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Main Modal Component ─────────────────────────────────────────────────────
function CreateQuestModal({ isOpen, onClose, onSuccess, isAdmin, editData = null }) {
  const [form, setForm]       = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // Populate form when editing
  useEffect(() => {
    if (!isOpen) return;
    if (editData) {
      setForm({
        title:        editData.title        || '',
        description:  editData.description  || '',
        taskType:     editData.taskType     || 'MANUAL',
        rewardType:   editData.rewardType   || 'COIN',
        coinReward:   editData.coinReward   ?? 0,
        xpReward:     editData.xpReward     ?? 0,
        requiredRank: editData.requiredRank || 'All',
        maxParticipants: editData.maxParticipants ?? 0,
        durationDays: editData.durationDays ?? 0,
        expiresAt:    editData.expiresAt ? new Date(editData.expiresAt).toISOString().slice(0, 16) : '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError('');
  }, [editData, isOpen]);

  if (!isOpen || !isAdmin) return null;

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const reward = form.rewardType === 'COIN' ? Number(form.coinReward) : Number(form.xpReward);
    if (!form.title.trim()) return setError('กรุณาระบุชื่อเควส');
    if (reward <= 0)        return setError('กรุณาระบุรางวัลอย่างน้อย 1');

    const payload = {
      ...form,
      coinReward: form.rewardType === 'COIN' ? Number(form.coinReward) : 0,
      xpReward:   form.rewardType === 'XP'   ? Number(form.xpReward)   : 0,
      expiresAt:  form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    };

    try {
      setLoading(true);
      if (editData) {
        await questsAPI.update(editData._id || editData.id, payload);
      } else {
        await questsAPI.create(payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#aaa', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', padding: '20px', perspective: '1000px' }}>
      
      <style>{`
        .premium-input {
          width: 100%;
          background: #0f0f0f;
          border: 1px solid #222;
          color: #fff;
          padding: 14px 16px;
          border-radius: 12px;
          font-size: 0.95rem;
          outline: none;
          box-sizing: border-box;
          transition: all 0.3s ease;
        }
        .premium-input:focus {
          border-color: #f59e0b;
          background: #151515;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.15);
        }
        .premium-input::placeholder {
          color: #555;
        }
        .modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 768px) {
          .modal-grid {
            grid-template-columns: 1fr;
          }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(245,158,11,0.5); }
      `}</style>

      <motion.div
        initial={{ opacity: 0, rotateX: 10, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
        exit={{ opacity: 0, rotateX: -10, y: -30, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="custom-scrollbar"
        style={{ 
          background: '#080808', 
          width: '100%', 
          maxWidth: '1000px', 
          maxHeight: '90vh', 
          overflowY: 'auto', 
          borderRadius: '24px', 
          border: '1px solid rgba(245,158,11,0.15)', 
          padding: '35px', 
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8), 0 0 40px rgba(245,158,11,0.05)'
        }}
      >
        {/* Close Button */}
        <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#888', cursor: 'pointer', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', zIndex: 10 }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)' }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}>
          <FiX size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
            {editData ? <FiEdit3 size={28} /> : <FiStar size={28} />}
          </div>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.7rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.5px' }}>
              {editData ? 'แก้ไขข้อมูลเควส' : 'สร้างเควสใหม่'}
            </h2>
            <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>
              กำหนดรายละเอียด เงื่อนไข และรางวัลสำหรับผู้ใช้งาน
            </p>
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '14px 18px', borderRadius: '12px', fontSize: '0.9rem', marginBottom: '25px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiX size={18} /> {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="modal-grid">
          
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <FormGroup title="ข้อมูลพื้นฐาน (Basic Info)" icon={<FiAlignLeft />}>
              <div>
                <label style={labelStyle}><FiEdit3 size={14} /> ชื่อเควส</label>
                <input required className="premium-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="เช่น จัดการโปรไฟล์ให้ครบ 100%" />
              </div>
              <div>
                <label style={labelStyle}><FiAlignLeft size={14} /> รายละเอียด</label>
                <textarea required className="premium-input" value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="อธิบายขั้นตอนหรือเงื่อนไขสั้นๆ ให้น่าสนใจ..." style={{ resize: 'vertical', minHeight: '120px' }} />
              </div>
              <div>
                <label style={labelStyle}><FiTarget size={14} /> เงื่อนไขการสำเร็จ</label>
                <select className="premium-input" value={form.taskType} onChange={e => set('taskType', e.target.value)}>
                  <option value="MANUAL">Manual — กดรับได้เลย (ไม่ตรวจสอบ)</option>
                  <option value="PROFILE_FULL">ตั้งค่าโปรไฟล์ครบ (Bio + รูปโปรไฟล์ + รูปหน้าปก)</option>
                  <option value="POST_WORK">อัปโหลดผลงานอย่างน้อย 1 ชิ้น</option>
                  <option value="DAILY_LOGIN">เข้าสู่ระบบรายวัน (รับได้ทุกวัน)</option>
                  <option value="PROOF_SUBMISSION">Share / Social Proof (ต้องส่งลิงก์ตรวจสอบ)</option>
                </select>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#666', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FiCheckCircle size={12} color="#f59e0b" /> ระบบจะตรวจสอบเงื่อนไขอัตโนมัติเมื่อกดรับรางวัล
                </p>
              </div>
            </FormGroup>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <FormGroup title="รางวัล (Reward)" icon={<FiAward />}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>ประเภทรางวัล</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {['COIN', 'XP'].map(type => {
                      const isCoin = type === 'COIN';
                      const isSelected = form.rewardType === type;
                      const activeColor = isCoin ? '#f59e0b' : '#ff5733';
                      const activeBg = isCoin ? 'rgba(245,158,11,0.1)' : 'rgba(255,87,51,0.1)';
                      return (
                        <button
                          key={type} type="button"
                          onClick={() => set('rewardType', type)}
                          style={{ 
                            padding: '12px', borderRadius: '12px', 
                            border: `1.5px solid ${isSelected ? activeColor : '#222'}`, 
                            background: isSelected ? activeBg : '#0f0f0f', 
                            color: isSelected ? activeColor : '#666', 
                            fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                          }}
                        >
                          {isCoin ? <CoinIcon size={18} /> : <FiZap size={18} />} 
                          {type}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>
                    {form.rewardType === 'COIN' ? <><CoinIcon size={14} /> จำนวน Coin</> : <><FiZap size={14} color="#ff5733" /> <span style={{color: '#ff5733'}}>จำนวน XP</span></>}
                  </label>
                  <input 
                    type="number" min="1" required 
                    className="premium-input" 
                    value={form.rewardType === 'COIN' ? form.coinReward : form.xpReward} 
                    onChange={e => set(form.rewardType === 'COIN' ? 'coinReward' : 'xpReward', e.target.value)} 
                    style={{ borderColor: form.rewardType === 'COIN' ? 'rgba(245,158,11,0.3)' : 'rgba(255,87,51,0.3)', fontSize: '2rem', height: '100px', textAlign: 'center', fontWeight: '900' }}
                  />
                </div>
              </div>
            </FormGroup>

            <FormGroup title="ข้อกำหนด (Requirements)" icon={<FiSettings />}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}><FiAward size={14} /> Rank ขั้นต่ำ</label>
                  <select className="premium-input" value={form.requiredRank} onChange={e => set('requiredRank', e.target.value)}>
                    <option value="All">ทุกระดับ</option>
                    <option value="Bronze">Bronze+</option>
                    <option value="Silver">Silver+</option>
                    <option value="Gold">Gold+</option>
                    <option value="Platinum">Platinum+</option>
                    <option value="Diamond">Diamond+</option>
                    <option value="Conqueror">Conqueror เท่านั้น</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}><FiUsers size={14} /> จำกัดคนรับ</label>
                  <input type="number" min="0" className="premium-input" value={form.maxParticipants} onChange={e => set('maxParticipants', e.target.value)} placeholder="0 = ไม่จำกัด" />
                </div>
                <div>
                  <label style={labelStyle}><FiClock size={14} /> เวลาทำ (วัน)</label>
                  <input type="number" min="0" className="premium-input" value={form.durationDays} onChange={e => set('durationDays', e.target.value)} placeholder="0 = ไม่จำกัด" />
                </div>
                <div>
                  <label style={labelStyle}><FiCalendar size={14} /> วันหมดอายุ</label>
                  <input
                    type="datetime-local"
                    className="premium-input"
                    value={form.expiresAt}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={e => set('expiresAt', e.target.value)}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
            </FormGroup>
          </div>

          {/* Submit Button spans both columns */}
          <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit" disabled={loading}
              style={{ 
                width: '100%',
                background: loading ? '#333' : 'linear-gradient(135deg, #f59e0b, #d97706)', 
                color: loading ? '#888' : '#000', 
                border: 'none', 
                padding: '20px', 
                borderRadius: '16px', 
                fontWeight: '900', 
                fontSize: '1.2rem', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                boxShadow: loading ? 'none' : '0 10px 30px -5px rgba(245,158,11,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}
            >
              {loading ? 'กำลังบันทึก...' : (
                <>
                  {editData ? <FiEdit3 size={24} /> : <FiStar size={24} />}
                  {editData ? 'บันทึกการแก้ไขเควส' : 'สร้างเควสใหม่ทันที'}
                </>
              )}
            </motion.button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}

export default CreateQuestModal;
