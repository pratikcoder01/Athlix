import { Schema, model, Types } from 'mongoose';

export interface AuthSessionRecord {
  userId: Types.ObjectId;
  credentialHash: string;
  usedCredentialHashes: string[];
  sessionVersion: number;
  rotationCount: number;
  expiresAt: Date;
  revokedAt?: Date | null;
  providerAuthTime?: number;
}

const schema = new Schema<AuthSessionRecord>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  credentialHash: { type: String, required: true, select: false },
  usedCredentialHashes: { type: [String], default: [], select: false },
  sessionVersion: { type: Number, required: true, default: 0 },
  rotationCount: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
  providerAuthTime: { type: Number },
}, { timestamps: true });
// TTL cleanup is asynchronous; every authorization query independently checks expiry.
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const AuthSession = model<AuthSessionRecord>('AuthSession', schema);
