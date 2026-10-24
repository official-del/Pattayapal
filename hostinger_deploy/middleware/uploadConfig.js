const mb = 1024 * 1024;

export const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES || 50 * mb);
export const maxImageUploadBytes = Number(process.env.MAX_IMAGE_UPLOAD_BYTES || 10 * mb);

const documentMimeTypes = new Set([
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const imageOnlyFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new Error('Unsupported file type'));
};

export const mediaFileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    file.mimetype.startsWith('audio/')
  ) {
    return cb(null, true);
  }
  cb(new Error('Unsupported file type'));
};

export const attachmentFileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    file.mimetype.startsWith('audio/') ||
    documentMimeTypes.has(file.mimetype)
  ) {
    return cb(null, true);
  }
  cb(new Error('Unsupported file type'));
};

export const buildDiskUploadOptions = (tempDir, options = {}) => ({
  dest: tempDir,
  limits: {
    fileSize: options.fileSize || maxUploadBytes,
    files: options.files || 10,
  },
  fileFilter: options.fileFilter || attachmentFileFilter,
});

export const buildMemoryUploadOptions = (options = {}) => ({
  storage: options.storage,
  limits: {
    fileSize: options.fileSize || maxImageUploadBytes,
    files: options.files || 1,
  },
  fileFilter: options.fileFilter || imageOnlyFileFilter,
});
