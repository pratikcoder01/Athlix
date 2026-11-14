import { Router } from 'express';
import { seedTournamentBracket, generateTrainingPlan, saveTrainingPlan, matchCoach, generateWellbeingNudge } from '../controllers/aiController';
import protect from '../middleware/authMiddleware';
import rateLimit from 'express-rate-limit';
import { AuthenticatedRequest } from '../types';
import { seedBracketSchema, validateBody } from '../utils/validation';
import { requireAiCoachingEnabled } from '../utils/aiPolicy';

const router = Router();

router.post('/seed-bracket', protect, validateBody(seedBracketSchema), seedTournamentBracket);

// Disabled by default, before authentication DB lookups or provider work.
router.use(requireAiCoachingEnabled);
router.use(protect);
router.use(rateLimit({ windowMs: 15 * 60_000, limit: 5,
  keyGenerator: (req: AuthenticatedRequest) => String(req.user!._id),
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many AI coaching requests. Please retry in 15 minutes.' },
}));
router.post('/training-plan', generateTrainingPlan);
router.post('/save-plan', saveTrainingPlan);
router.post('/match-coach', matchCoach);
router.post('/wellbeing-nudge', generateWellbeingNudge);

export default router;
