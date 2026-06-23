import { Router } from 'express';
import { createBooking, getBookings, updateBookingStatus } from '../controllers/bookingController';
import protect from '../middleware/authMiddleware';
import { bookingSchema, validateBody } from '../utils/validation';

const router = Router();

router.post('/', protect, validateBody(bookingSchema), createBooking);
router.get('/', protect, getBookings);
router.patch('/:id', protect, updateBookingStatus);

export default router;
