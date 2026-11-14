import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { Tournament } from '../models/Tournament';
import { Academy } from '../models/Academy';

/** Operational event counts. No payment ledger exists, so no revenue is reported. */
export const getAcademyAnalytics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
  if (!['admin', 'academy_owner', 'tournament_organizer'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Professional organizer access required' });
  }
  try {
    const isAdmin = req.user.role === 'admin';
    const tournamentFilter = isAdmin ? {} : { organizerId: req.user._id };
    const academyFilter = isAdmin ? {} : { ownerId: req.user._id };
    const [totalAcademies, totalTournaments, tournaments] = await Promise.all([
      Academy.countDocuments(academyFilter),
      Tournament.countDocuments(tournamentFilter),
      Tournament.find(tournamentFilter)
        .select('title date registrations status')
        .sort({ date: -1, _id: -1 })
        .limit(100)
        .lean(),
    ]);
    const events = tournaments.map((event) => ({
      id: event._id,
      title: event.title,
      date: event.date,
      registrationsCount: event.registrations?.length || 0,
      status: event.status,
    }));
    return res.status(200).json({
      success: true,
      analytics: {
        scope: isAdmin ? 'platform' : 'account',
        totalAcademies,
        totalTournaments,
        registrationsShown: events.reduce((sum, event) => sum + event.registrationsCount, 0),
        limit: 100,
        tournaments: events,
        paymentsAvailable: false,
      },
    });
  } catch (error) {
    next(error);
  }
};
