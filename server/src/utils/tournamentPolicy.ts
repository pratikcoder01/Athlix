import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
const statusSchema = z.enum(['upcoming', 'ongoing', 'completed']);
const participantSchema = z.union([objectIdSchema, z.literal('BYE'), z.literal('TBD')]);
export const tournamentCreateSchema = z.object({
  title: z.string().trim().min(1).max(150),
  description: z.string().trim().min(1).max(5000),
  date: z.string().datetime({ offset: true }),
  registrationDeadline: z.string().datetime({ offset: true }),
  location: z.string().trim().min(1).max(250),
  entryFee: z.number().finite().min(0).max(100000),
  disciplines: z.array(z.enum(['Karate', 'BJJ', 'Judo', 'Muay Thai', 'Taekwondo', 'Boxing', 'MMA', 'Wrestling', 'Other'])).min(1).max(9),
}).strict().superRefine((value, ctx) => {
  if (Date.parse(value.date) <= Date.now()) ctx.addIssue({ code: 'custom', path: ['date'], message: 'Event must be in the future' });
  if (Date.parse(value.registrationDeadline) <= Date.now() || Date.parse(value.registrationDeadline) > Date.parse(value.date)) {
    ctx.addIssue({ code: 'custom', path: ['registrationDeadline'], message: 'Deadline must be in the future and on or before the event' });
  }
});

export const bracketSchema = z.object({
  seeds: z.array(z.object({
    fighterId: objectIdSchema,
    seed: z.number().int().min(1).max(256),
    rationale: z.string().trim().min(1).max(500),
  }).strict()).max(256),
  rounds: z.array(z.object({
    round: z.string().trim().min(1).max(60),
    matches: z.array(z.object({
      p1: participantSchema,
      p2: participantSchema,
      p1_rationale: z.string().max(500).optional(),
      p2_rationale: z.string().max(500).optional(),
      score: z.string().trim().min(1).max(100),
      winner: z.union([objectIdSchema, z.literal('BYE'), z.literal('')]).default(''),
    }).strict()).min(1).max(128),
  }).strict()).max(8),
}).strict();

export const bracketUpdateSchema = z.object({
  version: z.number().int().nonnegative(),
  brackets: bracketSchema.optional(),
  status: statusSchema.optional(),
}).strict().refine(data => data.brackets !== undefined || data.status !== undefined, 'No changes provided');

export const versionSchema = z.object({ version: z.number().int().nonnegative() }).strict();
export const tournamentQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  discipline: z.enum(['Karate', 'BJJ', 'Judo', 'Muay Thai', 'Taekwondo', 'Boxing', 'MMA', 'Wrestling', 'Other']).optional(),
  status: statusSchema.optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
}).strict();

export type SafeBracket = z.infer<typeof bracketSchema>;

export const ownsTournament = (user: { _id: { toString(): string }; role: string } | undefined,
  tournament: { organizerId: { toString(): string } }) =>
  !!user && (user.role === 'admin' ||
    (user.role === 'tournament_organizer' && tournament.organizerId.toString() === user._id.toString()));

export function generateSingleElimination(ids: string[]): SafeBracket {
  if (ids.length < 2 || ids.length > 256 || new Set(ids).size !== ids.length ||
      ids.some(id => !objectIdSchema.safeParse(id).success)) {
    throw new Error('A bracket requires 2–256 unique registered athletes');
  }
  let size = 2;
  while (size < ids.length) size *= 2;
  let positions = [1, 2];
  while (positions.length < size) {
    const sum = positions.length * 2 + 1;
    positions = positions.flatMap(seed => [seed, sum - seed]);
  }
  const rounds: SafeBracket['rounds'] = [];
  for (let count = size / 2, r = 0; count >= 1; count /= 2, r++) {
    const matches: SafeBracket['rounds'][number]['matches'] = [];
    for (let m = 0; m < count; m++) {
      const p1 = r === 0 ? ids[positions[m * 2] - 1] || 'BYE' : 'TBD';
      const p2 = r === 0 ? ids[positions[m * 2 + 1] - 1] || 'BYE' : 'TBD';
      matches.push({ p1, p2, score: 'Pending', winner: '' });
    }
    rounds.push({ round: count === 1 ? 'Final' : `Round ${r + 1}`, matches });
  }
  const bracket = { seeds: ids.map((fighterId, i) => ({ fighterId, seed: i + 1,
    rationale: 'Registration order; no performance ranking is inferred.' })), rounds };
  advanceWinners(bracket);
  return bracket;
}

/** Resolve byes and downstream participants; an undecided match stays TBD. */
export function advanceWinners(bracket: SafeBracket): SafeBracket {
  for (let r = 0; r < bracket.rounds.length; r++) {
    bracket.rounds[r].matches.forEach((match, m) => {
      if (r > 0) {
        match.p1 = bracket.rounds[r - 1].matches[m * 2].winner || 'TBD';
        match.p2 = bracket.rounds[r - 1].matches[m * 2 + 1].winner || 'TBD';
      }
      if (match.winner && match.winner !== match.p1 && match.winner !== match.p2) {
        match.winner = '';
        match.score = 'Pending';
      }
      if (match.p1 === 'BYE' && match.p2 !== 'TBD') match.winner = match.p2;
      if (match.p2 === 'BYE' && match.p1 !== 'TBD') match.winner = match.p1;
    });
  }
  return bracket;
}

/** Validate the entire tree, including downstream entrants and recorded winners. */
export function bracketProblem(bracket: SafeBracket, registrations: string[]): string | undefined {
  const roster = new Set(registrations);
  if (bracket.seeds.length < 2 || bracket.seeds.length !== roster.size ||
      new Set(bracket.seeds.map(s => s.fighterId)).size !== roster.size ||
      bracket.seeds.some(s => !roster.has(s.fighterId)) ||
      new Set(bracket.seeds.map(s => s.seed)).size !== roster.size ||
      bracket.seeds.some(s => s.seed > roster.size)) return 'Seeds must include every registered athlete exactly once';
  const expected = generateSingleElimination(bracket.seeds.slice().sort((a, b) => a.seed - b.seed).map(s => s.fighterId));
  if (bracket.rounds.length !== expected.rounds.length) return 'Invalid single-elimination round count';
  for (let r = 0; r < bracket.rounds.length; r++) {
    const round = bracket.rounds[r];
    if (round.matches.length !== expected.rounds[r].matches.length) return 'Invalid single-elimination match count';
    for (let m = 0; m < round.matches.length; m++) {
      const match = round.matches[m];
      const p1 = r === 0 ? expected.rounds[0].matches[m].p1 : bracket.rounds[r - 1].matches[m * 2].winner || 'TBD';
      const p2 = r === 0 ? expected.rounds[0].matches[m].p2 : bracket.rounds[r - 1].matches[m * 2 + 1].winner || 'TBD';
      if (match.p1 !== p1 || match.p2 !== p2) return 'Participants must follow the seed order and previous winners';
      if (match.winner && (match.p1 === 'TBD' || match.p2 === 'TBD' ||
          (match.winner !== p1 && match.winner !== p2) || match.winner === 'BYE')) return 'Winner must be a competing athlete';
      if ((p1 === 'BYE' || p2 === 'BYE') && match.winner !== (p1 === 'BYE' ? p2 : p1)) return 'A bye must advance the competing athlete';
    }
  }
}

export const canTransitionTournament = (current: string, next: string) =>
  current === next || (current === 'upcoming' && next === 'ongoing') ||
  (current === 'ongoing' && next === 'completed');

export const escapeSearch = (search: string) => search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
