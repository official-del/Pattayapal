import { toast } from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { worksAPI, categoriesAPI } from '../utils/api';
import { CONFIG } from '../utils/config';
import axios from 'axios';
import { motion } from 'framer-motion';
import { getFullUrl } from '../utils/mediaUtils';
import {
  FiArrowLeft,
  FiImage,
  FiVideo,
  FiPlus,
  FiCheckCircle,
  FiX,
  FiUploadCloud,
  FiFileText,
  FiTag,
  FiZap,
  FiLayers,
} from 'react-icons/fi';
import PremiumLoader from '../components/PremiumLoader';
import CustomSelect from '../components/CustomSelect';
import '../css/WorkForm.css';

function UserWorkForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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

        const userInfo = JSON.parse(window.safeStorage.getItem('userInfo'));
        const creatorId = data.createdBy?._id || data.createdBy;
        const currentUserId = userInfo?._id || userInfo?.id;
        const isAdmin = userInfo?.role === 'admin';

        if (creatorId !== currentUserId && !isAdmin) {
          toast.error('You do not have permission to edit this work.');
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

        if (data.album) {
          setAlbumImages(data.album.map((img) => ({ ...img, isNew: false })));
        }
      }
    } catch (err) {
      console.error('Load failed', err);
      toast.error('Unable to prepare the work form.');
    } finally {
      setPageLoading(false);
    }
  };

  const handleMainImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImgUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const token = window.safeStorage.getItem('token') || window.safeStorage.getItem('userToken');
      const res = await axios.post(`${CONFIG.API_BASE_URL}/api/upload/single`, uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
          'x-auth-token': token,
        },
      });
      setFormData((prev) => ({ ...prev, mediaUrl: res.data.url }));
    } catch (err) {
      toast.error(`Image upload failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setImgUploading(false);
      e.target.value = null;
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setVideoUploading(true);
    setUploadProgress(0);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const token = window.safeStorage.getItem('token') || window.safeStorage.getItem('userToken');
      const res = await axios.post(`${CONFIG.API_BASE_URL}/api/upload/single`, uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
          'x-auth-token': token,
        },
        onUploadProgress: (event) => {
          const pct = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(pct);
        },
      });
      setFormData((prev) => ({ ...prev, mediaUrl: res.data.url }));
    } catch (err) {
      toast.error(`Video upload failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setVideoUploading(false);
      e.target.value = null;
    }
  };

  const handleAlbumChange = (e) => {
    const files = Array.from(e.target.files);

    if (albumImages.length + files.length > 10) {
      toast.error('You can upload up to 10 album assets.');
      const availableSlots = 10 - albumImages.length;
      if (availableSlots <= 0) return;
      files.splice(availableSlots);
    }

    const newFiles = files.map((file) => ({
      previewUrl: URL.createObjectURL(file),
      file,
      type: file.type.startsWith('video') ? 'video' : 'image',
      isNew: true,
    }));

    setAlbumImages((prev) => [...prev, ...newFiles]);
    e.target.value = null;
  };

  const removeAlbumItem = (index) => {
    setAlbumImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!formData.category) return toast.error('Choose a portfolio category before saving.');
    if (!formData.mediaUrl) return toast.error('Upload a cover image or video before saving.');
    setLoading(true);

    const token = window.safeStorage.getItem('userToken') || window.safeStorage.getItem('token');
    const submitData = new FormData();

    Object.keys(formData).forEach((key) => submitData.append(key, formData[key]));
    submitData.append('mainImageUrl', formData.mediaUrl);

    const existingAlbum = albumImages.filter((img) => !img.isNew);
    submitData.append('existingAlbum', JSON.stringify(existingAlbum));

    albumImages.forEach((img) => {
      if (img.isNew && img.file) submitData.append('album', img.file);
    });

    try {
      if (isEdit) await worksAPI.update(id, submitData, token);
      else await worksAPI.create(submitData, token);
      toast.success(isEdit ? 'Work updated.' : 'Work published.');
      navigate('/dashboard/works');
    } catch (err) {
      toast.error(`Save failed: ${err.response?.data?.message || 'API Error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <PremiumLoader
        text="Preparing Form..."
        subtext="Loading creator work data..."
      />
    );
  }

  const isBusy = loading || imgUploading || videoUploading;
  const isVideo = formData.type === 'video';
  const canSubmit = Boolean(formData.mediaUrl) && !isBusy;
  const categoryOptions = categories.map((category) => ({
    value: category._id,
    label: category.name,
  }));

  return (
    <main className="work-form-page">
      <section className="work-form-shell">
        <motion.header
          className="work-form-header"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button type="button" className="work-form-back" onClick={() => navigate(-1)}>
            <FiArrowLeft />
            <span>Back</span>
          </button>

          <div className="work-form-title-row">
            <div>
              <div className="work-form-kicker">
                <FiZap />
                <span>{isEdit ? 'Edit Work' : 'Upload Work'}</span>
              </div>
              <h1>{isEdit ? 'Edit creator work' : 'Publish creator work'}</h1>
              <p>
                {isEdit
                  ? 'Update the title, category, story, cover media, and supporting assets for this portfolio item.'
                  : 'Create a polished portfolio item with a clear title, category, story, cover media, and optional album assets.'}
              </p>
            </div>
            <div className="work-form-hud">
              <span>Status</span>
              <strong>{formData.status}</strong>
            </div>
          </div>
        </motion.header>

        <form className="work-form-grid" onSubmit={handleSave}>
          <motion.section
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            className="work-form-card"
          >
            <div className="work-form-card-head">
              <FiFileText />
              <div>
                <span>Basic Data</span>
                <h2>Project information</h2>
              </div>
            </div>

            <label className="work-field">
              <span>Project title</span>
              <input
                type="text"
                value={formData.title}
                required
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Name this work"
              />
            </label>

            <div className="work-field">
              <span>Category</span>
              <CustomSelect
                className="work-category-select"
                value={formData.category}
                onChange={(nextCategory) => setFormData({ ...formData, category: nextCategory })}
                options={categoryOptions}
                placeholder="Choose a portfolio category..."
              />
            </div>

            <label className="work-field">
              <span>Work story</span>
              <textarea
                rows="9"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the concept, technique, tools, or result..."
              />
            </label>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            className="work-form-card is-media"
          >
            <div className="work-form-card-head is-between">
              <div>
                <FiUploadCloud />
                <div>
                  <span>Media Assets</span>
                  <h2>Cover and album</h2>
                </div>
              </div>

              {!isEdit && (
                <div className="media-type-toggle" role="group" aria-label="Media type">
                  {[
                    { type: 'image', label: 'Image', icon: <FiImage /> },
                    { type: 'video', label: 'Video', icon: <FiVideo /> },
                  ].map((option) => (
                    <button
                      key={option.type}
                      type="button"
                      className={formData.type === option.type ? 'is-active' : ''}
                      onClick={() => setFormData((prev) => ({ ...prev, type: option.type, mediaUrl: '' }))}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <section className="cover-upload-area">
              {isVideo ? (
                formData.mediaUrl ? (
                  <div className="cover-preview">
                    <video src={getFullUrl(formData.mediaUrl)} controls />
                    <button type="button" onClick={() => setFormData({ ...formData, mediaUrl: '' })}>Change video</button>
                  </div>
                ) : videoUploading ? (
                  <div className="upload-dropzone is-loading">
                    <PremiumLoader bare size="small" />
                    <p>Uploading video... {uploadProgress}%</p>
                    <div className="upload-progress"><span style={{ transform: `scaleX(${uploadProgress / 100})` }} /></div>
                  </div>
                ) : (
                  <button type="button" className="upload-dropzone" onClick={() => videoInputRef.current.click()}>
                    <input type="file" ref={videoInputRef} accept="video/*" onChange={handleVideoUpload} hidden />
                    <FiVideo />
                    <strong>Upload video file</strong>
                    <span>MP4, MOV, or WebM</span>
                  </button>
                )
              ) : (
                formData.mediaUrl ? (
                  <div className="cover-preview">
                    <img src={getFullUrl(formData.mediaUrl)} alt="Main work cover" />
                    <button type="button" onClick={() => setFormData({ ...formData, mediaUrl: '' })}>Change image</button>
                  </div>
                ) : (
                  <button type="button" className="upload-dropzone" onClick={() => !imgUploading && mainImageInputRef.current.click()}>
                    <input type="file" ref={mainImageInputRef} accept="image/*" onChange={handleMainImageUpload} hidden />
                    {imgUploading ? <PremiumLoader bare size="small" /> : <FiImage />}
                    <strong>{imgUploading ? 'Uploading image...' : 'Upload cover image'}</strong>
                    <span>JPG, PNG, or WebP</span>
                  </button>
                )
              )}
            </section>

            <section className="album-panel">
              <div className="album-head">
                <div>
                  <span><FiLayers /> Album Assets</span>
                  <p>Optional supporting images or videos. Maximum 10 files.</p>
                </div>
                <strong>{albumImages.length}/10</strong>
              </div>

              <div className="album-grid">
                {albumImages.map((item, index) => {
                  const isAlbumVideo = item.type === 'video' || (item.url && /\.(mp4|mov|webm)$/i.test(item.url));
                  return (
                    <div key={item.url || item.previewUrl || index} className="album-tile">
                      {isAlbumVideo ? (
                        <video src={item.previewUrl || getFullUrl(item.url)} />
                      ) : (
                        <img src={item.previewUrl || getFullUrl(item.url)} alt="" />
                      )}
                      {isAlbumVideo && <span className="album-video-mark"><FiVideo /></span>}
                      <button type="button" onClick={() => removeAlbumItem(index)} aria-label="Remove asset">
                        <FiX />
                      </button>
                    </div>
                  );
                })}

                {albumImages.length < 10 && (
                  <label className="album-add-tile">
                    <input type="file" multiple hidden accept="image/*,video/*" onChange={handleAlbumChange} />
                    <FiPlus />
                  </label>
                )}
              </div>
            </section>

            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              disabled={!canSubmit}
              className="work-submit-btn"
            >
              {loading ? <PremiumLoader bare size="tiny" /> : <FiCheckCircle />}
              <span>{isEdit ? 'Save changes' : 'Publish work'}</span>
            </motion.button>
          </motion.section>
        </form>
      </section>
    </main>
  );
}

export default UserWorkForm;
