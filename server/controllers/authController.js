const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_jwt_key_for_dojopro_authentication', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user (athlete, coach, admin)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, discipline, beltRank } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      const err = new Error('A user with that email already exists');
      err.statusCode = 400;
      return next(err);
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'athlete',
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
        discipline: user.discipline,
        beltRank: user.beltRank,
        profileImage: user.profileImage,
        bio: user.bio,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & return token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      return next(err);
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        discipline: user.discipline,
        beltRank: user.beltRank,
        profileImage: user.profileImage,
        bio: user.bio,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user context details
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};
