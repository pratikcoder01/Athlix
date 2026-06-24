import { Router } from 'express';
import { seedTournamentBracket, generateTrainingPlan, saveTrainingPlan } from '../controllers/aiController';
import protect from '../middleware/authMiddleware';
import apiLimiter from '../middleware/rateLimitMiddleware';
import { seedBracketSchema, trainingPlanSchema, validateBody } from '../utils/validation';

const router = Router();

router.use(protect);
router.use(apiLimiter);

router.post('/seed-bracket', validateBody(seedBracketSchema), seedTournamentBracket);
router.post('/training-plan', validateBody(trainingPlanSchema), generateTrainingPlan);
router.post('/save-plan', saveTrainingPlan);

export default router;
