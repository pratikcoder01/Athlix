const User = require('../models/User');

// @desc    Retrieve list of coaches with search & filter
// @route   GET /api/coaches
// @access  Private
exports.getCoaches = async (req, res, next) => {
  try {
    const { search, discipline } = req.query;

    const query = { role: 'coach' };

    if (discipline) {
      query.discipline = discipline;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const coaches = await User.find(query).select('-password');
    
    res.status(200).json({
      success: true,
      coaches,
    });
  } catch (error) {
    next(error);
  }
};
