import mongoose from 'mongoose';
import { isDeepStrictEqual } from 'node:util';

export const DATABASE_INDEX_TIMEOUT_MS = 5_000;
const indexFailure = 'Database index validation failed. Provision the reviewed collections and required indexes before production startup.';
type IndexSpec = Record<string, unknown>;

function matchesIndex(keys: IndexSpec, options: IndexSpec, actual: IndexSpec, identifier = false): boolean {
  // includeBuildUUIDs returns unfinished indexes as { spec, buildUUID }; they
  // must never satisfy a requirement before their unique constraint is ready.
  if (!actual.key || typeof actual.key !== 'object' || actual.buildUUID || actual.spec ||
      actual.hidden === true || actual.prepareUnique === true) return false;
  if (!isDeepStrictEqual(Object.entries(keys), Object.entries(actual.key))) return false;
  if (identifier ? actual.name !== '_id_' : (options.unique ?? false) !== (actual.unique ?? false)) return false;
  if ((options.sparse ?? false) !== (actual.sparse ?? false) ||
      options.expireAfterSeconds !== actual.expireAfterSeconds ||
      !isDeepStrictEqual(options.partialFilterExpression, actual.partialFilterExpression) ||
      !isDeepStrictEqual(options.collation ?? { locale: 'simple' }, actual.collation ?? { locale: 'simple' })) return false;
  return options.name === undefined || options.name === actual.name;
}

/** Read-only startup gate. Collection/index provisioning is a separate operator action. */
export async function verifyRequiredIndexes(connection: Pick<mongoose.Connection, 'db' | 'models'> = mongoose.connection): Promise<void> {
  try {
    const database = connection.db;
    const models = Object.values(connection.models);
    if (!database || models.length === 0) throw new Error(indexFailure);
    await Promise.all(models.map(async model => {
      // A native cursor command preserves includeBuildUUIDs, which the driver's
      // collection.listIndexes() helper does not forward. Every cursor has one
      // five-second read budget including server selection and all batches.
      // The driver bounds any subsequent cursor cleanup separately.
      const actual = await database.runCursorCommand({
        listIndexes: model.collection.name, includeBuildUUIDs: true, maxTimeMS: DATABASE_INDEX_TIMEOUT_MS,
      }, { readPreference: 'primary', timeoutMS: DATABASE_INDEX_TIMEOUT_MS, timeoutMode: 'cursorLifetime' }).toArray();
      if (!actual.some(index => matchesIndex({ _id: 1 }, {}, index, true))) throw new Error(indexFailure);
      for (const [keys, options] of model.schema.indexes()) {
        if (!actual.some(index => matchesIndex(keys, options, index))) throw new Error(indexFailure);
      }
    }));
  } catch {
    // Driver messages and index filters can contain credentials or private data.
    throw new Error(indexFailure);
  }
}
