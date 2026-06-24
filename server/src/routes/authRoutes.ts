import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { firebaseLogin } from '../controllers/firebaseAuthController';
import protect from '../middleware/authMiddleware';
import { registerSchema, loginSchema, validateBody } from '../utils/validation';

const router = Router();

// Legacy email + bcrypt routes (kept for backward compatibility)
router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', protect, getMe);

// Firebase identity exchange — accepts any Firebase ID token,
// returns an ATHLIX JWT for all subsequent requests
router.post('/firebase', firebaseLogin);

export default router;
