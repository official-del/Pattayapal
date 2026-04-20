import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { worksAPI, categoriesAPI } from '../../utils/api'; 
import { CONFIG } from '../../utils/config';
import VideoUploadForm from './VideoUploadForm';
import axios from 'axios';
import '../../css/AdminWorkForm.css';

export default function AdminWorkForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const mainImageInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEdit);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    type: searchParams.get('type') || 'image',
    mediaUrl: '',
    status: 'published',
    featured: false,
    showOnSlider: false,
  });

  const [albumImages, setAlbumImages] = useState([]);

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
        setFormData({
          title: data.title || '',
          category: data.category?._id || data.category || '',
          description: data.description || '',
          type: data.type || 'image',
          mediaUrl: data.mainImage?.url || data.mediaUrl || '',
          status: data.status || 'published',
          featured: data.featured || false,
          showOnSlider: data.showOnSlider || false,
        });
        if (data.album) setAlbumImages(data.album.map(img => ({ ...img, isNew: false })));
      }
    } catch (err) { console.error('Load failed', err); }
    finally { setPageLoading(false); }
  };

  // ── ☁️ ฟังก์ชันลบไฟล์จาก GCS (Helper) ──
  const deleteFileFromGCS = async (url) => {
    if (!url || !url.includes('storage.googleapis.com')) return;
    try {
      console.log("📡 [Frontend] กำลังยิงคำสั่งลบไปที่ Cloud:", url);
      await axios({
        method: 'delete',
        url: `${CONFIG.API_URL}/upload/delete`,
        data: { url: url },
        headers: { 'Content-Type': 'application/json' }
      });
      console.log("🗑️ ลบสำเร็จ!");
    } catch (err) {
      console.error("❌ ลบไฟล์ไม่สำเร็จ:", err.response?.data || err.message);
    }
  };
  // ── 🛠️ ฟังก์ชันอัปโหลดหลัก ──
  const handleMainImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImgUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      // ✅ ยิงไปที่ Backend ของเราเอง
      const res = await axios.post(`${CONFIG.API_URL}/upload/single`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log("✅ Main Image Uploaded:", res.data.url);
      setFormData(prev => ({ ...prev, mediaUrl: res.data.url }));
    } catch (err) {
      console.error("❌ Upload failed:", err);
      alert('อัปโหลดล้มเหลว: ' + (err.response?.data?.message || err.message));
    } finally {
      setImgUploading(false);
      // เคลียร์ค่า input เพื่อให้เลือกไฟล์เดิมซ้ำได้ถ้าต้องการ
      e.target.value = null;
    }
  };

  // ── 🖼️ จัดการอัลบั้ม ──
  const handleAlbumChange = (e) => {
    const files = Array.from(e.target.files);
    const newImgs = files.map(file => ({
      previewUrl: URL.createObjectURL(file),
      file: file,
      isNew: true
    }));
    setAlbumImages(prev => [...prev, ...newImgs]);
  };

  const removeAlbumItem = async (index) => {
    const target = albumImages[index];
    if (!target.isNew && (target.url || target.previewUrl)) {
      if (window.confirm("ต้องการลบรูปนี้ออกจาก Cloud จริงหรือไม่?")) {
        await deleteFileFromGCS(target.url || target.previewUrl);
      } else { return; }
    }
    setAlbumImages(prev => prev.filter((_, i) => i !== index));
  };

  // ── 💾 บันทึกข้อมูล ──
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.mediaUrl) return alert('กรุณาอัปโหลดสื่อหลักก่อนบันทึก');
    setLoading(true);

    const token = localStorage.getItem('token');
    const submitData = new FormData();

    // บีบอัดข้อมูลใส่ FormData
    Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
    submitData.append('mainImageUrl', formData.mediaUrl);

    // จัดการ Album
    const existingAlbum = albumImages.filter(img => !img.isNew);
    submitData.append('existingAlbum', JSON.stringify(existingAlbum));

    albumImages.forEach(img => {
      if (img.isNew && img.file) submitData.append('album', img.file);
    });

    try {
      if (isEdit) await worksAPI.update(id, submitData, token);
      else await worksAPI.create(submitData, token);

      // console.log("🚀 Project saved successfully!");
      navigate('/admin/dashboard');
    } catch (err) {
      console.error("❌ Save failed:", err);
      alert('บันทึกไม่สำเร็จ: ' + (err.response?.data?.message || 'API Error'));
    } finally { setLoading(false); }
  };

  if (pageLoading) return <div className="page-loader-full">กำลังดึงข้อมูล...</div>;

  return (
    <div className="work-form-page fadeIn">
      <header className="form-nav-header">
        <button onClick={() => navigate(-1)} className="btn-back-minimal">← ย้อนกลับ</button>
        <h1 className="form-main-title">{isEdit ? 'EDIT' : 'ADD'} {formData.type.toUpperCase()} PROJECT</h1>
      </header>

      <form className="hybrid-form-layout" onSubmit={handleSave}>
        {/* คอลัมน์ซ้าย: รายละเอียดโปรเจกต์ */}
        <div className="form-card info-card">
          <div className="field-group">
            <label>PROJECT TITLE</label>
            <input type="text" value={formData.title} required onChange={e => setFormData({ ...formData, title: e.target.value })} />
          </div>

          <div className="field-row">
            <div className="field-group">
              <label>CATEGORY</label>
              <select value={formData.category} required onChange={e => setFormData({ ...formData, category: e.target.value })}>
                <option value="">เลือกหมวดหมู่...</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label>STATUS</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                <option value="published">PUBLISHED</option>
                <option value="draft">DRAFT</option>
              </select>
            </div>
          </div>

          <div className="field-group">
            <label>DESCRIPTION</label>
            <textarea rows="8" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          </div>

          <div className="toggles-group" style={{ display: 'flex', gap: '20px' }}>
            <label className="featured-toggle">
              <input type="checkbox" checked={formData.featured} onChange={e => setFormData({ ...formData, featured: e.target.checked })} />
              <span className="slider"></span><span className="label-text">Featured Project</span>
            </label>
            <label className="featured-toggle">
              <input type="checkbox" checked={formData.showOnSlider} onChange={e => setFormData({ ...formData, showOnSlider: e.target.checked })} />
              <span className="slider"></span><span className="label-text" style={{ color: '#ff6b35' }}>Show on VideoSlider</span>
            </label>
          </div>
        </div>

        {/* คอลัมน์ขวา: สื่อและอัลบั้ม */}
        <div className="form-card media-card">
          <span className="section-label">GOOGLE CLOUD STORAGE CONTENT</span>

          {formData.type === 'video' ? (
            <div className="video-upload-area">
              {formData.mediaUrl ? (
                <div className="current-media-wrap">
                  <video src={formData.mediaUrl} controls className="edit-video-preview" />
                  <button
                    type="button"
                    className="btn-replace-media"
                    onClick={async () => {
                      if (window.confirm("ต้องการลบวิดีโอนี้ออกจาก Cloud ใช่หรือไม่?")) {
                        await deleteFileFromGCS(formData.mediaUrl);
                        setFormData({ ...formData, mediaUrl: '' });
                      }
                    }}
                  >↺ เปลี่ยนวิดีโอ</button>
                </div>
              ) : (
                <VideoUploadForm onComplete={url => setFormData({ ...formData, mediaUrl: url })} />
              )}
            </div>
          ) : (
            <div className={`image-dropzone ${formData.mediaUrl ? 'has-media' : ''}`}>
              {formData.mediaUrl ? (
                <div className="image-preview">
                  <img src={formData.mediaUrl} alt="preview" />
                  <div className="image-preview-overlay">
                    <button
                      type="button"
                      className="btn-change"
                      onClick={async () => {
                        if (window.confirm("ต้องการลบรูปภาพหลักออกจาก Cloud ใช่หรือไม่?")) {
                          await deleteFileFromGCS(formData.mediaUrl);
                          setFormData({ ...formData, mediaUrl: '' });
                        }
                      }}
                    >↺ เปลี่ยนรูปภาพหลัก</button>
                  </div>
                </div>
              ) : (
                <div className="image-label" onClick={() => !imgUploading && mainImageInputRef.current.click()} style={{ cursor: imgUploading ? 'not-allowed' : 'pointer' }}>
                  <input type="file" ref={mainImageInputRef} accept="image/*" onChange={handleMainImageUpload} hidden />
                  <div className="icon">{imgUploading ? '⏳' : '☁️'}</div>
                  <p>{imgUploading ? 'Uploading to GCS...' : 'CLICK TO UPLOAD MAIN IMAGE'}</p>
                </div>
              )}
            </div>
          )}

          {/* อัลบั้มรูปภาพ */}
          <div className="album-section-wrapper" style={{ marginTop: '30px' }}>
            <label className="section-label">PROJECT ALBUM (Gallery)</label>
            <div className="album-grid-display">
              {albumImages.map((img, i) => (
                <div key={i} className="album-tile">
                  <img src={img.url || img.previewUrl} alt="Album" />
                  <button type="button" className="btn-del-image" onClick={() => removeAlbumItem(i)}>×</button>
                </div>
              ))}
              <label className="album-tile add-box">
                <input type="file" multiple hidden accept="image/*" onChange={handleAlbumChange} />
                <span className="plus">+</span><p>ADD</p>
              </label>
            </div>
          </div>

          <div className="form-footer-actions">
            <button type="submit" className="btn-save-project" disabled={loading || imgUploading || !formData.mediaUrl}>
              {loading ? 'SAVING...' : isEdit ? '✓ UPDATE PROJECT' : '✓ SAVE & PUBLISH'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}