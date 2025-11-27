const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, authRateLimit } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Name can only contain letters and spaces'),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
      .custom(async value => {
        const existingUser = await User.findByEmail(value);
        if (existingUser) {
          throw new Error('Email already registered');
        }
        return true;
      }),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('meterNumber')
      .trim()
      .customSanitizer(value => value ? value.toUpperCase() : value)
      .isLength({ min: 6, max: 12 })
      .withMessage('Meter number must be between 6 and 12 characters')
      .matches(/^[A-Z0-9]+$/)
      .withMessage('Meter number can only contain letters and numbers')
      .custom(async value => {
        if (!value) return true;
        const existingUser = await User.findOne({ meterNumber: value.toUpperCase() });
        if (existingUser) {
          throw new Error('Meter number already registered');
        }
        return true;
      }),
    body('address')
      .trim()
      .isLength({ min: 10, max: 200 })
      .withMessage('Address must be between 10 and 200 characters'),
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^[\+]?[1-9][\d]{7,15}$/)
      .withMessage('Please provide a valid phone number (8-15 digits, may start with +)')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorDetails = errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value
        }));
        console.error('🚨 Registration Validation Error:', errorDetails);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errorDetails
        });
      }

      const { name, email, password, meterNumber, address, phone } = req.body;

      const user = new User({
        name: name.trim(),
        email: email.toLowerCase(),
        password,
        meterNumber: (meterNumber || '').trim().toUpperCase(),
        address: address.trim(),
        phone: phone.trim(),
        role: 'user'
      });

      await user.save();

      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      console.log(`✅ New user registered: ${email} (${meterNumber})`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            meterNumber: user.meterNumber,
            address: user.address,
            phone: user.phone
          }
        }
      });
    } catch (err) {
      console.error('🚨 Registration Error:', {
        error: err.message,
        email: req.body.email,
        meterNumber: req.body.meterNumber
      });

      if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
          success: false,
          message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
          code: 'DUPLICATE_FIELD'
        });
      }

      // Handle validation errors from Mongoose
      if (err.name === 'ValidationError') {
        const validationErrors = Object.values(err.errors).map(e => ({
          field: e.path,
          message: e.message
        }));
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        success: false,
        message: err.message || 'Server error during registration',
        code: 'REGISTRATION_ERROR'
      });
    }
  }
);

router.post(
  '/login',
  authRateLimit,
  [
    body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
        });
      }

      const { email, password } = req.body;
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
      }

      if (user.isLocked) {
        const lockTime = new Date(user.lockUntil);
        const remainingTime = Math.ceil((lockTime - Date.now()) / 1000);
        return res.status(423).json({
          success: false,
          message: 'Account is temporarily locked due to multiple failed login attempts',
          code: 'ACCOUNT_LOCKED',
          lockUntil: user.lockUntil,
          remainingTime: remainingTime > 0 ? remainingTime : 0
        });
      }

      if (!user.isActive) {
        return res.status(401).json({ success: false, message: 'Account is deactivated', code: 'ACCOUNT_DEACTIVATED' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        await user.incLoginAttempts();
        return res.status(400).json({ success: false, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
      }

      if (user.loginAttempts > 0) {
        await user.resetLoginAttempts();
      }

      // Update lastLogin without triggering full validation
      // Using updateOne to avoid validating unchanged fields like meterNumber
      await User.updateOne(
        { _id: user._id },
        { $set: { lastLogin: new Date() } }
      );

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            meterNumber: user.meterNumber,
            address: user.address,
            phone: user.phone
          }
        }
      });
    } catch (err) {
      console.error('🚨 Login Error:', { error: err.message, email: req.body.email });
      res.status(500).json({ success: false, message: 'Server error during login', code: 'LOGIN_ERROR' });
    }
  }
);

router.get('/me', auth, async (req, res) => {
  try {
    res.json({ success: true, data: { user: req.user } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error while fetching profile', code: 'PROFILE_FETCH_ERROR' });
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -loginAttempts -lockUntil');
    res.json({ success: true, data: { user } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error while fetching profile', code: 'PROFILE_FETCH_ERROR' });
  }
});

router.put(
  '/profile',
  auth,
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('address').optional().trim().isLength({ min: 10, max: 200 }).withMessage('Address must be between 10 and 200 characters'),
    body('phone').optional().trim().matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Please provide a valid phone number'),
    body('upiId').optional().trim().matches(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/).withMessage('Please enter a valid UPI ID (e.g., yourname@paytm)')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      }

      const { name, address, phone, upiId } = req.body;
      const updates = {};
      if (name) updates.name = name.trim();
      if (address) updates.address = address.trim();
      if (phone) updates.phone = phone.trim();
      if (upiId !== undefined) updates.upiId = upiId.trim();

      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password -loginAttempts -lockUntil');
      res.json({ success: true, message: 'Profile updated successfully', data: { user } });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error while updating profile', code: 'PROFILE_UPDATE_ERROR' });
    }
  }
);

router.post('/logout', auth, async (req, res) => {
  try {
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during logout', code: 'LOGOUT_ERROR' });
  }
});

module.exports = router;



