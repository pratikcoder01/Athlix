import { Response, NextFunction } from 'express';
import { Tournament } from '../models/Tournament';
import { AuthenticatedRequest } from '../types';
import { Types } from 'mongoose';

// @desc    Get all tournaments
// @route   GET /api/tournaments
// @access  Private
export const getTournaments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { discipline, status, search } = req.query;

    const query: any = {};
    if (discipline) query.disciplines = discipline;
    if (status) query.status = status;
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const tournaments = await Tournament.find(query)
      .populate('organizerId', 'name email')
      .sort({ date: 1 })
      .exec();

    res.status(200).json({
      success: true,
      count: tournaments.length,
      tournaments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tournament details by ID
// @route   GET /api/tournaments/:id
// @access  Private
export const getTournamentById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('organizerId', 'name email')
      .populate('registrations', 'name email');

    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    res.status(200).json({
      success: true,
      tournament,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a tournament event
// @route   POST /api/tournaments
// @access  Private (Tournament Organizer / Admin only)
export const createTournament = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || (req.user.role !== 'tournament_organizer' && req.user.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Only tournament organizers or admins can set up events' });
    }

    const { title, description, date, registrationDeadline, location, entryFee, disciplines, brackets } = req.body;

    const tournament = await Tournament.create({
      title,
      description,
      date: new Date(date),
      registrationDeadline: new Date(registrationDeadline),
      location,
      entryFee: Number(entryFee),
      disciplines: disciplines || [],
      organizerId: req.user._id,
      brackets: brackets ? (typeof brackets === 'string' ? JSON.parse(brackets) : brackets) : undefined,
      status: 'upcoming',
    });

    res.status(201).json({
      success: true,
      message: 'Tournament event created successfully',
      tournament,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register current user (athlete) for a tournament
// @route   POST /api/tournaments/:id/register
// @access  Private (Athlete only)
export const registerForTournament = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    // Check deadline
    if (new Date() > new Date(tournament.registrationDeadline)) {
      return res.status(400).json({ success: false, message: 'Registration deadline has passed' });
    }

    // Check if already registered
    const userId = req.user._id as Types.ObjectId;
    const isRegistered = tournament.registrations?.some(regId => regId.toString() === userId.toString());

    if (isRegistered) {
      return res.status(400).json({ success: false, message: 'You are already registered for this tournament' });
    }

    tournament.registrations = tournament.registrations || [];
    tournament.registrations.push(userId);
    await tournament.save();

    res.status(200).json({
      success: true,
      message: 'Successfully registered for tournament',
      tournament,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update tournament brackets or match progress
// @route   PUT /api/tournaments/:id/brackets
// @access  Private (Organizer / Admin only)
export const updateTournamentBrackets = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || (req.user.role !== 'tournament_organizer' && req.user.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Only tournament organizers or admins can manage brackets' });
    }

    const { brackets, status } = req.body;
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    if (brackets !== undefined) {
      let parsedBrackets: any = brackets;
      if (typeof brackets === 'string') {
        try {
          parsedBrackets = JSON.parse(brackets);
        } catch {
          // ignore parsing error
        }
      }

      if (parsedBrackets && (parsedBrackets.rounds || parsedBrackets.seeds)) {
        tournament.brackets = parsedBrackets;
      } else if (Array.isArray(parsedBrackets)) {
        tournament.brackets = {
          seeds: tournament.brackets?.seeds || [],
          rounds: parsedBrackets,
        };
      } else {
        tournament.brackets = parsedBrackets;
      }
    }
    if (status !== undefined) tournament.status = status;

    await tournament.save();

    // Emit real-time bracket update to all users viewing this tournament's room
    const io = req.app.get('io');
    if (io) {
      io.to(`tournament_${tournament._id}`).emit('bracket_update', {
        tournamentId: tournament._id,
        brackets: tournament.brackets,
        status: tournament.status,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Brackets updated successfully',
      tournament,
    });
  } catch (error) {
    next(error);
  }
};
