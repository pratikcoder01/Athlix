import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import { User } from '../models/User';
import { AuthSession } from '../models/AuthSession';
import { authAdmin } from '../config/firebase';
import { AuthenticatedRequest } from '../types';
import { buildAuthUser, clearSessionCookie, cookieOptions, ensureBaseProfile, hashCredential,
  readSessionCookie, sessionCookieName, sessionVersion, signAccessToken } from '../utils/sessions';

const rejectSession = (res: Response) => {
  clearSessionCookie(res);
  return res.status(401).json({ success: false, message: 'Your session expired. Please sign in again.' });
};

export const refreshSession = async (req: Request, res: Response, next: NextFunction) => {
  res.set('Cache-Control', 'no-store');
  try {
    const cookie = readSessionCookie(req);
    if (!cookie) return rejectSession(res);
    const record = await AuthSession.findOne({ _id: cookie.id, revokedAt: null, expiresAt: { $gt: new Date() } }).select('+credentialHash');
    if (!record) return rejectSession(res);
    const hash = hashCredential(cookie.credential);
    if (record.credentialHash !== hash) {
      // Only a previously valid credential proves replay. A random secret plus a
      // disclosed session ID must not let an attacker sign another person out.
      await AuthSession.updateOne({ _id: cookie.id, usedCredentialHashes: hash, revokedAt: null }, { $set: { revokedAt: new Date() } });
      return rejectSession(res);
    }
    const user = await User.findById(record.userId).select('-password');
    if (!user || user.isActive !== true || sessionVersion(user) !== record.sessionVersion) {
      await AuthSession.updateOne({ _id: record._id }, { $set: { revokedAt: new Date() } });
      return rejectSession(res);
    }
    if (user.firebaseUid) {
      // A Firebase password reset/disable/revoke must also stop ATHLIX renewal.
      // Provider outages fail closed without falsely saying the cookie is valid.
      const provider = await authAdmin.getUser(user.firebaseUid);
      const validAfter = provider.tokensValidAfterTime ? Date.parse(provider.tokensValidAfterTime) / 1000 : 0;
      if (provider.disabled || !Number.isFinite(record.providerAuthTime) || record.providerAuthTime! < validAfter) {
        await AuthSession.updateOne({ _id: record._id }, { $set: { revokedAt: new Date() } });
        return rejectSession(res);
      }
    }
    const profile = await ensureBaseProfile(user._id);
    const credential = `${record._id}.${randomBytes(32).toString('base64url')}`;
    const rotated = await AuthSession.findOneAndUpdate({
      _id: record._id, credentialHash: hash, revokedAt: null, expiresAt: { $gt: new Date() }, rotationCount: { $lt: 1024 },
    }, { $set: { credentialHash: hashCredential(credential) }, $push: { usedCredentialHashes: hash }, $inc: { rotationCount: 1 } }, { new: true });
    if (!rotated) {
      // A race/replay cannot mint two valid refresh credentials. Browser callers
      // serialize through Web Locks where supported; a race safely requires login.
      await AuthSession.updateOne({ _id: record._id, usedCredentialHashes: hash }, { $set: { revokedAt: new Date() } });
      return rejectSession(res);
    }
    res.cookie(sessionCookieName(), credential, { ...cookieOptions(), maxAge: Math.max(0, record.expiresAt.getTime() - Date.now()) });
    return res.json({ success: true, token: signAccessToken(user, record._id), user: buildAuthUser(user, profile) });
  } catch (error) { next(error); }
};

export const logoutSession = async (req: Request, res: Response, next: NextFunction) => {
  res.set('Cache-Control', 'no-store');
  try {
    const cookie = readSessionCookie(req);
    if (cookie) {
      const hash = hashCredential(cookie.credential);
      await AuthSession.updateOne({ _id: cookie.id, $or: [{ credentialHash: hash }, { usedCredentialHashes: hash }] }, { $set: { revokedAt: new Date() } });
    }
    clearSessionCookie(res);
    return res.json({ success: true });
  } catch (error) { next(error); }
};

export const logoutAllSessions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  res.set('Cache-Control', 'no-store');
  try {
    // The account version is the authoritative global revocation boundary, even
    // if the subsequent best-effort session cleanup fails or a login races it.
    await User.updateOne({ _id: req.user!._id, isActive: true }, { $inc: { sessionVersion: 1 } });
    await AuthSession.updateMany({ userId: req.user!._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
    clearSessionCookie(res);
    return res.json({ success: true });
  } catch (error) { next(error); }
};
