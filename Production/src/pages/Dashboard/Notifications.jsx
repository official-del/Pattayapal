import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { notificationsAPI } from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { getFullUrl } from '../../utils/mediaUtils';
import {
  FiBell, FiBriefcase, FiDollarSign, FiInfo, FiCheck, FiTrash2,
  FiCheckCircle, FiFilter, FiZap
} from 'react-icons/fi';

const TABS = [
  { key: 'all', label: 'ทั้งหมด', icon: <FiBell /> },
  { key: 'job', label: 'งาน', icon: <FiBriefcase /> },
  { key: 'payment', label: 'การเงิน', icon: <FiDollarSign /> },
  { key: 'system', label: 'ระบบ', icon: <FiInfo /> },
];

const TYPE_MAP = {
  job: { color: '#6366f1', bg: 'rgba(99,102,241,0.08)', icon: <FiBriefcase size={16} /> },
  payment: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: <FiDollarSign size={16} /> },
  system: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', icon: <FiInfo size={16} /> },
  friend: { color: '#ec4899', bg: 'rgba(236,72,153,0.08)', icon: <FiZap size={16} /> },
};

function Notifications() {
  const { token } = useContext(AuthContext);
  const currentToken = token || localStorage.getItem('userToken') || localStorage.getItem('token');

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchNotifications = async () => {
    if (!currentToken) return;
    try {
      setLoading(true);
      const data = await notificationsAPI.getMine(currentToken);
      setNotifications(data);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, [currentToken]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead(currentToken);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) { console.error(err); }
  };

  const handleMarkOne = async (id) => {
    try {
      await notificationsAPI.markAsRead(id, currentToken);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await notificationsAPI.delete(id, currentToken);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) { console.error(err); }
  };

  const filtered = activeTab === 'all'
    ? notifications
    : notifications.filter(n => n.type === activeTab);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <header style={{ marginBottom: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <FiBell color="var(--accent)" size={16} />
            <span style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '4px' }}>NOTIFICATIONS</span>
          </div>
          <h2 style={{ fontSize: '3rem', fontWeight: '700', margin: 0, letterSpacing: '-2px', lineHeight: 1 }}>
            ศูนย์แจ้งเตือน
          </h2>
          <p style={{ color: '#444', marginTop: '15px', fontWeight: '700', fontSize: '0.9rem' }}>
            {unreadCount > 0 ? `คุณมี ${unreadCount} รายการใหม่ที่ยังไม่ได้อ่าน` : 'คุณได้อ่านรายการทั้งหมดเรียบร้อยแล้ว ✓'}
          </p>
        </div>

        {unreadCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={handleMarkAllRead}
            style={{
              background: 'rgba(34, 197, 94, 0.08)', color: '#22c55e',
              border: '1px solid rgba(34,197,94,0.15)', padding: '14px 28px',
              borderRadius: '20px', cursor: 'pointer', fontWeight: '700',
              fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px',
              transition: '0.3s'
            }}
          >
            <FiCheckCircle /> Read All
          </motion.button>
        )}
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '40px', flexWrap: 'wrap' }}>
        {TABS.map(tab => {
          const count = tab.key === 'all'
            ? notifications.length
            : notifications.filter(n => n.type === tab.key).length;
          const isActive = activeTab === tab.key;
          return (
            <motion.button
              key={tab.key}
              whileHover={{ scale: 1.03 }}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 24px', borderRadius: '20px', cursor: 'pointer', fontWeight: '700',
                fontSize: '0.85rem', border: `1px solid ${isActive ? 'rgba(255,87,51,0.2)' : 'rgba(255,255,255,0.04)'}`,
                background: isActive ? 'rgba(255,87,51,0.08)' : 'rgba(255,255,255,0.01)',
                color: isActive ? 'var(--accent)' : '#666', transition: '0.3s'
              }}
            >
              {tab.icon} {tab.label}
              {count > 0 && (
                <span style={{
                  background: isActive ? 'var(--accent)' : '#1a1a1a',
                  color: isActive ? '#fff' : '#555',
                  padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem'
                }}>{count}</span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}
            style={{ width: '40px', height: '40px', border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 20px' }} />
          <p style={{ color: '#444', fontWeight: '700', letterSpacing: '3px', fontSize: '0.8rem' }}>Loading Data...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px 40px', background: 'rgba(255,255,255,0.01)', borderRadius: '40px', border: '1px dashed rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '20px', color: '#111' }}><FiBell /></div>
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>ไม่มีการแจ้งเตือน</h3>
          <p style={{ color: '#444', marginTop: '8px', fontWeight: '700' }}>เมื่อมีการอัปเดตใหม่ จะปรากฏขึ้นที่นี่</p>
        </div>
      ) : (
        <AnimatePresence>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map((notif) => {
              const typeStyle = TYPE_MAP[notif.type] || TYPE_MAP['system'];
              return (
                <motion.div
                  key={notif._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '20px',
                    padding: '22px 28px', borderRadius: '24px',
                    border: `1px solid ${notif.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(255,87,51,0.08)'}`,
                    background: notif.isRead ? 'rgba(255,255,255,0.01)' : 'rgba(255,87,51,0.02)',
                    transition: '0.3s', position: 'relative', overflow: 'hidden'
                  }}
                >
                  {/* Unread dot */}
                  {!notif.isRead && (
                    <div style={{
                      position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                      width: '3px', height: '60%', background: 'var(--accent)',
                      borderRadius: '0 3px 3px 0'
                    }} />
                  )}

                  {/* Avatar / Icon */}
                  <div style={{ flexShrink: 0 }}>
                    {notif.sender?.profileImage?.url ? (
                      <img
                        src={getFullUrl(notif.sender.profileImage.url)}
                        style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.05)' }}
                        alt=""
                      />
                    ) : (
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: typeStyle.bg, border: `1px solid ${typeStyle.color}22`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: typeStyle.color
                      }}>
                        {typeStyle.icon}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: notif.isRead ? '500' : '900', fontSize: '0.95rem', color: notif.isRead ? '#777' : '#fff', lineHeight: '1.4' }}>
                      {notif.text}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#333', fontWeight: '700' }}>
                        {new Date(notif.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                      <span style={{
                        fontSize: '0.65rem', fontWeight: '700', padding: '2px 10px', borderRadius: '10px',
                        background: typeStyle.bg, color: typeStyle.color
                      }}>
                        {notif.type?.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {!notif.isRead && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        onClick={() => handleMarkOne(notif._id)}
                        title="ทำเครื่องหมายว่าอ่านแล้ว"
                        style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.1)', color: '#22c55e', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <FiCheck size={14} />
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      onClick={() => handleDelete(notif._id)}
                      title="ลบ"
                      style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.08)', color: '#ef4444', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <FiTrash2 size={14} />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}

export default Notifications;
