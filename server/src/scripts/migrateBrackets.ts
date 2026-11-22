import mongoose, { ClientSession, Types } from 'mongoose';
import { createHash } from 'crypto';
import { z } from 'zod';
import { Tournament } from '../models/Tournament';
import { User } from '../models/User';
import { BracketMigrationAudit } from '../models/BracketMigrationAudit';
import { bracketProblem, bracketSchema, objectIdSchema } from '../utils/tournamentPolicy';

const databaseName = z.string().regex(/^[a-zA-Z0-9_-]{1,63}$/).refine(value => !['admin', 'config', 'local'].includes(value.toLowerCase()), 'System databases are not migration targets');
const version = z.union([z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1), z.literal('missing')]);
const optionsSchema = z.object({
  tournamentId: objectIdSchema, database: databaseName,
  operator: z.string().trim().min(3).max(120).regex(/^[^\r\n\x00-\x1f]+$/),
  reason: z.string().trim().min(10).max(500).regex(/^[^\r\n\x00-\x1f]+$/),
  apply: z.boolean().default(false), expectedVersion: version.optional(),
  expectedSha256: z.string().regex(/^[a-f\d]{64}$/i).transform(value => value.toLowerCase()).optional(),
}).strict().refine(value => !value.apply || (value.expectedVersion !== undefined && value.expectedSha256 !== undefined),
  'Apply requires the reviewed source SHA-256 and exact expected version');
export type BracketMigrationOptions = z.infer<typeof optionsSchema>;
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

export function parseBracketMigrationArgs(args: string[]): BracketMigrationOptions {
  const flags: Record<string, string> = { '--tournament-id': 'tournamentId', '--database': 'database', '--operator': 'operator',
    '--reason': 'reason', '--expected-version': 'expectedVersion', '--expected-sha256': 'expectedSha256', '--apply': 'apply' };
  const values: Record<string, unknown> = {};
  for (let index = 0; index < args.length; index++) {
    const flag = args[index], key = Object.hasOwn(flags, flag) ? flags[flag] : undefined;
    if (!key || key in values) throw new Error('Unknown or duplicate migration argument');
    if (key === 'apply') { values.apply = true; continue; }
    const value = args[++index];
    if (!value || value.startsWith('--')) throw new Error('Missing migration argument value');
    if (key === 'expectedVersion') {
      if (value !== 'missing' && !/^\d+$/.test(value)) throw new Error('Expected version must be an integer or missing');
      values[key] = value === 'missing' ? value : Number(value);
    } else values[key] = value;
  }
  return optionsSchema.parse(values);
}

function idString(value: unknown): string {
  if (!(typeof value === 'string' || value instanceof Types.ObjectId)) throw new Error('A persisted identifier is ambiguous; manual review is required');
  return objectIdSchema.parse(String(value)).toLowerCase();
}

function assertUniqueJsonKeys(source: string) {
  // JSON.parse silently keeps the last duplicate key. A data-repair tool must
  // refuse that ambiguity, including differently escaped copies of the key.
  let at = 0;
  const whitespace = () => { while (/\s/.test(source[at] || '') && at < source.length) at++; };
  const string = (): string => {
    const start = at++;
    while (at < source.length) {
      if (source[at] === '\\') { at += 2; continue; }
      if (source[at++] === '"') return JSON.parse(source.slice(start, at));
    }
    throw new Error('Invalid JSON string');
  };
  const value = (depth: number): void => {
    if (depth > 32) throw new Error('Legacy JSON nesting is excessive; manual review is required');
    whitespace();
    if (source[at] === '"') { string(); return; }
    if (source[at] === '{') {
      at++; whitespace(); if (source[at] === '}') { at++; return; }
      const keys = new Set<string>();
      while (at < source.length) {
        whitespace(); const key = string();
        if (keys.has(key)) throw new Error('Duplicate JSON keys are ambiguous; manual review is required');
        keys.add(key); whitespace(); at++; value(depth + 1); whitespace();
        if (source[at++] === '}') return;
      }
    } else if (source[at] === '[') {
      at++; whitespace(); if (source[at] === ']') { at++; return; }
      while (at < source.length) { value(depth + 1); whitespace(); if (source[at++] === ']') return; }
    } else while (at < source.length && !/[,\]}\s]/.test(source[at])) at++;
  };
  // This scanner is called only after JSON.parse has verified the grammar.
  value(0);
}

export function prepareLegacyBracket(raw: Record<string, any>) {
  if (typeof raw.brackets !== 'string' || !raw.brackets.trim().startsWith('{') || Buffer.byteLength(raw.brackets, 'utf8') > 524288) {
    throw new Error('Only a bounded complete legacy bracket object encoded as JSON can be reviewed; seeds-only/rounds-only arrays are ambiguous');
  }
  if (!Array.isArray(raw.registrations) || raw.registrations.length < 2 || raw.registrations.length > 256) throw new Error('A persisted roster of 2–256 athletes is required');
  if (raw.divisions !== undefined && (!Array.isArray(raw.divisions) || raw.divisions.length)) throw new Error('Events with divisions require a separate reviewed migration');
  const roster = raw.registrations.map(idString);
  if (new Set(roster).size !== roster.length) throw new Error('Repeated roster identifiers require manual repair');
  const organizerId = idString(raw.organizerId);
  const previousVersion = Object.hasOwn(raw, '__v') ? version.parse(raw.__v) : 'missing';
  if (previousVersion === 'missing' && Object.hasOwn(raw, '__v')) throw new Error('Stored version is ambiguous');
  const state = z.enum(['upcoming', 'ongoing', 'completed']).parse(raw.status);
  let decoded: unknown;
  try { decoded = JSON.parse(raw.brackets); } catch { throw new Error('Legacy bracket JSON is invalid; no candidate was created'); }
  assertUniqueJsonKeys(raw.brackets);
  const bracket = bracketSchema.parse(decoded);
  // Canonical hexadecimal casing changes representation only, never identity.
  bracket.seeds.forEach(seed => { seed.fighterId = seed.fighterId.toLowerCase(); });
  for (const round of bracket.rounds) for (const match of round.matches) {
    if (/^[a-f\d]{24}$/i.test(match.p1)) match.p1 = match.p1.toLowerCase();
    if (/^[a-f\d]{24}$/i.test(match.p2)) match.p2 = match.p2.toLowerCase();
    if (/^[a-f\d]{24}$/i.test(match.winner || '')) match.winner = match.winner!.toLowerCase();
  }
  const problem = bracketProblem(bracket, roster); if (problem) throw new Error(problem);
  if (state === 'upcoming' && bracket.rounds.some(round => round.matches.some(match => match.winner && match.p1 !== 'BYE' && match.p2 !== 'BYE'))) {
    throw new Error('An upcoming event already contains contested results; manual status review is required');
  }
  if (state === 'completed' && !bracket.rounds.at(-1)?.matches[0]?.winner) throw new Error('A completed event has no recorded final winner');
  return { bracket, roster, organizerId, previousVersion, sourceSha256: sha256(raw.brackets), targetSha256: sha256(JSON.stringify(bracket)) };
}

function assertConnectedTarget(database: string) {
  if (mongoose.connection.readyState !== 1 || mongoose.connection.db?.databaseName !== database ||
      Tournament.db !== mongoose.connection || User.db !== mongoose.connection || BracketMigrationAudit.db !== mongoose.connection) {
    throw new Error('The active database must exactly match the explicitly reviewed migration target');
  }
}

async function readCandidate(options: BracketMigrationOptions, session?: ClientSession) {
  const raw = await Tournament.collection.findOne({ _id: new Types.ObjectId(options.tournamentId) }, { session });
  if (!raw) throw new Error('The selected tournament was not found');
  const candidate = prepareLegacyBracket(raw);
  if (options.expectedVersion !== undefined && options.expectedVersion !== candidate.previousVersion) throw new Error('Tournament version changed; repeat the review');
  if (options.expectedSha256 !== undefined && options.expectedSha256 !== candidate.sourceSha256) throw new Error('Raw bracket changed; repeat the review');
  const ids = [...new Set([...candidate.roster, candidate.organizerId])];
  const existing = await User.collection.find({ _id: { $in: ids.map(id => new Types.ObjectId(id)) } }, { projection: { _id: 1 }, session }).toArray();
  if (existing.length !== ids.length || new Set(existing.map(user => String(user._id))).size !== ids.length) throw new Error('Roster or organizer references a missing account; manual review is required');
  return { raw, candidate };
}

/** No connection fallback, collection scan, invented entrant or implicit apply. */
export async function migrateBrackets(input: BracketMigrationOptions) {
  const options = optionsSchema.parse(input); assertConnectedTarget(options.database);
  const initial = await readCandidate(options);
  const { candidate } = initial;
  const result = { tournamentId: options.tournamentId, database: options.database, operator: options.operator, reason: options.reason,
    applied: false, sourceSha256: candidate.sourceSha256, targetSha256: candidate.targetSha256,
    previousVersion: candidate.previousVersion, nextVersion: candidate.previousVersion === 'missing' ? 1 : candidate.previousVersion + 1,
    rosterCount: candidate.roster.length, bracket: candidate.bracket };
  if (!options.apply) return result;
  const session = await mongoose.startSession();
  try {
    const applied = await session.withTransaction(async () => {
      assertConnectedTarget(options.database);
      // Repeat source/roster/reference validation inside the same snapshot as the
      // migration, instead of trusting a preview read before the transaction.
      const { raw, candidate: current } = await readCandidate(options, session);
      const filter = { _id: raw._id, brackets: raw.brackets, registrations: raw.registrations, organizerId: raw.organizerId, status: raw.status,
        __v: current.previousVersion === 'missing' ? { $exists: false } : current.previousVersion,
        divisions: Object.hasOwn(raw, 'divisions') ? raw.divisions : { $exists: false } };
      const persisted = { ...current.bracket, seeds: current.bracket.seeds.map(seed => ({ ...seed, fighterId: new Types.ObjectId(seed.fighterId) })) };
      const changed = await Tournament.collection.updateOne(filter, { $set: { brackets: persisted, updatedAt: new Date() }, $inc: { __v: 1 } }, { session });
      if (changed.matchedCount !== 1 || changed.modifiedCount !== 1) throw new Error('Tournament changed concurrently; migration was not committed');
      await BracketMigrationAudit.create([{ tournamentId: raw._id, database: options.database, sourceSha256: current.sourceSha256,
        targetSha256: current.targetSha256, previousVersion: String(current.previousVersion), nextVersion: result.nextVersion,
        originalRawBrackets: raw.brackets, operator: options.operator, reason: options.reason }], { session });
      return true;
    }, { readPreference: 'primary', readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, maxCommitTimeMS: 10000 });
    if (!applied) throw new Error('Migration transaction did not commit');
  } finally { await session.endSession(); }
  return { ...result, applied: true };
}

export function reviewedMigrationUri(uri: string | undefined, database: string): string {
  databaseName.parse(database);
  if (!uri) throw new Error('MONGO_URI must explicitly identify the reviewed server; there is no default database');
  let parsed: URL;
  try { parsed = new URL(uri); } catch { throw new Error('MONGO_URI is invalid'); }
  if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol) || !parsed.hostname || parsed.hash) throw new Error('A MongoDB URI without a fragment is required');
  const path = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  if (path && path !== database) throw new Error('MONGO_URI database differs from the explicit migration target');
  return uri;
}

async function main() {
  const options = parseBracketMigrationArgs(process.argv.slice(2));
  const { config } = await import('dotenv'); config();
  const uri = reviewedMigrationUri(process.env.MONGO_URI, options.database);
  try {
    await mongoose.connect(uri, { dbName: options.database, serverSelectionTimeoutMS: 10000, autoCreate: false, autoIndex: false });
    // A review must not implicitly build indexes or mutate schema metadata.
    console.log(JSON.stringify(await migrateBrackets(options)));
    if (!options.apply) console.log('Dry run only. Review the candidate, database, source hash and version before preparing an approved --apply invocation.');
  } finally { await mongoose.disconnect(); }
}
if (require.main === module) void main().catch(() => {
  // Never print driver errors/URIs/raw documents that may disclose credentials.
  console.error('Bracket migration did not complete. Review arguments, target, candidate validation, transaction support and audit storage; no success is claimed.');
  process.exitCode = 1;
});
