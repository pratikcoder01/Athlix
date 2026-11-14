import { Response, NextFunction } from 'express';
import { PipelineStage } from 'mongoose';
import { directoryObjectId, literalSearch, profileQuerySchema, profileUpdateSchema } from '../utils/directoryPolicy';
import { User } from '../models/User';
import { Profile } from '../models/Profile';
import { CoachProfile } from '../models/CoachProfile';
import { AuthenticatedRequest } from '../types';
import { BookingPolicyError, coachSettingsSchema, validatePublishedCoach } from '../utils/bookingPolicy';
import { withScheduleTransaction } from '../utils/bookingTransaction';

// @desc    Get all user profiles (with search & discipline filters)
// @route   GET /api/profiles
// @access  Private
export const getProfiles = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = profileQuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid profile filters or pagination' });
    const { search, discipline, role, page, limit } = parsed.data;
    const pipeline: PipelineStage[] = [
      ...(discipline ? [{ $match: { discipline } } as PipelineStage] : []),
      { $lookup: { from: User.collection.name, localField: 'userId', foreignField: '_id', as: 'account' } },
      { $unwind: '$account' },
      { $match: { 'account.isActive': true, 'account.role': role || { $ne: 'admin' },
        ...(search ? { 'account.name': { $regex: literalSearch(search), $options: 'i' } } : {}) } },
      { $sort: { 'account.name': 1, _id: 1 } }, { $skip: (page - 1) * limit }, { $limit: limit + 1 },
      { $project: { _id: 1, userId: { _id: '$account._id', name: '$account.name', role: '$account.role' },
        bio: 1, discipline: 1, beltRank: 1, achievements: 1, location: 1, socialLinks: 1, profileImage: 1 } },
    ];
    const profiles = await Profile.aggregate(pipeline).exec();
    return res.status(200).json({ success: true, count: Math.min(profiles.length, limit), page, hasMore: profiles.length > limit, profiles: profiles.slice(0, limit) });
  } catch (error) { next(error); }
};

// @desc    Get detailed profile card by user ID
// @route   GET /api/profiles/:userId
// @access  Private
export const getProfileById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    if (!directoryObjectId.safeParse(userId).success) return res.status(400).json({ success: false, message: 'Invalid user identifier' });
    // Public profile responses never expose email, phone, Firebase UID or account controls.
    const user = await User.findOne({ _id: userId, isActive: true }).select('_id name role');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const profile = await Profile.findOne({ userId }).select('userId bio discipline beltRank achievements location socialLinks profileImage');
    
    let coachInfo = null;
    if (user.role === 'coach') {
      const canViewDraft = req.user?.role === 'admin' || String(req.user?._id) === userId.toLowerCase();
      coachInfo = await CoachProfile.findOne({ userId, ...(canViewDraft ? {} : { active: true }) })
        .select('certifications experienceYears pricingPerHour currency availability availabilityTimezone active autoConfirm');
    }

    res.status(200).json({
      success: true,
      user,
      profile,
      coachProfile: coachInfo,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile (athlete location, bio, achievements, etc.)
// @route   PUT /api/profiles
// @access  Private
export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const parsed = profileUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid profile details', errors: parsed.error.issues });
    const userId = req.user._id;
    const profile = await Profile.findOneAndUpdate({ userId }, {
      $set: parsed.data, $setOnInsert: { userId },
    }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update coach credentials, rate, and calendar availability
// @route   PUT /api/profiles/coach
// @access  Private (Coach only)
export const updateCoachProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.role !== 'coach') {
      return res.status(403).json({ success: false, message: 'Access denied: Coaches only' });
    }
    const parsed = coachSettingsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid coach settings', errors: parsed.error.issues });
    const userId = req.user._id;
    const coachProfile = await withScheduleTransaction([String(userId)], async (session) => {
      const current = await CoachProfile.findOne({ userId }).session(session);
      const settings = { ...current?.toObject(), ...parsed.data };
      if (settings.active === true) validatePublishedCoach(settings);
      const updated = await CoachProfile.findOneAndUpdate({ userId },
        { $set: parsed.data, $setOnInsert: { userId } }, { new: true, upsert: true, runValidators: true, session });
      if (!updated) throw new Error('Coach profile update did not commit');
      return updated;
    });

    res.status(200).json({
      success: true,
      message: 'Coaching profile updated successfully',
      coachProfile,
    });
  } catch (error) {
    if (error instanceof BookingPolicyError) return res.status(error.statusCode).json({ success: false, message: error.message });
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 20) {
      return res.status(503).json({ success: false, message: 'Coach settings require a transaction-capable MongoDB deployment' });
    }
    next(error);
  }
};
