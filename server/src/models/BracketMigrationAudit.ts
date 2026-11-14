import { Schema, model } from 'mongoose';

// Restricted operator audit, not a tamper-proof ledger. No public write route.
const schema = new Schema({
  tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament', required: true, immutable: true, index: true },
  database: { type: String, required: true, immutable: true },
  sourceSha256: { type: String, required: true, immutable: true },
  targetSha256: { type: String, required: true, immutable: true },
  previousVersion: { type: String, required: true, immutable: true },
  nextVersion: { type: Number, required: true, immutable: true },
  originalRawBrackets: { type: String, required: true, immutable: true, maxlength: 524288 },
  operator: { type: String, required: true, immutable: true },
  reason: { type: String, required: true, immutable: true },
}, { timestamps: { createdAt: true, updatedAt: false } });
export const BracketMigrationAudit = model('BracketMigrationAudit', schema);
