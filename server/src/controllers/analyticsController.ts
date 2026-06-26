import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { User } from '../models/User';
import { Booking } from '../models/Booking';
import { Tournament } from '../models/Tournament';
import { Academy } from '../models/Academy';

export const getAcademyAnalytics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Total athletes count
    const totalAthletes = await User.countDocuments({ role: 'athlete' });

    // 2. Total coaches count
    const totalCoaches = await User.countDocuments({ role: 'coach' });

    // 3. Total academies count
    const totalAcademies = await Academy.countDocuments();

    // 4. Bookings and Revenue
    const bookings = await Booking.find({});
    const totalBookings = bookings.length;
    const bookingRevenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);

    // 5. Tournaments and Revenue
    const tournamentsList = await Tournament.find({});
    let tournamentRevenue = 0;
    let totalFillRateSum = 0;

    const tournamentsData = tournamentsList.map((t) => {
      const regCount = t.registrations ? t.registrations.length : 0;
      const capacity = 16; // Standard bracket target capacity
      const fillRate = Math.min(Math.round((regCount / capacity) * 100), 100);
      
      const tournamentRev = regCount * (t.entryFee || 0);
      tournamentRevenue += tournamentRev;
      totalFillRateSum += fillRate;

      return {
        id: t._id,
        title: t.title,
        date: t.date,
        registrationsCount: regCount,
        fillRate,
        revenue: tournamentRev,
        status: t.status,
      };
    });

    const averageFillRate = tournamentsList.length > 0
      ? Math.round(totalFillRateSum / tournamentsList.length)
      : 0;

    const totalRevenue = bookingRevenue + tournamentRevenue;

    return res.status(200).json({
      success: true,
      analytics: {
        totalAthletes,
        totalCoaches,
        totalAcademies,
        totalBookings,
        bookingRevenue,
        tournamentRevenue,
        totalRevenue,
        averageFillRate,
        tournaments: tournamentsData,
      },
    });
  } catch (error) {
    next(error);
  }
};
