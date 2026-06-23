import { Response, NextFunction } from 'express';
import { Booking } from '../models/Booking';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { AuthenticatedRequest } from '../types';

// @desc    Book a coaching session
// @route   POST /api/bookings
// @access  Private (Athlete only)
export const createBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const athleteId = req.user._id;
    const { coachId, scheduledTime, durationMinutes, price } = req.body;

    // Check if coach exists and is actually a coach
    const coach = await User.findById(coachId);
    if (!coach || coach.role !== 'coach') {
      return res.status(404).json({ success: false, message: 'Coach not found or user is not a registered coach' });
    }

    const booking = await Booking.create({
      athleteId,
      coachId,
      scheduledTime: new Date(scheduledTime),
      durationMinutes,
      price,
      status: 'pending',
    });

    // Create a notification for the coach
    const notificationMessage = `Athlete ${req.user.name} requested a training session on ${new Date(scheduledTime).toLocaleString()}`;
    const notification = await Notification.create({
      recipientId: coachId,
      senderId: athleteId,
      type: 'booking',
      message: notificationMessage,
      read: false,
      link: '/bookings',
    });

    // Emit real-time socket notification if IO is configured
    const io = req.app.get('io');
    if (io) {
      io.to(coachId.toString()).emit('notification', {
        id: notification._id,
        type: 'booking',
        message: notificationMessage,
        createdAt: notification.createdAt,
      });
      io.to(coachId.toString()).emit('booking_update', {
        type: 'new_booking',
        booking,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking request sent to coach',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings for logged-in user (athlete or coach)
// @route   GET /api/bookings
// @access  Private
export const getBookings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    let query = {};
    if (req.user.role === 'coach') {
      query = { coachId: req.user._id };
    } else {
      query = { athleteId: req.user._id };
    }

    const bookings = await Booking.find(query)
      .populate('athleteId', 'name email')
      .populate('coachId', 'name email')
      .sort({ scheduledTime: 1 })
      .exec();

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status (accept, decline, complete)
// @route   PATCH /api/bookings/:id
// @access  Private (Athlete or Coach depends on action)
export const updateBookingStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const { status } = req.body;
    if (!['accepted', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status type' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify coach belongs to the booking
    if (booking.coachId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this booking' });
    }

    booking.status = status;
    await booking.save();

    // Create a notification for the athlete
    const notificationMessage = `Coach ${req.user.name} has ${status} your training session request`;
    const notification = await Notification.create({
      recipientId: booking.athleteId,
      senderId: req.user._id,
      type: 'booking',
      message: notificationMessage,
      read: false,
      link: '/bookings',
    });

    // Emit socket event to athlete
    const io = req.app.get('io');
    if (io) {
      io.to(booking.athleteId.toString()).emit('notification', {
        id: notification._id,
        type: 'booking',
        message: notificationMessage,
        createdAt: notification.createdAt,
      });
      io.to(booking.athleteId.toString()).emit('booking_update', {
        type: 'status_changed',
        booking,
      });
    }

    res.status(200).json({
      success: true,
      message: `Booking successfully ${status}`,
      booking,
    });
  } catch (error) {
    next(error);
  }
};
