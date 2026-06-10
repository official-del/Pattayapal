import { toast } from 'react-hot-toast';
import { FiAlertCircle, FiImage, FiUploadCloud, FiVideo } from 'react-icons/fi';

export default function MediaUploader({ onUploadSuccess }) {
  const handleUpload = () => {
    if (!window.cloudinary) {
      toast.error('Upload widget is not ready. Refresh the page and try again.');
      return;
    }

    window.cloudinary.openUploadWidget(
      {
        cloudName: 'YOUR_CLOUD_NAME',
        uploadPreset: 'YOUR_PRESET',
        sources: ['local', 'url', 'camera'],
        resourceType: 'auto',
        multiple: true,
        clientAllowedFormats: ['png', 'jpg', 'jpeg', 'mp4', 'mov'],
        maxFileSize: 104857600,
      },
      (error, result) => {
        if (error) {
          toast.error('Upload failed. Please try again.');
          return;
        }

        if (result?.event === 'success') {
          onUploadSuccess?.(result.info);
        }
      },
    );
  };

  return (
    <section className="pp-media-uploader" aria-label="Media upload">
      <div className="pp-media-uploader-icon">
        <FiUploadCloud />
      </div>
      <div className="pp-media-uploader-copy">
        <span className="pp-media-uploader-kicker">Media station</span>
        <strong>Upload image or video</strong>
        <p>Supports MP4, MOV, JPG, and PNG up to 100MB.</p>
        <div className="pp-media-uploader-tags" aria-label="Supported media types">
          <span><FiImage /> Image</span>
          <span><FiVideo /> Video</span>
          <span><FiAlertCircle /> 100MB max</span>
        </div>
      </div>
      <button type="button" className="pp-button is-primary pp-media-uploader-btn" onClick={handleUpload}>
        <FiUploadCloud />
        Select media
      </button>
    </section>
  );
}
