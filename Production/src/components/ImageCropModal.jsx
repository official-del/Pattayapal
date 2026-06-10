import { toast } from 'react-hot-toast';
import { useCallback, useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/canvasUtils';
import { FiCheck, FiMaximize2, FiX, FiZoomIn } from 'react-icons/fi';

const ImageCropModal = ({ image, aspect, onCropComplete, onClose, title = 'Crop image' }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const onCropChange = useCallback((nextCrop) => {
    setCrop(nextCrop);
  }, []);

  const onCropCompleteInternal = useCallback((_, nextCroppedAreaPixels) => {
    setCroppedAreaPixels(nextCroppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImageBlob);
    } catch (error) {
      console.error(error);
      toast.error('Could not crop image. Please try again.');
    }
  };

  return (
    <div className="pp-crop-overlay" role="presentation">
      <section className="pp-crop-modal" role="dialog" aria-modal="true" aria-labelledby="crop-modal-title">
        <header className="pp-crop-header">
          <div>
            <span className="pp-crop-kicker">
              <FiMaximize2 />
              Image frame
            </span>
            <h3 id="crop-modal-title">{title}</h3>
          </div>
          <button type="button" className="pp-crop-close" onClick={onClose} aria-label="Close crop modal">
            <FiX />
          </button>
        </header>

        <div className="pp-crop-canvas">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={setZoom}
          />
        </div>

        <footer className="pp-crop-controls">
          <label className="pp-crop-zoom">
            <span>
              <FiZoomIn />
              Zoom
            </span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>

          <div className="pp-crop-actions">
            <button type="button" className="pp-button is-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="pp-button is-primary" onClick={handleSave}>
              <FiCheck />
              Apply crop
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
};

export default ImageCropModal;
