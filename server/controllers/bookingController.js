const CoachBooking = require('../models/CoachBooking');

// @desc    Book a coaching session
// @route   POST /api/bookings
// @access  Private (Athlete role)
exports.createBooking = async (req, res, next) => {
  try {
    const { coachId, date, slot } = req.body;

    const booking = await CoachBooking.create({
      athleteId: req.user.id,
      coachId,
      date,
      slot,
    });

    const populatedBooking = await CoachBooking.findById(booking._id)
      .populate('athleteId', 'name email profileImage beltRank')
      .populate('coachId', 'name email profileImage discipline beltRank');

    res.status(201).json({ success: true, booking: populatedBooking });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve list of bookings (returns athlete or coach sessions based on role)
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'coach') {
      query.coachId = req.user.id;
    } else {
      query.athleteId = req.user.id;
    }

    const bookings = await CoachBooking.find(query)
      .populate('athleteId', 'name email profileImage beltRank')
      .populate('coachId', 'name email profileImage discipline beltRank')
      .sort({ date: 1 });

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Update status of session booking
// @route   PATCH /api/bookings/:id/status
// @access  Private
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['confirmed', 'completed', 'cancelled'];

    if (!status || !allowed.includes(status)) {
      const err = new Error('Please specify a valid status: confirmed, completed, or cancelled');
      err.statusCode = 400;
      return next(err);
    }

    const booking = await CoachBooking.findById(req.params.id);
    if (!booking) {
      const err = new Error('Booking session record not found');
      err.statusCode = 404;
      return next(err);
    }

    const isCoach = booking.coachId.toString() === req.user.id;
    const isAthlete = booking.athleteId.toString() === req.user.id;

    if (!isCoach && !isAthlete) {
      const err = new Error('Forbidden: Unauthorized to alter this booking status');
      err.statusCode = 403;
      return next(err);
    }

    if (isAthlete && status !== 'cancelled') {
      const err = new Error('Forbidden: Athletes can only cancel bookings');
      err.statusCode = 403;
      return next(err);
    }

    booking.status = status;
    await booking.save();

    const updatedBooking = await CoachBooking.findById(booking._id)
      .populate('athleteId', 'name email profileImage beltRank')
      .populate('coachId', 'name email profileImage discipline beltRank');

    res.status(200).json({ success: true, booking: updatedBooking });
  } catch (error) {
    next(error);
  }
};
