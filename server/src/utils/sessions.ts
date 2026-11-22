import { createHash, randomBytes } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AuthSession } from '../models/AuthSession';
import { Profile } from '../models/Profile';
import { getJwtSecret } from '../config/jwt';
import { createOriginPolicy } from '../config/cors';

export const ACCESS_SECONDS = 15 * 60;
export const SESSION_SECONDS = 7 * 24 * 60 * 60;
const objectId = /^[a-f\d]{24}$/i;
export const hashCredential = (value: string) => createHash('sha256').update(value).digest('hex');
export const sessionVersion = (user: { sessionVersion?: number }) => user.sessionVersion ?? 0;

export const cookieOptions = () => {
  const production = process.env.NODE_ENV === 'production';
  const sameSite = process.env.AUTH_COOKIE_SAME_SITE || 'lax';
  if (!['lax', 'strict', 'none'].includes(sameSite) || (sameSite === 'none' && !production)) {
    throw new Error('Invalid AUTH_COOKIE_SAME_SITE configuration');
  }
  return { httpOnly: true, secure: production, sameSite: sameSite as 'lax' | 'strict' | 'none', path: '/' };
};
export const sessionCookieName = () => process.env.NODE_ENV === 'production' ? '__Host-athlix-refresh' : 'athlix-refresh';
export const readSessionCookie = (req: Request): { id: string; credential: string } | null => {
  const header = req.headers.cookie;
  if (!header || header.length > 16_384) return null;
  const name = `${sessionCookieName()}=`;
  const matches = header.split(';').map(part => part.trim()).filter(part => part.startsWith(name));
  if (matches.length !== 1) return null;
  const credential = matches[0].slice(name.length);
  const parts = credential.split('.');
  if (parts.length !== 2 || !objectId.test(parts[0]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[1])) return null;
  return { id: parts[0], credential };
};
export const clearSessionCookie = (res: Response) => res.clearCookie(sessionCookieName(), cookieOptions());

// Reject browser login CSRF even though CORS itself only hides the response.
export const trustedAuthOrigin = (req: Request, res: Response, next: NextFunction) => {
  if (!createOriginPolicy().isAllowed(req.headers.origin)) return res.status(403).json({ success: false, message: 'Untrusted authentication origin' });
  return next();
};
// Cookie-authorized mutations require a real allowlisted browser Origin AND a
// non-simple request header, independently of CORS and SameSite behavior.
export const sessionOrigin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.origin || req.get('X-ATHLIX-Session') !== '1' || !createOriginPolicy().isAllowed(req.headers.origin)) {
    return res.status(403).json({ success: false, message: 'Session request requires a trusted origin' });
  }
  return next();
};

export const signAccessToken = (user: { _id: unknown; sessionVersion?: number }, sessionId: unknown) => jwt.sign({
  id: String(user._id), sid: String(sessionId), ver: sessionVersion(user),
}, getJwtSecret(), { algorithm: 'HS256', expiresIn: ACCESS_SECONDS, issuer: 'athlix', audience: 'athlix-api' });

export interface AccessClaims extends JwtPayload { id: string; sid: string; ver: number; exp: number; iat: number }
export const verifyAccessToken = (token: string, secret = getJwtSecret()): AccessClaims => {
  const claims = jwt.verify(token, secret, { algorithms: ['HS256'], issuer: 'athlix', audience: 'athlix-api' });
  if (typeof claims !== 'object' || !objectId.test(claims.id) || !objectId.test(claims.sid) ||
      typeof claims.id !== 'string' || typeof claims.sid !== 'string' ||
      !Number.isSafeInteger(claims.ver) || claims.ver < 0 || !Number.isSafeInteger(claims.exp) ||
      !Number.isSafeInteger(claims.iat) || claims.exp! - claims.iat! > ACCESS_SECONDS ||
      claims.iat! > Math.floor(Date.now() / 1000) + 5) throw new Error('Invalid session token');
  return claims as AccessClaims;
};
export const sessionExists = async (id: string, userId: string, version = 0) => Boolean(await AuthSession.exists({
  _id: id, userId, sessionVersion: version, revokedAt: null, expiresAt: { $gt: new Date() },
}));

export const buildAuthUser = (user: any, profile: any) => ({
  id: user._id, name: user.name, email: user.email || '', phone: user.phone || '', role: user.role,
  profileImage: profile?.profileImage || '', bio: profile?.bio || '',
  discipline: profile?.discipline || 'BJJ', beltRank: profile?.beltRank || 'White',
});

export const ensureBaseProfile = async (userId: unknown, discipline = 'BJJ', beltRank = 'White') => {
  // A successful credential check can repair an interrupted signup. Existing
  // athlete edits are never overwritten, including concurrent repair attempts.
  try {
    return await Profile.findOneAndUpdate({ userId }, {
      $setOnInsert: { userId, discipline, beltRank },
    }, { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true });
  } catch (error: any) {
    if (error?.code !== 11000) throw error;
    const profile = await Profile.findOne({ userId });
    if (!profile) throw error;
    return profile;
  }
};

export const establishSession = async (req: Request, res: Response, user: any, profile: any, providerAuthTime?: number) => {
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);
  const secret = randomBytes(32).toString('base64url');
  // Allocate a document ID before hashing the complete opaque credential.
  const session = new AuthSession({ userId: user._id, expiresAt, providerAuthTime, sessionVersion: sessionVersion(user), credentialHash: 'pending' });
  const credential = `${session._id}.${secret}`;
  session.credentialHash = hashCredential(credential);
  await session.save();
  const previous = readSessionCookie(req);
  if (previous) await AuthSession.updateOne({ _id: previous.id, credentialHash: hashCredential(previous.credential), revokedAt: null }, { $set: { revokedAt: new Date() } });
  res.cookie(sessionCookieName(), credential, { ...cookieOptions(), maxAge: SESSION_SECONDS * 1000 });
  res.set('Cache-Control', 'no-store');
  return { success: true, token: signAccessToken(user, session._id), user: buildAuthUser(user, profile) };
};
