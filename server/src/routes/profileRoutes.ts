import { Router } from 'express';
import { getProfiles, getProfileById, updateProfile, updateCoachProfile } from '../controllers/profileController';
import protect from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getProfiles);
router.put('/', protect, updateProfile);
router.put('/coach', protect, updateCoachProfile);
router.get('/:userId', protect, getProfileById);

export default router;
