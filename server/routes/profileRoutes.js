const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const { updateProfile, uploadAvatar, uploadVideo } = require('../controllers/profileController');
const { uploadImage, uploadVideo: videoMulter } = require('../config/cloudinary');

// Secure all routes in this file
router.use(protect);

router.put('/', updateProfile);
router.post('/upload-avatar', uploadImage.single('avatar'), uploadAvatar);
router.post('/upload-video', videoMulter.single('video'), uploadVideo);

module.exports = router;
