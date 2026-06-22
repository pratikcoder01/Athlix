const User = require('../models/User');

// @desc    Update user profile data
// @route   PUT /api/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, discipline, beltRank, profileImage } = req.body;
    const updateFields = {};
    if (name) updateFields.name = name;
    if (bio !== undefined) updateFields.bio = bio;
    if (discipline) updateFields.discipline = discipline;
    if (beltRank) updateFields.beltRank = beltRank;
    if (profileImage) updateFields.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload avatar profile picture
// @route   POST /api/profile/upload-avatar
// @access  Private
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('No image file provided for upload');
      err.statusCode = 400;
      return next(err);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { profileImage: req.file.path } },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      profileImage: req.file.path,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload training video
// @route   POST /api/profile/upload-video
// @access  Private
exports.uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('No video file provided for upload');
      err.statusCode = 400;
      return next(err);
    }

    const { title } = req.body;

    const videoObj = {
      title: title || 'Training Video',
      url: req.file.path,
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { trainingVideos: videoObj } },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      video: videoObj,
      user,
    });
  } catch (error) {
    next(error);
  }
};
