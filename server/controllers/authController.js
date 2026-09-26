const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const generateOTP = require('../utils/generateOTP');

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, role, warehouse } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const userData = { name, email, password };
    if (role) userData.role = role;
    if (warehouse) userData.warehouse = warehouse;

    const user = await User.create(userData);
    const token = generateToken(user._id, user.role);

    const userPayload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      warehouse: user.warehouse || null,
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userPayload,
      data: {
        token,
        user: userPayload,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact administrator.' });
    }

    const token = generateToken(user._id, user.role);

    const userPayload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      warehouse: user.warehouse || null,
    };

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userPayload,
      data: {
        token,
        user: userPayload,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user with that email' });
    }

    const otp = generateOTP(6);
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    res.json({
      success: true,
      message: 'OTP sent to your registered email (Mocked in dev)',
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
      data: {
        email: user.email,
        expiresInMinutes: 15,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, OTP, and newPassword',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const user = await User.findOne({
      email,
      resetPasswordOtp: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful. You can now login.',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('warehouse', 'name code');
    res.json({
      success: true,
      user,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
