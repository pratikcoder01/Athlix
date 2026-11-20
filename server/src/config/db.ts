import mongoose from 'mongoose';
import { verifyRequiredIndexes } from './indexes';

export const DATABASE_CAPABILITY_TIMEOUT_MS = 5_000;
const startupFailure = 'Database startup validation failed. Production requires a writable replica set or mongos with transaction and logical-session support, plus reviewed collections and required indexes.';

/** A read-only deployment capability check, not a transaction or permission probe. */
export function validateTransactionTopology(hello: unknown): 'replica_set' | 'mongos' {
  if (!hello || typeof hello !== 'object' || Array.isArray(hello)) throw new Error(startupFailure);
  const response = hello as Record<string, unknown>;
  const sessions = response.logicalSessionTimeoutMinutes;
  const wireVersion = response.maxWireVersion;
  const topology = response.msg === 'isdbgrid' ? 'mongos' : typeof response.setName === 'string' && response.setName.trim() ? 'replica_set' : null;
  // Wire version 8 is the minimum already required by the installed MongoDB
  // driver. An ordinary standalone hello can advertise sessions and writability
  // yet still cannot execute the application's multi-document transactions.
  if (response.ok !== 1 || response.isWritablePrimary !== true || response.readOnly === true || !topology ||
      typeof sessions !== 'number' || !Number.isFinite(sessions) || sessions <= 0 || !Number.isInteger(sessions) ||
      typeof wireVersion !== 'number' || !Number.isInteger(wireVersion) || wireVersion < 8) {
    throw new Error(startupFailure);
  }
  return topology;
}

export async function probeTransactionCapability(connection: Pick<mongoose.Connection, 'db'> = mongoose.connection) {
  try {
    if (!connection.db) throw new Error(startupFailure);
    const hello: unknown = await connection.db.admin().command({ hello: 1, maxTimeMS: DATABASE_CAPABILITY_TIMEOUT_MS }, {
      readPreference: 'primary', timeoutMS: DATABASE_CAPABILITY_TIMEOUT_MS,
    });
    return validateTransactionTopology(hello);
  } catch {
    // Driver errors can contain hostnames, credentials and database names.
    throw new Error(startupFailure);
  }
}

export const connectDB = async (environment: NodeJS.ProcessEnv = process.env) => {
  const production = environment.NODE_ENV === 'production';
  const uri = environment.MONGO_URI || (production ? '' : 'mongodb://127.0.0.1:27017/athlix');
  if (!uri) throw new Error('MONGO_URI is required in production');
  // Fail promptly rather than buffering requests against an unavailable database.
  mongoose.set('bufferCommands', false);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000, maxPoolSize: 20,
      ...(production ? { autoCreate: false, autoIndex: false } : {}),
    });
    // index.ts awaits this before server.listen: an unsupported production
    // topology must never advertise a ready API with unusable write journeys.
    if (production) {
      await probeTransactionCapability();
      await verifyRequiredIndexes();
    }
  } catch {
    try { await mongoose.disconnect(); } catch { /* Preserve the safe startup failure. */ }
    throw new Error(startupFailure);
  }
};

export default connectDB;
