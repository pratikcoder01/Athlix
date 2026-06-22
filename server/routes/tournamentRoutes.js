const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const restrictTo = require('../middleware/roleMiddleware');
const { createTournament, getTournaments, registerForTournament } = require('../controllers/tournamentController');
const { tournamentSchema, validateBody } = require('../utils/validation');

router.use(protect);

router.get('/', getTournaments);
router.post('/', restrictTo('coach', 'admin'), validateBody(tournamentSchema), createTournament);
router.post('/:id/register', restrictTo('athlete'), registerForTournament);

module.exports = router;
