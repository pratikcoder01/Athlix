import { Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Profile } from '../models/Profile';
import { CoachProfile } from '../models/CoachProfile';
import { AuthenticatedRequest } from '../types';

// @desc    Get all user profiles (with search & discipline filters)
// @route   GET /api/profiles
// @access  Private
export const getProfiles = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { search, discipline, role } = req.query;
    
    // Find matching users if role is filtered
    const userQuery: any = {};
    if (role) userQuery.role = role;
    if (search) {
      userQuery.name = { $regex: search, $options: 'i' };
    }
    
    const users = await User.find(userQuery).select('_id name role');
    const userIds = users.map(u => u._id);

    const profileQuery: any = { userId: { $in: userIds } };
    if (discipline) profileQuery.discipline = discipline;

    const profiles = await Profile.find(profileQuery)
      .populate('userId', 'name role')
      .exec();

    res.status(200).json({
      success: true,
      count: profiles.length,
      profiles,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed profile card by user ID
// @route   GET /api/profiles/:userId
// @access  Private
export const getProfileById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const profile = await Profile.findOne({ userId });
    
    let coachInfo = null;
    if (user.role === 'coach') {
      coachInfo = await CoachProfile.findOne({ userId });
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
    const userId = req.user._id;
    const { bio, discipline, beltRank, achievements, location, socialLinks, profileImage } = req.body;

    let profile = await Profile.findOne({ userId });
    if (!profile) {
      profile = new Profile({ userId });
    }

    if (bio !== undefined) profile.bio = bio;
    if (discipline !== undefined) profile.discipline = discipline;
    if (beltRank !== undefined) profile.beltRank = beltRank;
    if (achievements !== undefined) profile.achievements = achievements;
    if (location !== undefined) profile.location = location;
    if (profileImage !== undefined) profile.profileImage = profileImage;
    
    if (socialLinks !== undefined) {
      profile.socialLinks = {
        ...profile.socialLinks,
        ...socialLinks,
      };
    }

    await profile.save();

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
    const userId = req.user._id;
    const { certifications, experienceYears, pricingPerHour, availability, active, autoConfirm } = req.body;

    let coachProfile = await CoachProfile.findOne({ userId });
    if (!coachProfile) {
      coachProfile = new CoachProfile({ userId });
    }

    if (certifications !== undefined) coachProfile.certifications = certifications;
    if (experienceYears !== undefined) coachProfile.experienceYears = experienceYears;
    if (pricingPerHour !== undefined) coachProfile.pricingPerHour = pricingPerHour;
    if (availability !== undefined) coachProfile.availability = availability;
    if (active !== undefined) coachProfile.active = active;
    if (autoConfirm !== undefined) coachProfile.autoConfirm = autoConfirm;

    await coachProfile.save();

    res.status(200).json({
      success: true,
      message: 'Coaching profile updated successfully',
      coachProfile,
    });
  } catch (error) {
    next(error);
  }
};
