import { Router } from 'express';
import { createBooking, getBookings, getBookableCoaches, updateBookingStatus } from '../controllers/bookingController';
import protect from '../middleware/authMiddleware';

const router = Router();

router.get('/coaches', protect, getBookableCoaches);
router.post('/', protect, createBooking);
router.get('/', protect, getBookings);
router.patch('/:id', protect, updateBookingStatus);

export default router;
