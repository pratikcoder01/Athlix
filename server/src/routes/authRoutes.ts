import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { firebaseLogin } from '../controllers/firebaseAuthController';
import protect from '../middleware/authMiddleware';
import { registerSchema, loginSchema, validateBody } from '../utils/validation';
import { refreshSession, logoutSession, logoutAllSessions } from '../controllers/sessionController';
import { sessionOrigin, trustedAuthOrigin } from '../utils/sessions';

const router = Router();
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

// Legacy email + bcrypt routes (kept for backward compatibility)
router.post('/register', trustedAuthOrigin, validateBody(registerSchema), register);
router.post('/login', trustedAuthOrigin, validateBody(loginSchema), login);
router.get('/me', protect, getMe);
router.post('/session', sessionOrigin, refreshSession);
router.post('/logout', sessionOrigin, logoutSession);
router.post('/logout-all', protect, logoutAllSessions);

// Firebase identity exchange — accepts any Firebase ID token,
// returns an ATHLIX JWT for all subsequent requests
router.post('/firebase', trustedAuthOrigin, firebaseLogin);

export default router;
