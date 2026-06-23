import { Router } from 'express';
import {
  getTournaments,
  getTournamentById,
  createTournament,
  registerForTournament,
  updateTournamentBrackets,
} from '../controllers/tournamentController';
import protect from '../middleware/authMiddleware';
import { tournamentSchema, validateBody } from '../utils/validation';

const router = Router();

router.get('/', protect, getTournaments);
router.post('/', protect, validateBody(tournamentSchema), createTournament);
router.get('/:id', protect, getTournamentById);
router.post('/:id/register', protect, registerForTournament);
router.put('/:id/brackets', protect, updateTournamentBrackets);

export default router;
