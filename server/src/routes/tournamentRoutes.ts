import { Router } from 'express';
import {
  getTournaments,
  getTournamentById,
  createTournament,
  registerForTournament,
  updateTournamentBrackets,
  generateTournamentBrackets,
} from '../controllers/tournamentController';
import protect from '../middleware/authMiddleware';
import { validateBody } from '../utils/validation';
import { tournamentCreateSchema } from '../utils/tournamentPolicy';

const router = Router();

router.get('/', protect, getTournaments);
router.post('/', protect, validateBody(tournamentCreateSchema), createTournament);
router.get('/:id', protect, getTournamentById);
router.post('/:id/register', protect, registerForTournament);
router.put('/:id/brackets', protect, updateTournamentBrackets);
router.post('/:id/brackets/generate', protect, generateTournamentBrackets);

export default router;
