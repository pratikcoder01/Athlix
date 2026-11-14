import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { AuthenticatedRequest } from '../types';
import protect from '../middleware/authMiddleware';
import { analyzeVideo, deleteVideoResult, getVideoStatus, MAX_VIDEO_BYTES, requireCvConfigured } from '../controllers/cvController';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_BYTES, files: 1, fields: 1, fieldSize: 16, parts: 3 },
  fileFilter: (_req, file, callback) => {
    const types: Record<string, string[]> = {
      '.mp4': ['video/mp4'], '.mov': ['video/quicktime'],
      '.webm': ['video/webm'], '.avi': ['video/x-msvideo', 'video/avi'],
    };
    if (!types[path.extname(file.originalname).toLowerCase()]?.includes(file.mimetype)) {
      return callback(Object.assign(new Error('Use an MP4, MOV, AVI or WebM video with a matching media type.'), { statusCode: 415 }));
    }
    callback(null, true);
  },
});
const uploadLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 5, keyGenerator: (req: AuthenticatedRequest) => String(req.user?._id), standardHeaders: true, legacyHeaders: false, message: { message: 'Too many video submissions. Please retry in 15 minutes.' } });
let activeUploads = 0;

router.use(protect);
router.use(requireCvConfigured);
router.post('/analyze', uploadLimiter, (req, res, next) => {
  if (activeUploads >= 2) return res.status(429).json({ message: 'The analyzer is busy. Please retry shortly.' });
  activeUploads++;
  let released = false;
  const release = () => { if (!released) { released = true; activeUploads--; } };
  res.once('finish', release);
  res.once('close', release);
  upload.single('file')(req, res, (error) => {
    if (error) {
      const status = error instanceof multer.MulterError ? (error.code === 'LIMIT_FILE_SIZE' ? 413 : 400) : error.statusCode || 400;
      return res.status(status).json({ message: error.code === 'LIMIT_FILE_SIZE' ? 'Video exceeds the 25 MB upload limit.' : 'Invalid video upload. Use one supported video and consent field.' });
    }
    next();
  });
}, analyzeVideo);
router.get('/status/:id', getVideoStatus);
router.delete('/status/:id', deleteVideoResult);

export default router;
