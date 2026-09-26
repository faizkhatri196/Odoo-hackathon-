const mongoose = require('mongoose');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const generateOTP = require('../utils/generateOTP');

const Company = require('../models/Company');
const Warehouse = require('../models/Warehouse');
const Category = require('../models/Category');

exports.signup = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database is currently not connected. Please verify your internet connection and MongoDB Atlas IP whitelist (0.0.0.0/0).',
      });
    }

    const { name, email, password, role, companyName, warehouse } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Determine Company for this registration
    let companyDoc = null;
    const finalRole = role || 'admin';

    // If companyName is provided or this is an admin registration, create an isolated company
    if (companyName || finalRole === 'admin') {
      const finalCompName = (companyName || `${name}'s Logistics Enterprise`).trim();
      const rawCode = finalCompName.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase() || 'CORP';
      companyDoc = await Company.create({
        name: finalCompName,
        code: rawCode,
        currency: 'USD',
      });
    }

    const userData = {
      name: (name || '').trim(),
      email: normalizedEmail,
      password,
      role: finalRole,
      company: companyDoc ? companyDoc._id : null,
      companyName: companyDoc ? companyDoc.name : '',
    };

    if (warehouse) userData.warehouse = warehouse;

    const user = await User.create(userData);

    // If company was created, link admin and provision default starter facility
    if (companyDoc) {
      companyDoc.admin = user._id;
      await companyDoc.save();

      // Automatically provision initial warehouse facility for this new company
      const initialWh = await Warehouse.create({
        company: companyDoc._id,
        name: `${companyDoc.name} Central Logistics Hub`,
        code: `WH-${companyDoc.code || 'MAIN'}`,
        location: { address: 'Primary Logistics Hub, Gate 1', city: 'Metropolitan Logistics Park' },
        capacity: 50000,
        manager: user._id,
        isActive: true,
      });

      user.warehouse = initialWh._id;
      await user.save();

      // Provision starter standard categories for this company
      await Category.insertMany([
        { company: companyDoc._id, name: 'Industrial Electronics & Motors', code: 'ELEC' },
        { company: companyDoc._id, name: 'Raw Materials & Metals', code: 'METL' },
        { company: companyDoc._id, name: 'Safety & Warehouse Supplies', code: 'SAFE' },
      ]).catch(() => {});
    }

    const token = generateToken(user._id, user.role);

    const userPayload = {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company || null,
      companyName: user.companyName || '',
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

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database is currently not connected. Please verify your internet connection and MongoDB Atlas IP whitelist (0.0.0.0/0).',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail })
      .select('+password')
      .populate('company', 'name code')
      .populate('warehouse', 'name code');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact administrator.' });
    }

    const token = generateToken(user._id, user.role);

    const userPayload = {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company?._id || user.company || null,
      companyName: user.company?.name || user.companyName || '',
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
    const user = await User.findById(req.user.id)
      .populate('warehouse', 'name code')
      .populate('company', 'name code');
    res.json({
      success: true,
      user,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
