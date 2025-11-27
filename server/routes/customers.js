const express = require('express');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Customer = require('../models/Customer');
const ElectricityRecord = require('../models/ElectricityRecord');

const router = express.Router();

// Get all customers for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const customers = await Customer.find({ addedBy: req.user._id, isActive: true })
      .sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get single customer
router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findOne({ 
      _id: req.params.id, 
      addedBy: req.user._id 
    });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create new customer
router.post(
  '/',
  auth,
  [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('phone').trim().matches(/^[\+]?[1-9][\d]{7,15}$/).withMessage('Please provide a valid phone number'),
    body('meterNumber').trim().matches(/^[A-Z0-9]{6,12}$/).withMessage('Meter number must be 6-12 alphanumeric characters'),
    body('address').trim().isLength({ min: 10, max: 200 }).withMessage('Address must be between 10 and 200 characters'),
    body('email').optional().isEmail().withMessage('Please provide a valid email address')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, phone, meterNumber, address } = req.body;

      // Check if customer with same meter number already exists for this user
      const existing = await Customer.findOne({ 
        addedBy: req.user._id, 
        meterNumber: meterNumber.toUpperCase() 
      });
      if (existing) {
        return res.status(400).json({ message: 'Customer with this meter number already exists' });
      }

      const customer = new Customer({
        addedBy: req.user._id,
        name: name.trim(),
        email: email ? email.toLowerCase().trim() : undefined,
        phone: phone.trim(),
        meterNumber: meterNumber.toUpperCase().trim(),
        address: address.trim()
      });

      await customer.save();
      res.status(201).json(customer);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ message: 'Customer with this meter number already exists' });
      }
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// Update customer
router.put(
  '/:id',
  auth,
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }),
    body('phone').optional().trim().matches(/^[\+]?[1-9][\d]{7,15}$/),
    body('meterNumber').optional().trim().matches(/^[A-Z0-9]{6,12}$/),
    body('address').optional().trim().isLength({ min: 10, max: 200 }),
    body('email').optional().isEmail()
  ],
  async (req, res) => {
    try {
      const customer = await Customer.findOne({ 
        _id: req.params.id, 
        addedBy: req.user._id 
      });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      const updates = {};
      if (req.body.name) updates.name = req.body.name.trim();
      if (req.body.email) updates.email = req.body.email.toLowerCase().trim();
      if (req.body.phone) updates.phone = req.body.phone.trim();
      if (req.body.address) updates.address = req.body.address.trim();
      if (req.body.meterNumber) {
        const newMeterNumber = req.body.meterNumber.toUpperCase().trim();
        if (newMeterNumber !== customer.meterNumber) {
          const existing = await Customer.findOne({ 
            addedBy: req.user._id, 
            meterNumber: newMeterNumber,
            _id: { $ne: req.params.id }
          });
          if (existing) {
            return res.status(400).json({ message: 'Customer with this meter number already exists' });
          }
        }
        updates.meterNumber = newMeterNumber;
      }

      Object.assign(customer, updates);
      await customer.save();
      res.json(customer);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ message: 'Customer with this meter number already exists' });
      }
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// Delete customer (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findOne({ 
      _id: req.params.id, 
      addedBy: req.user._id 
    });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.isActive = false;
    await customer.save();
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Generate share link for customer
router.post('/:id/share-link', auth, async (req, res) => {
  try {
    const customer = await Customer.findOne({ 
      _id: req.params.id, 
      addedBy: req.user._id 
    });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Generate unique share token if doesn't exist
    if (!customer.shareToken) {
      customer.shareToken = crypto.randomBytes(32).toString('hex');
      await customer.save();
    }

    const shareLink = `${req.protocol}://${req.get('host')}/share/${customer.shareToken}`;
    res.json({ shareLink, shareToken: customer.shareToken });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Public route: Get customer by share token (requires phone verification)
router.post('/share/:token/verify', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const customer = await Customer.findOne({ 
      shareToken: req.params.token,
      isActive: true
    }).populate('addedBy', 'name email meterNumber upiId');

    if (!customer) {
      return res.status(404).json({ message: 'Invalid share link' });
    }

    // Verify phone number (normalize for comparison)
    // Remove all non-digit characters except + at the start
    const normalizePhone = (phoneNum) => {
      let normalized = phoneNum.trim();
      // Remove spaces, dashes, parentheses, dots
      normalized = normalized.replace(/[\s\-\(\)\.]/g, '');
      // If starts with +, keep it, otherwise remove any + signs
      if (normalized.startsWith('+')) {
        return normalized;
      }
      return normalized.replace(/\+/g, '');
    };

    const normalizedInputPhone = normalizePhone(phone);
    const normalizedCustomerPhone = normalizePhone(customer.phone);

    // Compare: exact match, or match without leading +
    const inputWithoutPlus = normalizedInputPhone.replace(/^\+/, '');
    const customerWithoutPlus = normalizedCustomerPhone.replace(/^\+/, '');

    if (normalizedInputPhone !== normalizedCustomerPhone && 
        inputWithoutPlus !== customerWithoutPlus &&
        normalizedInputPhone !== customerWithoutPlus &&
        inputWithoutPlus !== normalizedCustomerPhone) {
      return res.status(403).json({ message: 'Phone number does not match. Please enter the phone number registered with this account.' });
    }

    // Get customer records
    const records = await ElectricityRecord.find({
      user: customer.addedBy._id,
      customer: customer._id
    }).sort({ createdAt: -1 });

    // Calculate statistics
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const currentMonthRecords = records.filter(r => {
      const recordDate = new Date(r.createdAt);
      return recordDate >= startOfMonth && recordDate <= endOfMonth;
    });

    const currentMonthUnits = currentMonthRecords.reduce((sum, r) => sum + (r.unitsConsumed || 0), 0);
    const currentMonthAmount = currentMonthRecords.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const currentMonthPaid = currentMonthRecords
      .filter(r => r.paymentStatus === 'paid')
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const currentMonthUnpaid = currentMonthAmount - currentMonthPaid;

    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const prevMonthRecords = records.filter(r => {
      const recordDate = new Date(r.createdAt);
      return recordDate >= prevMonthStart && recordDate <= prevMonthEnd;
    });
    const previousMonthUnits = prevMonthRecords.reduce((sum, r) => sum + (r.unitsConsumed || 0), 0);

    const totalAmount = records.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const totalPaid = records
      .filter(r => r.paymentStatus === 'paid')
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const totalUnpaid = totalAmount - totalPaid;

    res.json({
      customer: {
        name: customer.name,
        meterNumber: customer.meterNumber,
        phone: customer.phone,
        email: customer.email,
        address: customer.address
      },
      user: {
        name: customer.addedBy.name,
        email: customer.addedBy.email,
        meterNumber: customer.addedBy.meterNumber,
        upiId: customer.addedBy.upiId || null
      },
      currentMonth: {
        units: currentMonthUnits,
        previousUnits: previousMonthUnits,
        amount: currentMonthAmount,
        paid: currentMonthPaid,
        unpaid: currentMonthUnpaid,
        records: currentMonthRecords.length
      },
      total: {
        amount: totalAmount,
        paid: totalPaid,
        unpaid: totalUnpaid,
        records: records.length
      },
      records: records.map(r => ({
        _id: r._id,
        date: r.createdAt,
        previousReading: r.previousReading,
        currentReading: r.currentReading,
        unitsConsumed: r.unitsConsumed,
        ratePerUnit: r.ratePerUnit,
        totalAmount: r.totalAmount,
        paymentStatus: r.paymentStatus,
        paymentScreenshot: r.paymentScreenshot,
        paymentSubmittedAt: r.paymentSubmittedAt,
        paymentDate: r.paymentDate,
        dueDate: r.dueDate,
        remarks: r.remarks
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get customer summary (for share)
router.get('/:id/summary', auth, async (req, res) => {
  try {
    const customer = await Customer.findOne({ 
      _id: req.params.id, 
      addedBy: req.user._id 
    });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get current month records
    const currentMonthRecords = await ElectricityRecord.find({
      user: req.user._id,
      customer: customer._id,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    }).sort({ createdAt: -1 });

    // Get all records for this customer
    const allRecords = await ElectricityRecord.find({
      user: req.user._id,
      customer: customer._id
    }).sort({ createdAt: -1 });

    // Calculate statistics
    const currentMonthUnits = currentMonthRecords.reduce((sum, r) => sum + (r.unitsConsumed || 0), 0);
    const currentMonthAmount = currentMonthRecords.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const currentMonthPaid = currentMonthRecords
      .filter(r => r.paymentStatus === 'paid')
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const currentMonthUnpaid = currentMonthAmount - currentMonthPaid;

    // Get previous month for comparison
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const prevMonthRecords = await ElectricityRecord.find({
      user: req.user._id,
      customer: customer._id,
      createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd }
    });
    const previousMonthUnits = prevMonthRecords.reduce((sum, r) => sum + (r.unitsConsumed || 0), 0);

    // Total statistics
    const totalAmount = allRecords.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const totalPaid = allRecords
      .filter(r => r.paymentStatus === 'paid')
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const totalUnpaid = totalAmount - totalPaid;

    res.json({
      customer: {
        name: customer.name,
        meterNumber: customer.meterNumber,
        phone: customer.phone,
        email: customer.email,
        address: customer.address
      },
      currentMonth: {
        units: currentMonthUnits,
        previousUnits: previousMonthUnits,
        amount: currentMonthAmount,
        paid: currentMonthPaid,
        unpaid: currentMonthUnpaid,
        records: currentMonthRecords.length
      },
      total: {
        amount: totalAmount,
        paid: totalPaid,
        unpaid: totalUnpaid,
        records: allRecords.length
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

