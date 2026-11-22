import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { AuthenticatedRequest } from '../types';
import protect from '../middleware/authMiddleware';
import { analyzeVideo, deleteVideoResult, getVideoStatus, MAX_VIDEO_BYTES, requireCvConfigured } from '../controllers/cvController';
import { createCvUploadHandler } from '../utils/cvUploadLifecycle';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_BYTES, files: 1, fields: 2, fieldSize: 36, parts: 4 },
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

router.use(protect);
router.use(requireCvConfigured);
router.post('/analyze', uploadLimiter, createCvUploadHandler(upload.single('file'), analyzeVideo));
router.get('/status/:id', getVideoStatus);
router.delete('/status/:id', deleteVideoResult);

export default router;
