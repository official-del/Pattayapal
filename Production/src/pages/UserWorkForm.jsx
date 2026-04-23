import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { worksAPI, categoriesAPI } from '../utils/api';
import { CONFIG } from '../utils/config';
import VideoUploadForm from './Admin/VideoUploadForm';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { getFullUrl } from '../utils/mediaUtils';
import {
  FiArrowLeft, FiImage, FiVideo, FiPlus, FiCheckCircle,
  FiLoader, FiX, FiCheck, FiUploadCloud, FiTrash2, FiFileText, FiTag, FiZap, FiActivity
} from 'react-icons/fi';

function UserWorkForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);
  const isEdit = Boolean(id);

  const mainImageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pageLoading, setPageLoading] = useState(isEdit);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    type: searchParams.get('type') || 'image',
    mediaUrl: '',
    status: 'published',
  });

  const [albumImages, setAlbumImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    try {
      const cats = await categoriesAPI.getAll();
      setCategories(cats || []);
      if (isEdit) {
        const res = await worksAPI.getById(id);
        const data = res.work || res;

        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const creatorId = data.createdBy?._id || data.createdBy;
        const currentUserId = userInfo?._id || userInfo?.id;
        const isAdmin = userInfo?.role === 'admin';

        if (creatorId !== currentUserId && !isAdmin) {
          alert("คุณไม่มีสิทธิ์แก้ไขผลงานนี้");
          return navigate(-1);
        }

        setFormData({
          title: data.title || '',
          category: data.category?._id || data.category || '',
          description: data.description || '',
          type: data.type || 'image',
          mediaUrl: data.mainImage?.url || data.mediaUrl || '',
          status: data.status || 'published',
        });
        if (data.album) setAlbumImages(data.album.map(img => ({ ...img, isNew: false })));
      }
    } catch (err) { console.error('Load failed', err); }
    finally { setPageLoading(false); }
  };

  const handleMainImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImgUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await axios.post(`${CONFIG.API_BASE_URL}/api/upload/single`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, mediaUrl: res.data.url }));
    } catch (err) {
      alert('อัปโหลดล้มเหลว: ' + (err.response?.data?.message || err.message));
    } finally {
      setImgUploading(false);
      e.target.value = null;
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024 * 1024) return alert('ไฟล์วิดีโอต้องมีขนาดไม่เกิน 500MB');

    setVideoUploading(true);
    setUploadProgress(0);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await axios.post(`${CONFIG.API_BASE_URL}/api/upload/single`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / e.total);
          setUploadProgress(pct);
        }
      });
      setFormData(prev => ({ ...prev, mediaUrl: res.data.url }));
    } catch (err) {
      alert('อัปโหลดวิดีโอล้มเหลว: ' + (err.response?.data?.message || err.message));
    } finally {
      setVideoUploading(false);
      e.target.value = null;
    }
  };

  const handleAlbumChange = (e) => {
    const files = Array.from(e.target.files);
    const newImgs = files.map(file => ({
      previewUrl: URL.createObjectURL(file),
      file: file,
      isNew: true
    }));
    setAlbumImages(prev => [...prev, ...newImgs]);
  };

  const removeAlbumItem = (index) => {
    setAlbumImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!formData.mediaUrl) return alert('กรุณาอัปโหลดรูปภาพหลักหรืองานวิดีโอก่อนบันทึก');
    setLoading(true);

    const token = localStorage.getItem('userToken') || localStorage.getItem('token');
    const submitData = new FormData();

    Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
    submitData.append('mainImageUrl', formData.mediaUrl);

    const existingAlbum = albumImages.filter(img => !img.isNew);
    submitData.append('existingAlbum', JSON.stringify(existingAlbum));

    albumImages.forEach(img => {
      if (img.isNew && img.file) submitData.append('album', img.file);
    });

    try {
      if (isEdit) await worksAPI.update(id, submitData, token);
      else await worksAPI.create(submitData, token);
      navigate(`/dashboard/works`);
    } catch (err) {
      alert('บันทึกไม่สำเร็จ: ' + (err.response?.data?.message || 'API Error'));
    } finally { setLoading(false); }
  };

  if (pageLoading) return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'flex', flexFlow: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', gap: '20px' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '50px', height: '50px', border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }} />
      <span style={{ fontWeight: '700', letterSpacing: '4px', fontSize: '0.8rem' }}>กำลังเตรียมข้อมูลแบบฟอร์ม...</span>
    </div>
  );

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', paddingBottom: '150px' }}>

      {/* 🔮 Strategic Header */}
      <section className="form-header-section" style={{ padding: '120px 5% 60px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', width: '50px', height: '50px', borderRadius: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px' }}>
            <FiArrowLeft size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <FiZap color="var(--accent)" size={18} />
            <span style={{ color: 'var(--accent)', fontWeight: '700', letterSpacing: '5px', fontSize: '0.8rem' }}>UPLOAD DATA</span>
          </div>
          <h1 className="fluid-h1" style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', fontWeight: '700', margin: 0, letterSpacing: '-2px' }}>
            {isEdit ? 'แก้ไขผลงาน' : 'เพิ่มผลงานใหม่'}
          </h1>
          <p style={{ color: '#444', marginTop: '10px', fontWeight: '700' }}>แชร์ผลงานของคุณให้โลกเห็นในคลังข้อมูลอัจฉริยะ</p>
        </motion.div>
      </section>

      <form className="work-form-grid" onSubmit={handleSave} style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 5%', gap: '50px', alignItems: 'start' }}>

        {/* 🧬 Metadata Section */}
        <motion.section initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass form-card" style={{ padding: 'clamp(20px, 5vw, 50px)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px', color: '#333' }}>
            <FiFileText size={20} />
            <span style={{ fontWeight: '700', letterSpacing: '2px', fontSize: '0.75rem' }}>ข้อมูลพื้นฐาน</span>
          </div>

          <div style={{ marginBottom: '35px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#444', marginBottom: '15px', letterSpacing: '1px' }}>ชื่อผลงาน / PROJECT TITLE</label>
            <input
              type="text" value={formData.title} required onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="ระบุชื่อเรียกผลงานของคุณ"
              style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', padding: '20px', borderRadius: '20px', outline: 'none', fontWeight: '700' }}
            />
          </div>

          <div style={{ marginBottom: '35px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#444', marginBottom: '15px', letterSpacing: '1px' }}>หมวดหมู่ / CATEGORY</label>
            <select
              value={formData.category} required onChange={e => setFormData({ ...formData, category: e.target.value })}
              style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', padding: '20px', borderRadius: '20px', outline: 'none', fontWeight: '700', appearance: 'none' }}
            >
              <option value="">เลือกประเภทพอร์ตโฟลิโอ...</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#444', marginBottom: '15px', letterSpacing: '1px' }}>คำอธิบายงาน / STORIES</label>
            <textarea
              rows="10" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="เล่าเรื่องราวหรือเทคนิคที่คุณใช้ในโปรเจกต์นี้..."
              style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', padding: '20px', borderRadius: '20px', outline: 'none', fontWeight: '500', lineHeight: 1.6, resize: 'none' }}
            />
          </div>
        </motion.section>

        {/* 🎬 Media Assets Section */}
        <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass form-card" style={{ padding: 'clamp(20px, 5vw, 50px)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div className="media-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#333' }}>
              <FiUploadCloud size={20} />
              <span style={{ fontWeight: '700', letterSpacing: '2px', fontSize: '0.75rem' }}>ไฟล์มัลติมีเดีย</span>
            </div>

            {/* 🔀 Media Type Toggle */}
            {!isEdit && (
              <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '5px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {[
                  { type: 'image', label: 'รูปภาพ', icon: <FiImage size={14} /> },
                  { type: 'video', label: 'วิดีโอ', icon: <FiVideo size={14} /> },
                ].map(opt => (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: opt.type, mediaUrl: '' }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 22px', borderRadius: '15px', border: 'none', cursor: 'pointer',
                      fontWeight: '700', fontSize: '0.8rem', transition: '0.3s',
                      background: formData.type === opt.type ? 'var(--accent)' : 'transparent',
                      color: formData.type === opt.type ? '#fff' : '#555',
                      boxShadow: formData.type === opt.type ? '0 4px 15px var(--accent-glow)' : 'none'
                    }}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* UI สำหรับอัปโหลด */}
          <div style={{ marginBottom: '40px' }}>
            {formData.type === 'video' ? (
              formData.mediaUrl ? (
                <div style={{ borderRadius: '30px', overflow: 'hidden', position: 'relative' }}>
                  <video src={getFullUrl(formData.mediaUrl)} controls style={{ width: '100%', display: 'block' }} />
                  <button type="button" onClick={() => setFormData({ ...formData, mediaUrl: '' })} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: '700', fontSize: '0.75rem', backdropFilter: 'blur(10px)' }}>เปลี่ยนวิดีโอ</button>
                </div>
              ) : videoUploading ? (
                <div style={{ border: '2px dashed rgba(255,87,51,0.3)', borderRadius: '30px', padding: '80px 40px', textAlign: 'center' }}>
                  <FiLoader className="spin" size={40} color="var(--accent)" />
                  <p style={{ marginTop: '20px', fontWeight: '700', color: '#fff' }}>กำลังอัปโหลด... {uploadProgress}%</p>
                  <div style={{ marginTop: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', height: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--accent)', borderRadius: '10px', transition: 'width 0.3s' }} />
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => videoInputRef.current.click()}
                  style={{ border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '30px', padding: '80px 40px', textAlign: 'center', cursor: 'pointer', transition: '0.3s' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                >
                  <input type="file" ref={videoInputRef} accept="video/*" onChange={handleVideoUpload} hidden />
                  <FiVideo size={40} color="#222" />
                  <p style={{ marginTop: '20px', fontWeight: '700', color: '#fff' }}>อัปโหลดไฟล์วิดีโอ</p>
                  <span style={{ fontSize: '0.8rem', color: '#444' }}>MP4, MOV, WebM (ขนาดไม่เกิน 500MB)</span>
                </div>
              )
            ) : (
              formData.mediaUrl ? (
                <div style={{ borderRadius: '30px', overflow: 'hidden', position: 'relative' }}>
                  <img src={getFullUrl(formData.mediaUrl)} alt="Main" style={{ width: '100%', display: 'block' }} />
                  <button type="button" onClick={() => setFormData({ ...formData, mediaUrl: '' })} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: '700', fontSize: '0.75rem', backdropFilter: 'blur(10px)' }}>เปลี่ยนรูปภาพ</button>
                </div>
              ) : (
                <div
                  onClick={() => !imgUploading && mainImageInputRef.current.click()}
                  style={{ border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '30px', padding: '80px 40px', textAlign: 'center', cursor: 'pointer', transition: '0.3s' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                >
                  <input type="file" ref={mainImageInputRef} accept="image/*" onChange={handleMainImageUpload} hidden />
                  {imgUploading ? <FiLoader className="spin" size={40} color="var(--accent)" /> : <FiImage size={40} color="#222" />}
                  <p style={{ marginTop: '20px', fontWeight: '700', color: '#fff' }}>อัปโหลดรูปภาพหลัก</p>
                  <span style={{ fontSize: '0.8rem', color: '#444' }}>JPG, PNG หรือ WebP (ขนาดไม่เกิน 10MB)</span>
                </div>
              )
            )}
          </div>

          {/* อัลบั้มรูปเพิ่มเติม (ถ้าเป็นภาพ) */}
          {formData.type === 'image' && (
            <div style={{ marginTop: '40px', padding: '40px', background: 'rgba(255,255,255,0.01)', borderRadius: '35px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#444', marginBottom: '25px', letterSpacing: '1px' }}>รูปภาพในอัลบั้มเพิ่มเติม / ALBUM SCAN</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px' }}>
                {albumImages.map((img, i) => (
                  <div key={i} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '15px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <img src={img.previewUrl || getFullUrl(img.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => removeAlbumItem(i)} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(239,68,68,0.8)', border: 'none', color: '#fff', width: '25px', height: '25px', borderRadius: '5px', cursor: 'pointer' }}><FiX /></button>
                  </div>
                ))}
                <label style={{ aspectRatio: '1/1', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <input type="file" multiple hidden accept="image/*" onChange={handleAlbumChange} />
                  <FiPlus color="#222" />
                </label>
              </div>
            </div>
          )}

          {/* บุ่มบันทึก */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02, boxShadow: '0 0 40px var(--accent-glow)' }}
            disabled={loading || imgUploading || videoUploading || !formData.mediaUrl}
            style={{ width: '100%', marginTop: '60px', background: 'var(--accent)', color: '#fff', border: 'none', padding: '22px', borderRadius: '25px', fontWeight: '700', fontSize: '1.1rem', cursor: (loading || imgUploading || videoUploading || !formData.mediaUrl) ? 'not-allowed' : 'pointer', opacity: (loading || imgUploading || videoUploading || !formData.mediaUrl) ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}
          >
            {loading ? <FiLoader className="spin" /> : <FiCheckCircle />}
            <span>{isEdit ? 'บันทึกการแก้ไข' : 'ยืนยันและเผยแพร่ผลงาน'}</span>
          </motion.button>

        </motion.section>

      </form>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        select option { background: #000; color: #fff; }
        .work-form-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
        }
        @media (max-width: 1200px) {
          .work-form-grid { grid-template-columns: 1fr; }
          .form-header-section { padding-top: 80px !important; }
        }
        @media (max-width: 600px) {
          .media-section-header { flex-direction: column; align-items: flex-start !important; }
          .glass.form-card { border-radius: 20px !important; }
        }
      `}</style>
    </div>
  );
}

export default UserWorkForm;
