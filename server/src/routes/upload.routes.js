import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.middleware.js';
import { uploadImage, isStorageConfigured } from '../services/storage.service.js';

const router = express.Router();

// SVG is excluded on purpose: it can contain scripts
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Keep the file in RAM only long enough to pass it on to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max for images
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed.'));
    }
  }
});

// Turn multer errors (wrong type, too large) into a 400 instead of a generic 500
const receiveImage = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5MB or smaller.' : err.message;
    res.status(400).json({ success: false, message });
  });
};

// POST /api/v1/uploads — Upload a single image
router.post('/', protect, receiveImage, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file provided.' });
  }

  if (!isStorageConfigured()) {
    console.error('Image upload failed: CLOUDINARY_* environment variables are not set.');
    return res.status(500).json({ success: false, message: 'Image storage is not configured on the server.' });
  }

  try {
    const url = await uploadImage(req.file.buffer);
    res.status(201).json({ success: true, data: { url } });
  } catch (error) {
    console.error('Cloudinary upload error:', error.message);
    res.status(502).json({ success: false, message: 'Failed to store image. Please try again.' });
  }
});

export default router;
