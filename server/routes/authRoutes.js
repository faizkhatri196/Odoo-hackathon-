const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');

const signupRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validate,
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

const forgotPasswordRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  validate,
];

const resetPasswordRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('otp').trim().notEmpty().withMessage('OTP is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
  validate,
];

router.post('/signup', signupRules, signup);
router.post('/register', signupRules, signup);
router.post('/login', loginRules, login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPasswordRules, forgotPassword);
router.post('/reset-password', resetPasswordRules, resetPassword);
router.get('/me', protect, getMe);

module.exports = router;


