import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { calendarAPI } from '../utils/api';
import { FiChevronLeft, FiChevronRight, FiSave, FiCalendar, FiInfo } from 'react-icons/fi';

const DAY_LABELS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const MONTH_NAMES_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function AvailabilityCalendar({ userId, isOwner }) {
  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [busyDates, setBusyDates] = useState(new Set());
  const [pendingDates, setPendingDates] = useState(new Set()); // local edits
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  // Load busy dates
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    calendarAPI.getBusyDates(userId)
      .then(({ busyDates: dates }) => {
        const set = new Set(dates || []);
        setBusyDates(set);
        setPendingDates(new Set(set));
        setHasPendingChanges(false);
      })
      .catch(() => toast.error('โหลดปฏิทินไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [userId]);

  // Navigate months
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Toggle a day
  const toggleDay = useCallback((dateStr) => {
    if (!isOwner) return;
    const d = new Date(dateStr + 'T00:00:00');
    const t = new Date(todayStr + 'T00:00:00');
    if (d < t) return; // อดีตแตะไม่ได้

    setPendingDates(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
    setHasPendingChanges(true);
  }, [isOwner, todayStr]);

  // Save
  const handleSave = async () => {
    setSaving(true);
    try {
      const { busyDates: saved } = await calendarAPI.updateBusyDates([...pendingDates]);
      const set = new Set(saved);
      setBusyDates(set);
      setPendingDates(new Set(set));
      setHasPendingChanges(false);
      toast.success('บันทึกปฏิทินสำเร็จ', {
        style: { borderRadius: '10px', background: '#1a1a1a', color: '#fff' }
      });
    } catch {
      toast.error('บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to complete grid
  while (cells.length % 7 !== 0) cells.push(null);

  const monthKey = `${year}-${month}`;

  // Stats for current month
  const busyInMonth = [...pendingDates].filter(d => {
    const [y, m] = d.split('-').map(Number);
    return y === year && m === month + 1;
  }).length;
  const freeInMonth = daysInMonth - busyInMonth;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: '20px', alignItems: 'center',
        marginBottom: '24px', flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)' }} />
          <span style={{ fontSize: '0.78rem', color: '#888', fontWeight: '600' }}>ว่าง ({freeInMonth} วัน)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)' }} />
          <span style={{ fontSize: '0.78rem', color: '#888', fontWeight: '600' }}>ไม่ว่าง ({busyInMonth} วัน)</span>
        </div>
        {isOwner && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            <FiInfo size={13} style={{ color: '#555' }} />
            <span style={{ fontSize: '0.72rem', color: '#555', fontWeight: '600' }}>คลิกวันเพื่อ mark ไม่ว่าง</span>
          </div>
        )}
      </div>

      {/* Calendar Card */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '24px',
        overflow: 'hidden'
      }}>

        {/* Month Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(255,255,255,0.02)'
        }}>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={prevMonth}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <FiChevronLeft size={18} />
          </motion.button>

          <AnimatePresence mode="wait">
            <motion.div
              key={monthKey}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontWeight: '900', fontSize: '1.1rem', color: '#fff', letterSpacing: '-0.5px' }}>
                {MONTH_NAMES_TH[month]}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#555', fontWeight: '700', marginTop: '2px' }}>
                {year + 543}
              </div>
            </motion.div>
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={nextMonth}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <FiChevronRight size={18} />
          </motion.button>
        </div>

        {/* Day Labels */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          padding: '12px 16px 4px',
          borderBottom: '1px solid rgba(255,255,255,0.04)'
        }}>
          {DAY_LABELS.map((label, i) => (
            <div
              key={label}
              style={{
                textAlign: 'center',
                fontSize: '0.7rem',
                fontWeight: '800',
                color: i === 0 ? '#ef4444' : i === 6 ? '#6366f1' : '#444',
                padding: '4px 0',
                letterSpacing: '0.5px'
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#444', fontSize: '0.85rem' }}>
            กำลังโหลด...
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={monthKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '4px', padding: '12px 16px 16px'
              }}
            >
              {cells.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} />;

                const dateStr = toDateStr(year, month, day);
                const isPast = dateStr < todayStr;
                const isToday = dateStr === todayStr;
                const isBusy = pendingDates.has(dateStr);
                const isSunday = (idx % 7) === 0;
                const isSaturday = (idx % 7) === 6;

                let bg = 'transparent';
                let borderColor = 'transparent';
                let textColor = isPast ? '#333' : isSunday ? '#ef4444' : isSaturday ? '#6366f1' : '#bbb';
                let dotColor = null;

                if (isToday) {
                  borderColor = 'var(--accent, #ff5733)';
                  textColor = 'var(--accent, #ff5733)';
                }
                if (isBusy) {
                  bg = 'rgba(239,68,68,0.12)';
                  borderColor = 'rgba(239,68,68,0.4)';
                  textColor = '#ef4444';
                  dotColor = '#ef4444';
                }

                return (
                  <motion.button
                    key={dateStr}
                    whileHover={isOwner && !isPast ? { scale: 1.08, background: isBusy ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)' } : {}}
                    whileTap={isOwner && !isPast ? { scale: 0.93 } : {}}
                    onClick={() => toggleDay(dateStr)}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      background: bg,
                      border: `1px solid ${borderColor}`,
                      borderRadius: '10px',
                      color: textColor,
                      fontWeight: isToday || isBusy ? '800' : '600',
                      fontSize: '0.82rem',
                      cursor: isOwner && !isPast ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexDirection: 'column', gap: '2px',
                      opacity: isPast ? 0.3 : 1,
                      transition: 'background 0.15s ease, border-color 0.15s ease',
                      padding: 0,
                    }}
                    title={isBusy ? `${dateStr} — ไม่ว่าง` : `${dateStr} — ว่าง`}
                  >
                    {day}
                    {dotColor && (
                      <div style={{
                        width: '4px', height: '4px', borderRadius: '50%',
                        background: dotColor, flexShrink: 0
                      }} />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Save Button (owner only, with pending changes) */}
      <AnimatePresence>
        {isOwner && hasPendingChanges && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}
          >
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'var(--accent, #ff5733)',
                color: '#fff', border: 'none',
                padding: '10px 24px', borderRadius: '12px',
                fontWeight: '800', fontSize: '0.88rem', cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                boxShadow: '0 4px 20px rgba(255,87,51,0.3)'
              }}
            >
              <FiSave size={16} />
              {saving ? 'กำลังบันทึก...' : 'บันทึกปฏิทิน'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Read-only notice for visitors */}
      {!isOwner && (
        <div style={{
          marginTop: '16px', textAlign: 'center',
          fontSize: '0.75rem', color: '#444', fontWeight: '600'
        }}>
          <FiCalendar size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          ปฏิทินนี้อัปเดตโดย {profile?.name || 'freelancer'} — แดงคือไม่ว่าง
        </div>
      )}
    </div>
  );
}
