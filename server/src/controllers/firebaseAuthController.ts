import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { authAdmin } from '../config/firebase';
import { User } from '../models/User';
import { Profile } from '../models/Profile';
import { firebaseLoginSchema } from '../utils/validation';

import { getJwtSecret } from '../config/jwt';

/**
 * Generate a signed ATHLIX JWT (same format as legacy authController).
 * All downstream protect() middleware and role checks remain unchanged.
 */
const generateToken = (id: any): string =>
  jwt.sign(
    { id },
    getJwtSecret(),
    { expiresIn: '30d' }
  );

/**
 * Build the standard user response object used by every auth endpoint.
 */
const buildUserResponse = (user: any, profile: any) => ({
  id: user._id,
  name: user.name,
  email: user.email || '',
  phone: user.phone || '',
  role: user.role,
  profileImage: profile?.profileImage || '',
  bio: profile?.bio || '',
  discipline: profile?.discipline || 'BJJ',
  beltRank: profile?.beltRank || 'White',
});

// ---------------------------------------------------------------------------
// POST /api/auth/firebase
// ---------------------------------------------------------------------------
/**
 * Exchange a Firebase ID token for an ATHLIX JWT.
 *
 * Flow:
 *  1. Client authenticates with Firebase (any method: email, phone, Google…)
 *  2. Client calls getIdToken() and POSTs it here
 *  3. We verify the token with Firebase Admin SDK
 *  4. We find or create the MongoDB user record
 *  5. We issue an ATHLIX JWT — all subsequent requests use this JWT only
 *
 * Request body:
 *  { idToken: string, name?: string, role?: string, discipline?: string }
 */
export const firebaseLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = firebaseLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid Firebase authentication request', errors: parsed.error.issues });
    }
    const { idToken, name: bodyName, discipline } = parsed.data;

    // 1. Verify the Firebase ID token
    let decodedToken: DecodedIdToken;
    try {
      // checkRevoked also rejects disabled Firebase identities.
      decodedToken = await authAdmin.verifyIdToken(idToken, true);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired Firebase token',
      });
    }

    const { uid, email: tokenEmail, phone_number, name: firebaseName } = decodedToken;
    const email = tokenEmail?.trim().toLowerCase();

    // Resolve display name: body > Firebase token > fallback
    const resolvedName = bodyName || firebaseName || 'ATHLIX Athlete';

    // 2. Check if a user with this Firebase UID already exists
    let user = await User.findOne({ firebaseUid: uid });

    // 3a. If not found by UID, try matching by email (handles legacy accounts)
    if (!user && email) {
      user = await User.findOne({ email });
      if (user) {
        if (user.firebaseUid && user.firebaseUid !== uid) {
          return res.status(409).json({ success: false, message: 'This account is linked to a different Firebase identity' });
        }
        // A token containing an email does not prove ownership of that email.
        if (!user.firebaseUid && decodedToken.email_verified !== true) {
          return res.status(403).json({ success: false, message: 'Verify your email before linking an existing ATHLIX account' });
        }
        if (user.isActive !== true) {
          return res.status(403).json({ success: false, message: 'This account is inactive' });
        }
        if (!user.firebaseUid) {
          // Compare-and-set avoids overwriting a concurrent identity link.
          user = await User.findOneAndUpdate(
            { _id: user._id, firebaseUid: { $exists: false }, isActive: true },
            { $set: { firebaseUid: uid } },
            { new: true, runValidators: true }
          );
          if (!user) {
            return res.status(409).json({ success: false, message: 'Account linking changed; sign in again' });
          }
        }
      }
    }

    // 3b. First-time sign-in — create MongoDB records
    if (!user) {
      user = await User.create({
        name: resolvedName,
        email: email || undefined,
        phone: phone_number || undefined,
        firebaseUid: uid,
        role: 'athlete',
        // No password — Firebase is the identity provider
      });

      // Create base profile
      await Profile.create({
        userId: user._id,
        discipline: discipline || 'BJJ',
        beltRank: 'White',
      });

    }

    if (user.isActive !== true) {
      return res.status(403).json({ success: false, message: 'This account is inactive' });
    }

    // 4. Resolve profile for response
    const profile = await Profile.findOne({ userId: user._id });

    // 5. Issue ATHLIX JWT
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: buildUserResponse(user, profile),
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Account identity already exists; sign in again' });
    }
    next(error);
  }
};
