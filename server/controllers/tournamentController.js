const Tournament = require('../models/Tournament');

// @desc    Create a new tournament event
// @route   POST /api/tournaments
// @access  Private (Coach or Admin role)
exports.createTournament = async (req, res, next) => {
  try {
    const { title, discipline, location, date } = req.body;

    const tournament = await Tournament.create({
      title,
      discipline,
      location,
      organizer: req.user.id,
      date,
    });

    res.status(201).json({ success: true, tournament });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tournaments
// @route   GET /api/tournaments
// @access  Private
exports.getTournaments = async (req, res, next) => {
  try {
    const tournaments = await Tournament.find()
      .populate('organizer', 'name profileImage')
      .populate('participants', 'name profileImage beltRank discipline');

    res.status(200).json({ success: true, tournaments });
  } catch (error) {
    next(error);
  }
};

// @desc    Register for a tournament event
// @route   POST /api/tournaments/:id/register
// @access  Private (Athlete role)
exports.registerForTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      const err = new Error('Tournament not found');
      err.statusCode = 404;
      return next(err);
    }

    if (tournament.participants.includes(req.user.id)) {
      const err = new Error('Already registered for this event');
      err.statusCode = 400;
      return next(err);
    }

    tournament.participants.push(req.user.id);
    await tournament.save();

    const updatedTournament = await Tournament.findById(tournament._id)
      .populate('organizer', 'name profileImage')
      .populate('participants', 'name profileImage beltRank discipline');

    res.status(200).json({ success: true, tournament: updatedTournament });
  } catch (error) {
    next(error);
  }
};
