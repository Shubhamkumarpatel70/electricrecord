const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const ElectricityRecord = require('../models/ElectricityRecord');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.get('/mine', auth, async (req, res) => {
  try {
    const query = { user: req.user._id };
    if (req.query.customerId) {
      query.customer = req.query.customerId;
    }
    const records = await ElectricityRecord.find(query)
      .populate('customer', 'name meterNumber phone email')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/last', auth, async (req, res) => {
  try {
    const query = { user: req.user._id };
    if (req.query.customerId) {
      query.customer = req.query.customerId;
    } else {
      // For self records, only get records without customer
      query.customer = { $exists: false };
    }
    const last = await ElectricityRecord.findOne(query)
      .sort({ createdAt: -1 });
    res.json(last || null);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post(
  '/',
  auth,
  upload.single('billImage'),
  [
    body('currentReading').isFloat({ min: 0 }),
    body('dueDate').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let previousReading;
      const currentReading = Number(req.body.currentReading);
      const ratePerUnit = Number(req.body.ratePerUnit || 8);

      // If previousReading is provided in body, use it (for manual entry)
      if (req.body.previousReading !== undefined && req.body.previousReading !== '' && req.body.previousReading !== null) {
        previousReading = Number(req.body.previousReading);
        if (isNaN(previousReading) || previousReading < 0) {
          return res.status(400).json({ message: 'Previous reading must be a valid number greater than or equal to 0' });
        }
      } else {
        // Otherwise, try to get from last record
        const query = { user: req.user._id };
        if (req.body.customerId) {
          query.customer = req.body.customerId;
        } else {
          // For self records, only get records without customer field
          query.$or = [
            { customer: { $exists: false } },
            { customer: null }
          ];
        }
        const last = await ElectricityRecord.findOne(query).sort({ createdAt: -1 });
        previousReading = last ? last.currentReading : 0;
      }

      if (currentReading <= previousReading) {
        return res.status(400).json({ message: 'Current reading must be greater than previous reading' });
      }

      // Validate customer if provided and get meter number
      let meterNumber = req.user.meterNumber;
      if (req.body.customerId) {
        const Customer = require('../models/Customer');
        const customer = await Customer.findOne({
          _id: req.body.customerId,
          addedBy: req.user._id,
          isActive: true
        });
        if (!customer) {
          return res.status(404).json({ message: 'Customer not found or you do not have access to this customer' });
        }
        meterNumber = customer.meterNumber;
      }

      // Parse due date - handle timezone issues
      // Date input from form is in YYYY-MM-DD format, parse it as local date
      let dueDate;
      if (!req.body.dueDate) {
        return res.status(400).json({ message: 'Due date is required' });
      }
      
      const dateStr = req.body.dueDate;
      if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Parse YYYY-MM-DD as local date (not UTC) - use noon to avoid timezone edge cases
        const [year, month, day] = dateStr.split('-').map(Number);
        dueDate = new Date(year, month - 1, day, 12, 0, 0); // Use noon to avoid timezone edge cases
      } else {
        dueDate = new Date(req.body.dueDate);
      }
      
      // Validate the parsed date
      if (isNaN(dueDate.getTime())) {
        return res.status(400).json({ message: 'Invalid due date format' });
      }

      const recordData = {
        user: req.user._id,
        meterNumber: meterNumber,
        previousReading,
        currentReading,
        ratePerUnit,
        dueDate: dueDate,
        billImage: req.file ? `/uploads/${req.file.filename}` : undefined,
        remarks: req.body.remarks || '',
        paymentStatus: req.body.paymentStatus || 'pending',
        customer: req.body.customerId || undefined
      };

      if (req.body.paymentStatus === 'paid') {
        recordData.paymentDate = new Date();
      }

      const record = new ElectricityRecord(recordData);
      await record.save();
      res.status(201).json(record);
    } catch (err) {
      console.error('Error creating record:', err);
      // Handle validation errors
      if (err.name === 'ValidationError') {
        const validationErrors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: validationErrors,
          error: err.message 
        });
      }
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// Update record (user can update their own records)
router.put(
  '/:id',
  auth,
  upload.single('billImage'),
  [
    body('currentReading').optional().isFloat({ min: 0 }),
    body('dueDate').optional().notEmpty(),
  ],
  async (req, res) => {
    try {
      const record = await ElectricityRecord.findById(req.params.id);
      if (!record) {
        return res.status(404).json({ message: 'Record not found' });
      }

      // Check if user owns this record
      if (record.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only update your own records' });
      }

      const updates = {};
      
      if (req.body.currentReading !== undefined) {
        const currentReading = Number(req.body.currentReading);
        if (currentReading < record.previousReading) {
          return res.status(400).json({ message: 'Current reading cannot be less than previous reading' });
        }
        updates.currentReading = currentReading;
        updates.unitsConsumed = currentReading - record.previousReading;
      }

      if (req.body.ratePerUnit !== undefined) {
        updates.ratePerUnit = Number(req.body.ratePerUnit);
      }

      if (req.body.dueDate !== undefined) {
        updates.dueDate = new Date(req.body.dueDate);
      }

      if (req.body.remarks !== undefined) {
        updates.remarks = req.body.remarks;
      }

      if (req.file) {
        updates.billImage = `/uploads/${req.file.filename}`;
      }

      // Recalculate total amount if currentReading or ratePerUnit changed
      if (updates.currentReading !== undefined || updates.ratePerUnit !== undefined) {
        const finalCurrentReading = updates.currentReading || record.currentReading;
        const finalRatePerUnit = updates.ratePerUnit || record.ratePerUnit;
        updates.unitsConsumed = finalCurrentReading - record.previousReading;
        updates.totalAmount = Math.round((updates.unitsConsumed * finalRatePerUnit) * 100) / 100;
      }

      // Apply updates
      Object.keys(updates).forEach(key => {
        record[key] = updates[key];
      });
      
      await record.save();

      res.json(record);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// Submit payment with screenshot (public route for share view)
router.post('/:id/submit-payment', upload.single('paymentScreenshot'), async (req, res) => {
  try {
    const record = await ElectricityRecord.findById(req.params.id)
      .populate('user', 'upiId name')
      .populate('customer', 'name phone');
    
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Payment screenshot is required' });
    }

    // Update record with payment screenshot
    record.paymentScreenshot = `/uploads/${req.file.filename}`;
    record.paymentSubmittedAt = new Date();
    // Keep status as pending until admin/user verifies
    await record.save();

    res.json({ 
      success: true, 
      message: 'Payment screenshot submitted successfully. Payment will be verified soon.',
      record: {
        _id: record._id,
        paymentScreenshot: record.paymentScreenshot,
        paymentSubmittedAt: record.paymentSubmittedAt
      }
    });
  } catch (err) {
    console.error('Error submitting payment:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update payment status (user can update their own records)
router.put('/:id/payment-status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['paid', 'pending', 'unpaid', 'overdue'].includes(status)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const record = await ElectricityRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Check if user owns this record
    if (record.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own records' });
    }

    record.paymentStatus = status === 'unpaid' ? 'pending' : status;
    record.paymentDate = status === 'paid' ? new Date() : undefined;
    await record.save();

    res.json(record);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;


