import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import protect from '../middleware/authMiddleware';
import { registerSchema, loginSchema, validateBody } from '../utils/validation';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', protect, getMe);

export default router;
