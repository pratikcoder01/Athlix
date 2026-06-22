const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const { getCoaches } = require('../controllers/coachController');

router.use(protect);

router.get('/', getCoaches);

module.exports = router;
