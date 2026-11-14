import { Router } from 'express';
import protect from '../middleware/authMiddleware';
import { listNotifications, setNotificationRead, markAllNotificationsRead } from '../controllers/notificationController';
const router = Router();
router.use(protect);
router.get('/', listNotifications);
router.post('/read-all', markAllNotificationsRead);
router.patch('/:id', setNotificationRead);
export default router;
