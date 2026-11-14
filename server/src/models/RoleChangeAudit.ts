import { Schema, model } from 'mongoose';

export const accountRoles = ['athlete', 'coach', 'academy_owner', 'tournament_organizer', 'admin'] as const;

// No public endpoint writes this collection. Keep database write access restricted
// to trusted operators; this is an audit trail, not a tamper-proof ledger.
const RoleChangeAuditSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true, index: true },
  previousRole: { type: String, enum: accountRoles, required: true, immutable: true },
  nextRole: { type: String, enum: accountRoles, required: true, immutable: true },
  operator: { type: String, required: true, immutable: true },
  reason: { type: String, required: true, immutable: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const RoleChangeAudit = model('RoleChangeAudit', RoleChangeAuditSchema);
