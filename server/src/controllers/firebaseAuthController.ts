import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authAdmin } from '../config/firebase';
import { User } from '../models/User';
import { Profile } from '../models/Profile';
import { CoachProfile } from '../models/CoachProfile';

/**
 * Generate a signed ATHLIX JWT (same format as legacy authController).
 * All downstream protect() middleware and role checks remain unchanged.
 */
const generateToken = (id: any): string =>
  jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_jwt_key_for_athlix_authentication',
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
    const { idToken, name: bodyName, role: bodyRole, discipline } = req.body;

    if (!idToken) {
      return res
        .status(400)
        .json({ success: false, message: 'Firebase idToken is required' });
    }

    // 1. Verify the Firebase ID token
    let decodedToken: any;
    try {
      decodedToken = await authAdmin.verifyIdToken(idToken);
    } catch (firebaseError: any) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired Firebase token',
        detail: firebaseError.message,
      });
    }

    const { uid, email, phone_number, name: firebaseName } = decodedToken;

    // Resolve display name: body > Firebase token > fallback
    const resolvedName = bodyName || firebaseName || 'ATHLIX Athlete';
    const resolvedRole = bodyRole || 'athlete';

    // 2. Check if a user with this Firebase UID already exists
    let user = await User.findOne({ firebaseUid: uid });

    // 3a. If not found by UID, try matching by email (handles legacy accounts)
    if (!user && email) {
      user = await User.findOne({ email });
      if (user && !user.firebaseUid) {
        // Link the existing legacy account to Firebase
        user.firebaseUid = uid;
        await user.save();
      }
    }

    // 3b. First-time sign-in — create MongoDB records
    if (!user) {
      user = await User.create({
        name: resolvedName,
        email: email || undefined,
        phone: phone_number || undefined,
        firebaseUid: uid,
        role: resolvedRole,
        // No password — Firebase is the identity provider
      });

      // Create base profile
      await Profile.create({
        userId: user._id,
        discipline: discipline || 'BJJ',
        beltRank: 'White',
      });

      // Auto-create coach profile if role is coach
      if (resolvedRole === 'coach') {
        await CoachProfile.create({
          userId: user._id,
          experienceYears: 0,
          pricingPerHour: 50,
        });
      }
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
    next(error);
  }
};
