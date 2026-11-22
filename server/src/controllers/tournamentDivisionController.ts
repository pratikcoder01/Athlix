import { NextFunction, Response } from 'express';
import { Tournament, ITournamentDocument } from '../models/Tournament';
import { AuthenticatedRequest, ITournamentDivision } from '../types';
import { bracketProblem, bracketUpdateSchema, canTransitionTournament, divisionCancelSchema, divisionCreateSchema, divisionKeySchema, generateSingleElimination, objectIdSchema, ownsTournament, SafeBracket, versionSchema } from '../utils/tournamentPolicy';
import { emitUpdate } from './tournamentController';

const fail = (res: Response, code: number, message: string) => { res.status(code).json({ success: false, message }); return null; };
const versionOf = (event: ITournamentDocument) => Number(event.get('__v') || 0);
const locked = (event: ITournamentDocument) => !!event.brackets?.rounds?.length || !!event.divisions?.some(division => division.brackets?.rounds?.length);
async function load(req: AuthenticatedRequest, res: Response, version: number, owner: boolean) {
  if (!req.user) return fail(res, 401, 'Not authorized');
  if (!objectIdSchema.safeParse(req.params.id).success || (req.params.key !== undefined && !divisionKeySchema.safeParse(req.params.key).success)) return fail(res, 400, 'Invalid event or division identifier');
  const event = await Tournament.findById(req.params.id);
  if (!event) return fail(res, 404, 'Tournament not found');
  if (owner && !ownsTournament(req.user, event)) return fail(res, 403, 'Only the event organizer or an admin can manage divisions');
  if (versionOf(event) !== version) return fail(res, 409, 'Tournament changed. Reload before editing.');
  return event;
}
async function save(req: AuthenticatedRequest, res: Response, event: ITournamentDocument, fields: object, message: string) {
  const updated = await Tournament.findOneAndUpdate({ _id: event._id, organizerId: event.organizerId, __v: versionOf(event), status: event.status }, { $set: fields, $inc: { __v: 1 } }, { new: true, runValidators: true });
  if (!updated) return fail(res, 409, 'Tournament changed. Reload before editing.');
  emitUpdate(req, updated);
  return res.status(200).json({ success: true, message, tournament: updated });
}
const copyDivisions = (event: ITournamentDocument): ITournamentDivision[] => JSON.parse(JSON.stringify(event.divisions || []));

export const createDivision = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = divisionCreateSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, 'Provide a version, unique division key, title, discipline and capacity (2–256)');
    const event = await load(req, res, parsed.data.version, true); if (!event) return;
    if (event.status !== 'upcoming' || locked(event) || event.registrations?.length) return fail(res, 409, 'Configure divisions before the first registration or bracket');
    if (!event.disciplines?.includes(parsed.data.discipline)) return fail(res, 400, 'Division discipline must be included in the event');
    const divisions = copyDivisions(event);
    if (divisions.length >= 16 || divisions.some(division => division.key === parsed.data.key) || event.divisionCancellations?.some(division => division.key === parsed.data.key)) return fail(res, 409, 'Division key already exists, was cancelled, or the 16-division limit was reached');
    const { version: _version, ...details } = parsed.data;
    divisions.push({ ...details, registrations: [], status: 'upcoming' });
    return save(req, res, event, { divisions }, 'Division saved. Eligibility is organizer supplied and must be checked by the organizer.');
  } catch (error) { next(error); }
};

export const cancelDivision = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = divisionCancelSchema.safeParse(req.body); if (!parsed.success) return fail(res, 400, 'Provide the current version and a public cancellation reason (5–500 characters)');
    const event = await load(req, res, parsed.data.version, true); if (!event) return;
    if (event.status !== 'upcoming') return fail(res, 409, 'Only unstarted events can cancel a division');
    const divisions = copyDivisions(event); const division = divisions.find(item => item.key === req.params.key);
    if (!division) return fail(res, 404, 'Division not found');
    if (division.brackets?.rounds?.length) return fail(res, 409, 'Published division brackets cannot be cancelled through this operation');
    if ((event.divisionCancellations?.length || 0) >= 16) return fail(res, 409, 'The event cancellation history limit was reached');
    const removed = new Set(division.registrations.map(String));
    const divisionCancellations = [...(event.divisionCancellations || []), { key: division.key, title: division.title, reason: parsed.data.reason, cancelledAt: new Date(), cancelledBy: req.user!._id }];
    return save(req, res, event, { divisions: divisions.filter(item => item.key !== division.key), registrations: (event.registrations || []).filter(id => !removed.has(String(id))), divisionCancellations }, 'Division cancelled and its entrants withdrawn. The public notice is saved; contact entrants about fees and alternatives.');
  } catch (error) { next(error); }
};

export const registerForDivision = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return fail(res, 401, 'Not authorized');
    if (req.user.role !== 'athlete') return fail(res, 403, 'Athlete access is required');
    const parsed = versionSchema.safeParse(req.body); if (!parsed.success) return fail(res, 400, 'The current tournament version is required');
    const event = await load(req, res, parsed.data.version, false); if (!event) return;
    if (event.status !== 'upcoming' || new Date(event.registrationDeadline).getTime() < Date.now() || locked(event)) return fail(res, 409, 'Registration is closed or brackets have been published');
    const divisions = copyDivisions(event); const division = divisions.find(item => item.key === req.params.key);
    if (!division) return fail(res, 404, 'Division not found');
    const registrations = event.registrations || [];
    if (registrations.some(id => id.toString() === req.user!._id.toString())) return fail(res, 409, 'You are already registered for this event. Withdraw before changing divisions.');
    if (registrations.length >= 256 || division.registrations.length >= division.capacity) return fail(res, 409, 'The event or division is full');
    division.registrations.push(req.user._id);
    return save(req, res, event, { divisions, registrations: [...registrations, req.user._id] }, 'Division registration saved. Fees and eligibility checks are arranged with the organizer.');
  } catch (error) { next(error); }
};

export const withdrawFromTournament = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return fail(res, 401, 'Not authorized');
    if (req.user.role !== 'athlete') return fail(res, 403, 'Athlete access is required');
    const parsed = versionSchema.safeParse(req.body); if (!parsed.success) return fail(res, 400, 'The current tournament version is required');
    const event = await load(req, res, parsed.data.version, false); if (!event) return;
    if (event.status !== 'upcoming' || locked(event)) return fail(res, 409, 'Withdrawal is locked after any bracket is published. Contact the organizer for a recorded forfeit.');
    const mine = (id: { toString(): string }) => id.toString() === req.user!._id.toString();
    if (!event.registrations?.some(mine)) return fail(res, 409, 'You are not registered for this event');
    const divisions = copyDivisions(event);
    divisions.forEach(division => { division.registrations = division.registrations.filter(id => !mine(id)); });
    return save(req, res, event, { divisions, registrations: event.registrations.filter(id => !mine(id)) }, 'Registration withdrawn. ATHLIX does not process entry-fee refunds.');
  } catch (error) { next(error); }
};

export const generateDivisionBrackets = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = versionSchema.safeParse(req.body); if (!parsed.success) return fail(res, 400, 'The current tournament version is required');
    const event = await load(req, res, parsed.data.version, true); if (!event) return;
    if (event.status !== 'upcoming') return fail(res, 409, 'The event has already started');
    const divisions = copyDivisions(event); const division = divisions.find(item => item.key === req.params.key);
    if (!division) return fail(res, 404, 'Division not found');
    if (division.brackets?.rounds?.length) return fail(res, 409, 'The division bracket is already published');
    if (division.registrations.length < 2) return fail(res, 400, 'Register at least two athletes in this division before generating its bracket');
    division.brackets = generateSingleElimination(division.registrations.map(String)) as unknown as ITournamentDivision['brackets'];
    return save(req, res, event, { divisions }, 'Division bracket published. All event registration and withdrawal are now locked.');
  } catch (error) { next(error); }
};

export const updateDivisionBrackets = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = bracketUpdateSchema.safeParse(req.body); if (!parsed.success) return fail(res, 400, 'Invalid versioned division update');
    const event = await load(req, res, parsed.data.version, true); if (!event) return;
    if (event.status !== 'ongoing') return fail(res, 409, 'Start the event before recording division results');
    const divisions = copyDivisions(event); const division = divisions.find(item => item.key === req.params.key);
    if (!division) return fail(res, 404, 'Division not found');
    if (division.status === 'completed') return fail(res, 409, 'Completed divisions are read-only');
    if (!division.brackets?.rounds?.length) return fail(res, 400, 'Generate this division bracket first');
    const status = parsed.data.status || division.status;
    if (!canTransitionTournament(division.status, status)) return fail(res, 400, 'Invalid division status transition');
    const brackets = parsed.data.brackets || JSON.parse(JSON.stringify(division.brackets)) as SafeBracket;
    const problem = bracketProblem(brackets, division.registrations.map(String));
    if (problem) return fail(res, 400, problem);
    const old = division.brackets;
    const seedKey = (seeds: Array<{ fighterId: { toString(): string }; seed: number }>) => seeds.map(seed => `${seed.seed}:${seed.fighterId.toString()}`).sort().join('|');
    if (seedKey(old.seeds) !== seedKey(brackets.seeds)) return fail(res, 400, 'Published seeds cannot be replaced');
    for (let r = 1; r < brackets.rounds.length; r++) for (let m = 0; m < brackets.rounds[r].matches.length; m++) {
      const previous = old.rounds[r].matches[m]; const current = brackets.rounds[r].matches[m];
      if (previous.winner && current.winner && (previous.p1 !== current.p1 || previous.p2 !== current.p2)) return fail(res, 400, 'Clear dependent results after changing an earlier winner');
    }
    if (status === 'upcoming' && brackets.rounds.some(round => round.matches.some(match => match.winner && match.p1 !== 'BYE' && match.p2 !== 'BYE'))) return fail(res, 400, 'Start the division before recording results');
    if (status === 'completed' && !brackets.rounds.at(-1)?.matches[0]?.winner) return fail(res, 400, 'Record the final winner before completing the division');
    division.status = status; division.brackets = brackets as unknown as ITournamentDivision['brackets'];
    return save(req, res, event, { divisions }, 'Division results saved');
  } catch (error) { next(error); }
};
