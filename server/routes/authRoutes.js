const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  googleAuth,
  googleJuniorAuth,
  sendRegistrationOtp,
  verifyOtpAndRegister,
  sendForgotPasswordOtp,
  resetPasswordWithOtp,
  linkGoogleAccount,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/google', authLimiter, googleAuth);
router.post('/google-junior', authLimiter, googleJuniorAuth);
router.post('/send-otp', authLimiter, sendRegistrationOtp);
router.post('/verify-otp-register', authLimiter, verifyOtpAndRegister);
router.post('/forgot-password-otp', authLimiter, sendForgotPasswordOtp);
router.post('/reset-password-otp', authLimiter, resetPasswordWithOtp);
router.post('/link-google', protect, linkGoogleAccount);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

module.exports = router;
