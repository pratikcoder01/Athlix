import { Router } from 'express';
import protect from '../middleware/authMiddleware';
import { listCoachClients, getCoachClient, saveCoachClientNotes } from '../controllers/coachClientController';
const router = Router();
router.use(protect);
router.get('/', listCoachClients);
router.get('/:id', getCoachClient);
router.put('/:id/notes', saveCoachClientNotes);
export default router;
