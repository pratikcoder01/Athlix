import { Router } from 'express';
import { registerAcademy, getAcademies, getAcademyById } from '../controllers/academyController';
import protect from '../middleware/authMiddleware';

const router = Router();

router.post('/', protect, registerAcademy);
router.get('/', protect, getAcademies);
router.get('/:id', protect, getAcademyById);

export default router;
