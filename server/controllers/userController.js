const User = require('../models/User');

// @desc    Get all users with filter options (search, role, discipline)
// @route   GET /api/users
// @access  Private
exports.getUsers = async (req, res, next) => {
  try {
    const { role, discipline, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (discipline) query.discipline = discipline;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const users = await User.find(query).select('-password');
    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile details by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      const err = new Error('User profile not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile data
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res, next) => {
  try {
    // Auth validation: only user themselves or admins can edit
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      const err = new Error('Forbidden: Unauthorized to edit this profile');
      err.statusCode = 403;
      return next(err);
    }

    const { name, bio, discipline, beltRank, location, achievements, socialLinks, profileImage } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name;
    if (bio !== undefined) updateFields.bio = bio;
    if (discipline) updateFields.discipline = discipline;
    if (beltRank) updateFields.beltRank = beltRank;
    if (location !== undefined) updateFields.location = location;
    if (achievements) updateFields.achievements = achievements;
    if (socialLinks) updateFields.socialLinks = socialLinks;
    if (profileImage) updateFields.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
