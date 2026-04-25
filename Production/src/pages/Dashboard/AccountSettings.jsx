import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { usersAPI } from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUser, FiLock, FiGlobe, FiCheck, FiAlertTriangle, FiTrash2, 
  FiCamera, FiPhone, FiMail, FiMapPin, FiBriefcase, FiLink 
} from 'react-icons/fi';
import { getFullUrl } from '../../utils/mediaUtils';
import '../../css/AccountSettings.css';

const TABS = [
  { id: 'general', label: 'ทั่วไป', icon: <FiUser /> },
  { id: 'security', label: 'ความปลอดภัย', icon: <FiLock /> },
  { id: 'social', label: 'โซเชียลมีเดีย', icon: <FiGlobe /> },
];

function AccountSettings() {
  const { userInfo, setUserInfo, token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // フォームデータ (Profile)
  const [profileData, setProfileData] = useState({
    name: '',
    username: '',
    bio: '',
    profession: '',
    phone: '',
    address: '',
    gender: 'None'
  });

  // フォームデータ (Password)
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (userInfo) {
      setProfileData({
        name: userInfo.name || '',
        username: userInfo.username || '',
        bio: userInfo.bio || '',
        profession: userInfo.profession || '',
        phone: userInfo.phone || '',
        address: userInfo.address || '',
        gender: userInfo.gender || 'None'
      });
    }
  }, [userInfo]);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await usersAPI.updateProfile(profileData);
      setUserInfo(res.user);
      showMsg('success', 'อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว');
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดต');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return showMsg('error', 'รหัสผ่านใหม่ไม่ตรงกัน');
    }
    if (passwordData.newPassword.length < 6) {
      return showMsg('error', 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
    }

    try {
      setLoading(true);
      await usersAPI.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      showMsg('success', 'เปลี่ยนรหัสผ่านสำเร็จแล้ว');
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'รหัสผ่านเดิมไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setLoading(true);
      const res = await usersAPI.updateProfileImage(formData);
      setUserInfo({ ...userInfo, profileImage: res.profileImage });
      showMsg('success', 'เปลี่ยนรูปโปรไฟล์สำเร็จ');
    } catch (err) {
      showMsg('error', 'อัปโหลดรูปภาพไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-settings-container">
      {/* Header */}
      <header className="as-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
          <FiBriefcase color="var(--accent)" size={18} />
          <span style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: '900', letterSpacing: '5px' }}>DASHBOARD / SETTINGS</span>
        </div>
        <h2 className="as-title">ตั้งค่าบัญชี</h2>
      </header>

      {/* Main Grid */}
      <div className="as-grid">
        {/* Sidebar */}
        <aside className="as-sidebar">
          {TABS.map(tab => (
            <button 
              key={tab.id}
              className={`as-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
          <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
            <button className="as-nav-item" style={{ color: '#ef4444', width: '100%', borderColor: 'rgba(239,68,68,0.1)' }}>
              <FiTrash2 /> ขอลบบัญชี
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="as-content">
          <AnimatePresence mode="wait">
            {message.text && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ 
                  background: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  color: message.type === 'success' ? '#22c55e' : '#ef4444',
                  padding: '15px 25px', borderRadius: '15px', marginBottom: '30px',
                  fontWeight: '700', fontSize: '0.9rem', border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`
                }}
              >
                {message.type === 'success' ? <FiCheck /> : <FiAlertTriangle />} {message.text}
              </motion.div>
            )}

            {activeTab === 'general' && (
              <motion.div 
                key="general" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="as-section-title">ข้อมูลโปรไฟล์ทั่วไป</h3>
                
                {/* Avatar Section */}
                <div className="as-avatar-preview">
                  <div style={{ position: 'relative' }}>
                    <img src={getFullUrl(userInfo?.profileImage?.url) || 'https://via.placeholder.com/150'} className="as-avatar-img" alt="" />
                    <label className="as-upload-label" style={{ position: 'absolute', bottom: -5, right: -5, width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                      <FiCamera />
                      <input type="file" hidden onChange={handleImageUpload} accept="image/*" />
                    </label>
                  </div>
                  <div className="as-avatar-actions">
                    <span style={{ color: '#fff', fontWeight: '700' }}>รูปโปรไฟล์ของคุณ</span>
                    <span style={{ color: '#444', fontSize: '0.8rem' }}>แนะนำขนาด 400x400px เป็นไฟล์ JPG หรือ PNG</span>
                  </div>
                </div>

                <form onSubmit={handleProfileUpdate}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="as-form-group">
                      <label className="as-label">ชื่อที่แสดง</label>
                      <input 
                        type="text" className="as-input" 
                        value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})}
                      />
                    </div>
                    <div className="as-form-group">
                      <label className="as-label">ชื่อผู้ใช้งาน (Username)</label>
                      <input 
                        type="text" className="as-input" 
                        value={profileData.username} onChange={e => setProfileData({...profileData, username: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="as-form-group">
                    <label className="as-label">เกี่ยวกับคุณ (Bio)</label>
                    <textarea 
                      className="as-input as-textarea" 
                      value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="as-form-group">
                      <label className="as-label">อาชีพ / ทักษะหลัก</label>
                      <input 
                        type="text" className="as-input" 
                        value={profileData.profession} onChange={e => setProfileData({...profileData, profession: e.target.value})}
                      />
                    </div>
                    <div className="as-form-group">
                      <label className="as-label">เบอร์โทรศัพท์</label>
                      <input 
                        type="text" className="as-input" 
                        value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <button className="as-save-btn" type="submit" disabled={loading}>
                    {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                  </button>
                </form>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div 
                key="security" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="as-section-title">ความปลอดภัยของบัญชี</h3>
                <form onSubmit={handleChangePassword}>
                  <div className="as-form-group">
                    <label className="as-label">รหัสผ่านเดิม</label>
                    <input 
                      type="password" className="as-input" 
                      value={passwordData.oldPassword} onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div style={{ height: '30px' }} />

                  <div className="as-form-group">
                    <label className="as-label">รหัสผ่านใหม่</label>
                    <input 
                      type="password" className="as-input" 
                      value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                      required
                    />
                  </div>
                  <div className="as-form-group">
                    <label className="as-label">ยืนยันรหัสผ่านใหม่</label>
                    <input 
                      type="password" className="as-input" 
                      value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      required
                    />
                  </div>

                  <div className="as-security-info">
                    <FiAlertTriangle /> รหัสผ่านควรมีอย่างน้อย 6 ตัวอักษร และประกอบด้วยตัวอักษรและตัวเลข
                  </div>

                  <button className="as-save-btn" type="submit" disabled={loading}>
                    <FiLock /> {loading ? 'กำลังดำเนินการ...' : 'อัปเดตรหัสผ่าน'}
                  </button>
                </form>
              </motion.div>
            )}

            {activeTab === 'social' && (
              <motion.div 
                key="social" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="as-section-title">ช่องทางการติดต่อและโซเชียล</h3>
                <div className="as-form-group">
                  <label className="as-label">Facebook</label>
                  <div style={{ position: 'relative' }}>
                    <FiGlobe style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                    <input type="text" className="as-input" style={{ paddingLeft: '55px' }} placeholder="https://facebook.com/your-profile" />
                  </div>
                </div>
                <div className="as-form-group">
                  <label className="as-label">Instagram</label>
                  <div style={{ position: 'relative' }}>
                    <FiGlobe style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                    <input type="text" className="as-input" style={{ paddingLeft: '55px' }} placeholder="@your_instagram" />
                  </div>
                </div>
                <div className="as-form-group">
                  <label className="as-label">Website / Portfolio</label>
                  <div style={{ position: 'relative' }}>
                    <FiLink style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                    <input type="text" className="as-input" style={{ paddingLeft: '55px' }} placeholder="https://yourwebsite.com" />
                  </div>
                </div>

                <button className="as-save-btn" onClick={() => showMsg('success', 'บันทึกช่องทางโซเชียลแล้ว')}>
                  บันทึกข้อมูล
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default AccountSettings;
