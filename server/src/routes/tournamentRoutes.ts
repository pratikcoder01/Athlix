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
import { cancelDivision, createDivision, generateDivisionBrackets, registerForDivision, updateDivisionBrackets, withdrawFromTournament } from '../controllers/tournamentDivisionController';

const router = Router();

router.get('/', protect, getTournaments);
router.post('/', protect, validateBody(tournamentCreateSchema), createTournament);
router.get('/:id', protect, getTournamentById);
router.post('/:id/register', protect, registerForTournament);
router.post('/:id/withdraw', protect, withdrawFromTournament);
router.post('/:id/divisions', protect, createDivision);
router.post('/:id/divisions/:key/register', protect, registerForDivision);
router.post('/:id/divisions/:key/cancel', protect, cancelDivision);
router.post('/:id/divisions/:key/brackets/generate', protect, generateDivisionBrackets);
router.put('/:id/divisions/:key/brackets', protect, updateDivisionBrackets);
router.put('/:id/brackets', protect, updateTournamentBrackets);
router.post('/:id/brackets/generate', protect, generateTournamentBrackets);

export default router;
