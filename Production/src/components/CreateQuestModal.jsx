import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
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
  maxClaims: 0,
  expiresAt: '',   // ISO string or empty
};

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
        maxClaims:    editData.maxClaims    ?? 0,
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

  // Shared input style
  const inputStyle = {
    width: '100%',
    background: '#111',
    border: '1px solid #2a2a2a',
    color: '#fff',
    padding: '11px 14px',
    borderRadius: '10px',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
  };
  const labelStyle = { display: 'block', marginBottom: '7px', color: '#999', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: '20px' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        style={{ background: '#0c0c0c', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', padding: '28px', position: 'relative' }}
      >
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: '18px', right: '18px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#888', cursor: 'pointer', borderRadius: '8px', padding: '6px', display: 'flex' }}>
          <FiX size={20} />
        </button>

        <h2 style={{ margin: '0 0 22px 0', fontSize: '1.35rem', fontWeight: '900', color: '#fff' }}>
          {editData ? '✏️ แก้ไขเควส' : '✨ สร้างเควสใหม่'}
        </h2>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '16px', fontWeight: '600' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Title */}
          <div>
            <label style={labelStyle}>ชื่อเควส</label>
            <input required value={form.title} onChange={e => set('title', e.target.value)} placeholder="เช่น จัดการโปรไฟล์ให้ครบ" style={inputStyle} />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>รายละเอียด</label>
            <textarea required value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="อธิบายขั้นตอนหรือเงื่อนไขสั้นๆ" style={{ ...inputStyle, resize: 'vertical', minHeight: '72px' }} />
          </div>

          {/* Task Type */}
          <div>
            <label style={labelStyle}>เงื่อนไขการสำเร็จ</label>
            <select value={form.taskType} onChange={e => set('taskType', e.target.value)} style={inputStyle}>
              <option value="MANUAL">Manual — กดรับได้เลย (ไม่ตรวจสอบ)</option>
              <option value="PROFILE_FULL">ตั้งค่าโปรไฟล์ครบ (Bio + รูปโปรไฟล์ + รูปหน้าปก)</option>
              <option value="POST_WORK">อัปโหลดผลงานอย่างน้อย 1 ชิ้น</option>
              <option value="DAILY_LOGIN">เข้าสู่ระบบรายวัน (รับได้ทุกวัน)</option>
              <option value="PROOF_SUBMISSION">Share / Social Proof (ต้องส่งลิงก์ตรวจสอบ)</option>
            </select>
            <p style={{ margin: '5px 0 0 0', fontSize: '0.72rem', color: '#555' }}>ระบบจะตรวจสอบเงื่อนไขอัตโนมัติเมื่อกดรับรางวัล</p>
          </div>

          {/* Reward Type */}
          <div>
            <label style={labelStyle}>ประเภทรางวัล</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['COIN', 'XP'].map(type => (
                <button
                  key={type} type="button"
                  onClick={() => set('rewardType', type)}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1.5px solid ${form.rewardType === type ? (type === 'COIN' ? '#f59e0b' : '#6366f1') : '#2a2a2a'}`, background: form.rewardType === type ? (type === 'COIN' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)') : 'transparent', color: form.rewardType === type ? (type === 'COIN' ? '#f59e0b' : '#6366f1') : '#555', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem' }}
                >
                  {type === 'COIN' ? <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CoinIcon size={16} /> Coins</div> : '⚡ XP'}
                </button>
              ))}
            </div>
          </div>

          {/* Reward Amount */}
          <div>
            <label style={labelStyle}>{form.rewardType === 'COIN' ? <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CoinIcon size={16} /> จำนวน Coin</div> : '⚡ จำนวน XP'}</label>
            {form.rewardType === 'COIN' ? (
              <input type="number" min="1" required value={form.coinReward} onChange={e => set('coinReward', e.target.value)} style={inputStyle} />
            ) : (
              <input type="number" min="1" required value={form.xpReward} onChange={e => set('xpReward', e.target.value)} style={inputStyle} />
            )}
          </div>

          {/* Rank & Max Claims */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Rank ขั้นต่ำ</label>
              <select value={form.requiredRank} onChange={e => set('requiredRank', e.target.value)} style={inputStyle}>
                <option value="All">ทุกระดับ</option>
                <option value="Bronze">Bronze+</option>
                <option value="Silver">Silver+</option>
                <option value="Gold">Gold+</option>
                <option value="Platinum">Platinum+</option>
                <option value="Diamond">Diamond+</option>
                <option value="Conqueror">Conqueror เท่านั้น</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>จำนวนสิทธิ์สูงสุด</label>
              <input type="number" min="0" value={form.maxClaims} onChange={e => set('maxClaims', e.target.value)} placeholder="0 = ไม่จำกัด" style={inputStyle} />
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label style={labelStyle}>วันหมดอายุ (ไม่บังคับ)</label>
            <input
              type="datetime-local"
              value={form.expiresAt}
              min={new Date().toISOString().slice(0, 16)}
              onChange={e => set('expiresAt', e.target.value)}
              style={{ ...inputStyle, colorScheme: 'dark' }}
            />
            {form.expiresAt ? (
              <p style={{ margin: '5px 0 0 0', fontSize: '0.72rem', color: '#f59e0b' }}>
                ⏰ เควสจะหมดอายุวันที่ {new Date(form.expiresAt).toLocaleString('th-TH')}
              </p>
            ) : (
              <p style={{ margin: '5px 0 0 0', fontSize: '0.72rem', color: '#555' }}>ไม่กำหนด = ไม่มีวันหมดอายุ</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit" disabled={loading}
            style={{ background: loading ? '#333' : 'linear-gradient(135deg,#f59e0b,#d97706)', color: loading ? '#888' : '#000', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '900', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px', transition: 'all 0.2s' }}
          >
            {loading ? 'กำลังบันทึก...' : (editData ? 'บันทึกการแก้ไข' : 'สร้างเควส')}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default CreateQuestModal;
