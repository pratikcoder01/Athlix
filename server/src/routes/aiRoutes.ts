import { Router } from 'express';
import { seedTournamentBracket } from '../controllers/aiController';
import protect from '../middleware/authMiddleware';
import apiLimiter from '../middleware/rateLimitMiddleware';
import { seedBracketSchema, validateBody } from '../utils/validation';

const router = Router();

router.use(protect);
router.use(apiLimiter);

router.post('/seed-bracket', validateBody(seedBracketSchema), seedTournamentBracket);

export default router;
