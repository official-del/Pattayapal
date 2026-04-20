import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/canvasUtils';
import { FiX, FiCheck, FiMaximize2, FiZoomIn } from 'react-icons/fi';

const ImageCropModal = ({ image, aspect, onCropComplete, onClose, title = "CROP IMAGE" }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = useCallback((crop) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteInternal = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImageBlob);
    } catch (e) {
      console.error(e);
      alert("Error cropping image");
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modalCard}>
        <div style={styles.header}>
          <h3 style={styles.title}>{title}</h3>
          <button onClick={onClose} style={styles.closeBtn}><FiX /></button>
        </div>

        <div style={styles.cropperContainer}>
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={onZoomChange}
          />
        </div>

        <div style={styles.controls}>
          <div style={styles.zoomZone}>
             <FiZoomIn style={{ color: '#888' }} />
             <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(e.target.value)}
                style={styles.slider}
              />
          </div>

          <div style={styles.actions}>
            <button onClick={onClose} style={styles.cancelBtn}>CANCEL</button>
            <button onClick={handleSave} style={styles.saveBtn}>
              <FiCheck /> APPLY CROP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, animation: 'fadeIn 0.3s ease'
  },
  modalCard: {
    background: 'rgba(15,15,15,0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '24px',
    width: '90%', maxWidth: '600px',
    height: '80vh',
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
    overflow: 'hidden'
  },
  header: {
    padding: '20px 24px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.05)'
  },
  title: { margin: 0, fontSize: '1rem', fontWeight: '700', letterSpacing: '2px', color: '#ff5733' },
  closeBtn: { background: 'none', border: 'none', color: '#555', fontSize: '1.5rem', cursor: 'pointer' },
  cropperContainer: {
    flex: 1, position: 'relative', background: '#000'
  },
  controls: {
    padding: '24px', background: '#0a0a0a', display: 'flex', flexDirection: 'column', gap: '20px'
  },
  zoomZone: { display: 'flex', alignItems: 'center', gap: '15px' },
  slider: { flex: 1, accentColor: '#ff5733', cursor: 'pointer' },
  actions: { display: 'flex', gap: '12px' },
  cancelBtn: {
    flex: 1, background: '#222', color: '#fff', border: 'none',
    padding: '12px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer'
  },
  saveBtn: {
    flex: 2, background: '#ff5733', color: '#fff', border: 'none',
    padding: '12px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
  }
};

export default ImageCropModal;
