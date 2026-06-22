const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { createBooking, getBookings, updateBookingStatus } = require('../controllers/bookingController');
const { bookingSchema, validateBody } = require('../utils/validation');

router.use(protect);

router.post('/', validateBody(bookingSchema), createBooking);
router.get('/', getBookings);
router.patch('/:id/status', updateBookingStatus);

module.exports = router;
