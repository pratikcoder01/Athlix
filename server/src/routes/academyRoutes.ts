import { Router } from 'express';
import { registerAcademy, getAcademies, getAcademyById } from '../controllers/academyController';
import { getAcademyAnalytics } from '../controllers/analyticsController';
import protect from '../middleware/authMiddleware';
import { getAcademyOperations, updateAcademyListing, getAcademyMembers, createAcademyMember,
  updateAcademyMember, getAcademyAttendance, recordAcademyAttendance } from '../controllers/academyOperationsController';

const router = Router();

router.post('/', protect, registerAcademy);
router.get('/analytics', protect, getAcademyAnalytics);
router.get('/', protect, getAcademies);
router.get('/:id/operations', protect, getAcademyOperations);
router.patch('/:id', protect, updateAcademyListing);
router.get('/:id/members', protect, getAcademyMembers);
router.post('/:id/members', protect, createAcademyMember);
router.patch('/:id/members/:memberId', protect, updateAcademyMember);
router.get('/:id/attendance', protect, getAcademyAttendance);
router.put('/:id/attendance', protect, recordAcademyAttendance);
router.get('/:id', protect, getAcademyById);

export default router;
