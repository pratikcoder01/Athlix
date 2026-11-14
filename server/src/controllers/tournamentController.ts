import { Response, NextFunction } from 'express';
import { Tournament } from '../models/Tournament';
import { AuthenticatedRequest } from '../types';
import {
  objectIdSchema, tournamentQuerySchema, tournamentCreateSchema, bracketUpdateSchema,
  versionSchema, ownsTournament, canTransitionTournament, bracketProblem,
  generateSingleElimination, escapeSearch, SafeBracket,
} from '../utils/tournamentPolicy';

const badRequest = (res: Response, message: string) => res.status(400).json({ success: false, message });
const invalidId = (id: unknown) => !objectIdSchema.safeParse(id).success;
const emitUpdate = (req: AuthenticatedRequest, tournament: { _id: unknown; brackets?: unknown; status: string }) => {
  req.app.get('io')?.to(`tournament_${tournament._id}`).emit('bracket_update', {
    tournamentId: tournament._id, brackets: tournament.brackets, status: tournament.status,
  });
};

export const getTournaments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = tournamentQuerySchema.safeParse(req.query);
    if (!parsed.success) return badRequest(res, 'Invalid tournament filters or pagination');
    const { discipline, status, search, page, limit } = parsed.data;
    const query = {
      ...(discipline ? { disciplines: discipline } : {}),
      ...(status ? { status } : {}),
      ...(search ? { title: { $regex: escapeSearch(search), $options: 'i' } } : {}),
    };
    const tournaments = await Tournament.find(query).populate('organizerId', 'name')
      .sort({ date: 1, _id: 1 }).skip((page - 1) * limit).limit(limit).exec();
    return res.status(200).json({ success: true, count: tournaments.length, page, limit, tournaments });
  } catch (error) { next(error); }
};

export const getTournamentById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (invalidId(req.params.id)) return badRequest(res, 'Invalid tournament ID');
    const tournament = await Tournament.findById(req.params.id)
      .populate('organizerId', 'name').populate('registrations', 'name');
    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
    return res.status(200).json({ success: true, tournament });
  } catch (error) { next(error); }
};

export const createTournament = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !['tournament_organizer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Approved organizer access is required' });
    }
    const parsed = tournamentCreateSchema.safeParse(req.body);
    if (!parsed.success) return badRequest(res, 'Invalid tournament details; check dates, disciplines and fees');
    const tournament = await Tournament.create({ ...parsed.data, organizerId: req.user._id, status: 'upcoming' });
    return res.status(201).json({ success: true, message: 'Tournament created', tournament });
  } catch (error) { next(error); }
};

export const registerForTournament = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
    if (req.user.role !== 'athlete') return res.status(403).json({ success: false, message: 'Athlete access is required' });
    if (invalidId(req.params.id)) return badRequest(res, 'Invalid tournament ID');
    // A single write deduplicates enrollment and serializes it against bracket publication.
    const tournament = await Tournament.findOneAndUpdate({
      _id: req.params.id, status: 'upcoming', registrationDeadline: { $gte: new Date() },
      registrations: { $ne: req.user._id }, 'brackets.rounds.0': { $exists: false },
      $expr: { $lt: [{ $size: { $ifNull: ['$registrations', []] } }, 256] },
    }, { $addToSet: { registrations: req.user._id }, $inc: { __v: 1 } }, { new: true, runValidators: true });
    if (!tournament) {
      if (!await Tournament.exists({ _id: req.params.id })) return res.status(404).json({ success: false, message: 'Tournament not found' });
      return res.status(409).json({ success: false, message: 'Already registered, registration closed, bracket locked or 256-athlete capacity reached' });
    }
    return res.status(200).json({ success: true, message: 'Registration saved. Entry fees are not collected by ATHLIX.', tournament });
  } catch (error) { next(error); }
};

export const generateTournamentBrackets = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
    if (invalidId(req.params.id)) return badRequest(res, 'Invalid tournament ID');
    const parsed = versionSchema.safeParse(req.body);
    if (!parsed.success) return badRequest(res, 'The current tournament version is required');
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
    if (!ownsTournament(req.user, tournament)) return res.status(403).json({ success: false, message: 'Only this event’s organizer or an admin can generate brackets' });
    if (Number(tournament.get('__v') || 0) !== parsed.data.version) return res.status(409).json({ success: false, message: 'Tournament changed. Reload before generating brackets.' });
    if (tournament.status !== 'upcoming' || tournament.brackets?.rounds?.length) {
      return res.status(409).json({ success: false, message: 'Brackets have already been generated or the event has started' });
    }
    const ids = (tournament.registrations || []).map(id => id.toString());
    if (ids.length < 2 || ids.length > 256) return badRequest(res, 'Register 2–256 athletes before generating a bracket');
    const brackets = generateSingleElimination(ids);
    const updated = await Tournament.findOneAndUpdate({ _id: tournament._id,
      organizerId: tournament.organizerId, __v: parsed.data.version, status: 'upcoming',
      'brackets.rounds.0': { $exists: false },
    }, { $set: { brackets }, $inc: { __v: 1 } }, { new: true, runValidators: true });
    if (!updated) return res.status(409).json({ success: false, message: 'Tournament changed. Reload before generating brackets.' });
    emitUpdate(req, updated);
    return res.status(200).json({ success: true, message: 'Deterministic bracket generated from registration order', tournament: updated });
  } catch (error) { next(error); }
};

export const updateTournamentBrackets = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
    if (invalidId(req.params.id)) return badRequest(res, 'Invalid tournament ID');
    const parsed = bracketUpdateSchema.safeParse(req.body);
    if (!parsed.success) return badRequest(res, 'Invalid bracket update; include the current tournament version');
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
    if (!ownsTournament(req.user, tournament)) return res.status(403).json({ success: false, message: 'Only this event’s organizer or an admin can manage brackets' });
    if (Number(tournament.get('__v') || 0) !== parsed.data.version) return res.status(409).json({ success: false, message: 'Tournament changed. Reload before editing.' });
    if (tournament.status === 'completed') return res.status(409).json({ success: false, message: 'Completed events are read-only' });
    const status = parsed.data.status || tournament.status;
    if (!canTransitionTournament(tournament.status, status)) return badRequest(res, 'Invalid tournament status transition');
    const existing = tournament.brackets;
    if (!existing?.rounds?.length) return badRequest(res, 'Generate the tournament bracket first');
    const brackets = parsed.data.brackets || JSON.parse(JSON.stringify(existing)) as SafeBracket;
    const problem = bracketProblem(brackets, (tournament.registrations || []).map(id => id.toString()));
    if (problem) return badRequest(res, problem);
    const seedKey = (seeds: Array<{ fighterId: { toString(): string }; seed: number }>) =>
      seeds.map(seed => `${seed.seed}:${seed.fighterId.toString()}`).sort().join('|');
    if (seedKey(brackets.seeds) !== seedKey(existing.seeds)) return badRequest(res, 'Published seeds cannot be replaced');
    for (let r = 1; r < brackets.rounds.length; r++) {
      for (let m = 0; m < brackets.rounds[r].matches.length; m++) {
        const previous = existing.rounds[r]?.matches[m];
        const current = brackets.rounds[r].matches[m];
        if (previous?.winner && current.winner && (previous.p1 !== current.p1 || previous.p2 !== current.p2)) {
          return badRequest(res, 'Clear dependent results after changing an earlier winner');
        }
      }
    }
    if (status === 'upcoming' && brackets.rounds.some(r => r.matches.some(m => m.winner && m.p1 !== 'BYE' && m.p2 !== 'BYE'))) {
      return badRequest(res, 'Start the tournament before recording results');
    }
    if (status === 'completed' && !brackets.rounds.at(-1)?.matches[0]?.winner) return badRequest(res, 'Record the final winner before completing the event');
    const updated = await Tournament.findOneAndUpdate({ _id: tournament._id,
      organizerId: tournament.organizerId, __v: parsed.data.version, status: tournament.status,
    }, { $set: { brackets, status }, $inc: { __v: 1 } }, { new: true, runValidators: true });
    if (!updated) return res.status(409).json({ success: false, message: 'Tournament changed. Reload before editing.' });
    emitUpdate(req, updated);
    return res.status(200).json({ success: true, message: 'Tournament updated', tournament: updated });
  } catch (error) { next(error); }
};
