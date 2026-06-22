const Gym = require('../models/Gym');

// @desc    Get all gyms with optional query filters (search, discipline, location)
// @route   GET /api/gyms
// @access  Private
exports.getGyms = async (req, res, next) => {
  try {
    const { search, discipline, location } = req.query;
    const query = {};

    if (discipline) {
      query.discipline = discipline;
    }
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const gyms = await Gym.find(query);
    res.status(200).json({ success: true, gyms });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new gym/dojo record
// @route   POST /api/gyms
// @access  Private (Coach or Admin role)
exports.createGym = async (req, res, next) => {
  try {
    const { name, address, discipline, images, location } = req.body;

    if (!name || !address || !location) {
      const err = new Error('Missing required fields: Gym name, address, and location description');
      err.statusCode = 400;
      return next(err);
    }

    const gym = await Gym.create({
      name,
      address,
      discipline: discipline || [],
      images: images || [],
      location,
    });

    res.status(201).json({ success: true, gym });
  } catch (error) {
    next(error);
  }
};
