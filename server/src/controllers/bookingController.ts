import { Response, NextFunction } from 'express';
import { PipelineStage, Types } from 'mongoose';
import { Booking, IBookingDocument } from '../models/Booking';
import { User } from '../models/User';
import { Profile } from '../models/Profile';
import { CoachProfile } from '../models/CoachProfile';
import { Notification, INotificationDocument } from '../models/Notification';
import { AuthenticatedRequest } from '../types';
import {
  BookingPolicyError, bookingListSchema, bookingObjectIdSchema, bookingStatusSchema,
  canChangeBookingStatus, coachQuerySchema, createBookingSchema, isWithinAvailability,
  sessionPrice, validatePublishedCoach, validateSessionTime,
} from '../utils/bookingPolicy';
import { withScheduleTransaction } from '../utils/bookingTransaction';

const respondToBookingError = (error: unknown, res: Response, next: NextFunction) => {
  if (error instanceof BookingPolicyError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 20) {
    return res.status(503).json({ success: false, message: 'Booking writes require a transaction-capable MongoDB deployment' });
  }
  next(error);
};

const emitBooking = (req: AuthenticatedRequest, booking: IBookingDocument, notifications: INotificationDocument[], type: 'new_booking' | 'status_changed') => {
  // Persisted state is authoritative; realtime delivery is a best-effort hint.
  try {
    const io = req.app.get('io');
    if (!io) return;
    for (const notification of notifications) {
      io.to(String(notification.recipientId)).emit('notification', {
        id: notification._id, type: 'booking', message: notification.message, createdAt: notification.createdAt,
      });
    }
    for (const participant of [booking.coachId, booking.athleteId]) {
      io.to(String(participant)).emit('booking_update', { type, booking });
    }
  } catch {
    console.warn('Booking committed; realtime notification delivery unavailable');
  }
};

// GET /api/bookings/coaches — only published profiles of active approved coaches.
export const getBookableCoaches = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = coachQuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid coach filters' });
    const { coachId, search, discipline, page, limit } = parsed.data;
    const pipeline: PipelineStage[] = [
      { $match: { active: true, availabilityTimezone: 'UTC', currency: { $in: ['INR', 'USD'] }, 'availability.0': { $exists: true },
        ...(coachId ? { userId: new Types.ObjectId(coachId) } : {}) } },
      { $lookup: { from: User.collection.name, localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $match: { 'user.isActive': true, 'user.role': 'coach', ...(search ? { 'user.name': { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } } : {}) } },
      { $lookup: { from: Profile.collection.name, localField: 'userId', foreignField: 'userId', as: 'profile' } },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
      ...(discipline ? [{ $match: { 'profile.discipline': discipline } } as PipelineStage] : []),
      { $sort: { 'user.name': 1, userId: 1 } }, { $skip: (page - 1) * limit }, { $limit: limit + 1 },
      { $project: { _id: 0, id: { $toString: '$userId' }, name: '$user.name',
        discipline: { $ifNull: ['$profile.discipline', 'Other'] }, beltRank: { $ifNull: ['$profile.beltRank', ''] },
        bio: { $ifNull: ['$profile.bio', ''] }, experienceYears: 1, certifications: 1,
        pricingPerHour: 1, currency: 1, availability: 1, availabilityTimezone: 1, autoConfirm: 1 } },
    ];
    const coaches = await CoachProfile.aggregate(pipeline).exec();
    return res.status(200).json({ success: true, coaches: coaches.slice(0, limit), page, hasMore: coaches.length > limit });
  } catch (error) { next(error); }
};

// POST /api/bookings — authoritative price, availability and serialized conflicts.
export const createBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
    if (req.user.role !== 'athlete') return res.status(403).json({ success: false, message: 'Athlete account required to book a session' });
    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid booking details', errors: parsed.error.issues });
    const { coachId, scheduledTime, durationMinutes, quotedPrice, quotedCurrency } = parsed.data;
    const athleteId = String(req.user._id);
    if (athleteId === coachId.toLowerCase()) return res.status(400).json({ success: false, message: 'You cannot book yourself' });
    validateSessionTime(scheduledTime);

    const result = await withScheduleTransaction([coachId.toLowerCase(), athleteId], async (session) => {
      const start = validateSessionTime(scheduledTime);
      const end = new Date(start.getTime() + durationMinutes * 60000);
      const coach = await User.findById(coachId).session(session);
      if (!coach || coach.role !== 'coach' || coach.isActive !== true) throw new BookingPolicyError(404, 'Active approved coach not found');
      const athlete = await User.exists({ _id: athleteId, role: 'athlete', isActive: true }).session(session);
      if (!athlete) throw new BookingPolicyError(403, 'Active athlete account required');
      const profile = await CoachProfile.findOne({ userId: coachId }).session(session);
      validatePublishedCoach(profile);
      if (!profile || !isWithinAvailability(profile, start, durationMinutes)) throw new BookingPolicyError(409, 'Session falls outside the coach’s published UTC availability');
      const price = sessionPrice(profile.pricingPerHour!, durationMinutes);
      if (quotedPrice !== undefined && (quotedPrice !== price || quotedCurrency !== profile.currency)) {
        throw new BookingPolicyError(409, 'Coach pricing changed; refresh the quote before booking');
      }

      // Includes existing bookings created before this locking protocol was added.
      const conflicting = await Booking.findOne({
        status: { $in: ['pending', 'accepted'] },
        $or: [{ coachId: { $in: [coachId, athleteId] } }, { athleteId: { $in: [coachId, athleteId] } }],
        scheduledTime: { $lt: end },
        $expr: { $gt: [{ $add: ['$scheduledTime', { $multiply: ['$durationMinutes', 60000] }] }, start] },
      }).session(session);
      if (conflicting) throw new BookingPolicyError(409, 'Coach or athlete already has an overlapping booking');

      const [booking] = await Booking.create([{
        athleteId, coachId, scheduledTime: start, durationMinutes, price,
        currency: profile.currency, status: profile.autoConfirm ? 'accepted' : 'pending',
      }], { session });
      const notifications = await Notification.create([{
        recipientId: coachId, senderId: athleteId, type: 'booking', read: false, link: '/bookings',
        message: `${req.user!.name} ${profile.autoConfirm ? 'booked' : 'requested'} a session at ${start.toISOString()} (UTC)`,
      }, ...(profile.autoConfirm ? [{
        recipientId: athleteId, senderId: coachId, type: 'booking' as const, read: false, link: '/bookings',
        message: `Your session with ${coach.name} at ${start.toISOString()} (UTC) is accepted`,
      }] : [])], { session });
      return { booking, notifications };
    });
    emitBooking(req, result.booking, result.notifications, 'new_booking');
    return res.status(201).json({ success: true,
      message: result.booking.status === 'accepted' ? 'Session accepted automatically' : 'Session requested; awaiting coach acceptance', booking: result.booking });
  } catch (error) { respondToBookingError(error, res, next); }
};

// GET /api/bookings — history remains accessible after an account role changes.
export const getBookings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
    const parsed = bookingListSchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid booking filters' });
    const { page, limit } = parsed.data;
    const bookings = await Booking.find({ $or: [{ athleteId: req.user._id }, { coachId: req.user._id }] })
      .populate('athleteId', 'name').populate('coachId', 'name')
      .sort({ scheduledTime: -1, _id: -1 }).skip((page - 1) * limit).limit(limit + 1).exec();
    return res.status(200).json({ success: true, bookings: bookings.slice(0, limit), page, hasMore: bookings.length > limit });
  } catch (error) { next(error); }
};

// PATCH /api/bookings/:id — participant-owned, forward-only transitions.
export const updateBookingStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
    const parsed = bookingStatusSchema.safeParse(req.body);
    if (!parsed.success || !bookingObjectIdSchema.safeParse(req.params.id).success) {
      return res.status(400).json({ success: false, message: 'Invalid booking status request' });
    }
    const initial = await Booking.findById(req.params.id);
    if (!initial) return res.status(404).json({ success: false, message: 'Booking not found' });
    const actorId = String(req.user._id);
    const coachId = String(initial.coachId);
    const athleteId = String(initial.athleteId);
    if (actorId !== coachId && actorId !== athleteId) return res.status(403).json({ success: false, message: 'This booking belongs to another account' });
    const actor = actorId === coachId ? 'coach' : 'athlete';
    const { status } = parsed.data;
    if ((actor === 'athlete' || req.user.role !== 'coach') && status !== 'cancelled') {
      return res.status(403).json({ success: false, message: 'Only the assigned coach can manage this status' });
    }
    const result = await withScheduleTransaction([coachId, athleteId], async (session) => {
      const booking = await Booking.findById(req.params.id).session(session);
      if (!booking || String(booking.coachId) !== coachId || String(booking.athleteId) !== athleteId) {
        throw new BookingPolicyError(409, 'Booking changed; refresh and try again');
      }
      const start = booking.scheduledTime.getTime();
      const end = start + booking.durationMinutes * 60000;
      if (!canChangeBookingStatus(booking.status, status, actor, start, end)) {
        throw new BookingPolicyError(409, 'Booking status transition is no longer allowed');
      }
      if (booking.status === status) return { booking, notifications: [] as INotificationDocument[] };
      const updated = await Booking.findOneAndUpdate({ _id: booking._id, status: booking.status }, { $set: { status } }, { new: true, runValidators: true, session });
      if (!updated) throw new BookingPolicyError(409, 'Booking changed; refresh and try again');
      const notifications = await Notification.create([{
        recipientId: actor === 'coach' ? athleteId : coachId, senderId: actorId, type: 'booking', read: false, link: '/bookings',
        message: `${req.user!.name} changed the session at ${booking.scheduledTime.toISOString()} (UTC) to ${status}`,
      }], { session });
      return { booking: updated, notifications };
    });
    emitBooking(req, result.booking, result.notifications, 'status_changed');
    return res.status(200).json({ success: true, message: `Session ${status}`, booking: result.booking });
  } catch (error) { respondToBookingError(error, res, next); }
};
