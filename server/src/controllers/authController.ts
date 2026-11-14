import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Profile } from '../models/Profile';
import { AuthenticatedRequest } from '../types';
import { registerSchema } from '../utils/validation';

import { getJwtSecret } from '../config/jwt';

// Generate JWT token helper
const generateToken = (id: any): string => {
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: '30d',
  });
};

// @desc    Register a new athlete; privileged roles require trusted provisioning.
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Enforce this policy in the handler as well as at the route boundary.
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid registration request', errors: parsed.error.issues });
    }
    const { name, email, password, discipline, beltRank } = parsed.data;

    const userExists = await User.findOne({ email });
    if (userExists) {
      const err: any = new Error('A user with that email already exists');
      err.statusCode = 400;
      return next(err);
    }

    // 1. Create User credentials
    const user = await User.create({
      name,
      email,
      password,
      role: 'athlete',
    });

    // 2. Create basic athlete/user profile
    const profile = await Profile.create({
      userId: user._id,
      discipline: discipline || 'BJJ',
      beltRank: beltRank || 'White',
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: profile.profileImage || '',
        bio: profile.bio || '',
        discipline: profile.discipline,
        beltRank: profile.beltRank,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & return token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.isActive !== true || !(await user.matchPassword(password))) {
      const err: any = new Error('Invalid email or password');
      err.statusCode = 401;
      return next(err);
    }

    // Resolve profile details
    const profile = await Profile.findOne({ userId: user._id });

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: profile?.profileImage || '',
        bio: profile?.bio || '',
        discipline: profile?.discipline || 'BJJ',
        beltRank: profile?.beltRank || 'White',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user details
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const profile = await Profile.findOne({ userId: req.user._id });
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        profileImage: profile?.profileImage || '',
        bio: profile?.bio || '',
        discipline: profile?.discipline || 'BJJ',
        beltRank: profile?.beltRank || 'White',
      },
    });
  } catch (error) {
    next(error);
  }
};
