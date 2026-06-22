const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const restrictTo = require('../middleware/roleMiddleware');
const { getGyms, createGym } = require('../controllers/gymController');

router.use(protect);

router.get('/', getGyms);
router.post('/', restrictTo('coach', 'admin'), createGym);

module.exports = router;
