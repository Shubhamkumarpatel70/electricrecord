const express = require('express');
const { adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const ElectricityRecord = require('../models/ElectricityRecord');
const Customer = require('../models/Customer');

const router = express.Router();

router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password -loginAttempts -lockUntil').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/users/:id/upi', adminAuth, async (req, res) => {
  try {
    const { upiId } = req.body;
    if (upiId !== undefined && upiId !== '' && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) {
      return res.status(400).json({ message: 'Invalid UPI ID format' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { upiId: upiId ? upiId.trim() : '' },
      { new: true, runValidators: true }
    ).select('-password -loginAttempts -lockUntil');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ success: true, message: 'UPI ID updated successfully', data: { user } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/records', adminAuth, async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.paymentStatus = req.query.status;

    const records = await ElectricityRecord.find(query)
      .populate('user', 'name email meterNumber')
      .select('user previousReading currentReading unitsConsumed totalAmount paymentStatus paymentDate dueDate billImage paymentScreenshot paymentSubmittedAt remarks createdAt')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/records/:id/payment', adminAuth, async (req, res) => {
  try {
    const { status } = req.body; // 'pending' | 'paid' | 'overdue'
    const record = await ElectricityRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });

    record.paymentStatus = status;
    record.paymentDate = status === 'paid' ? new Date() : undefined;
    await record.save();

    res.json(record);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all customers (admin view) with statistics
router.get('/customers', adminAuth, async (req, res) => {
  try {
    const customers = await Customer.find({ isActive: true })
      .populate('addedBy', 'name email meterNumber')
      .sort({ createdAt: -1 });
    
    // Get statistics for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const records = await ElectricityRecord.find({
          user: customer.addedBy._id,
          customer: customer._id
        });

        const totalUnits = records.reduce((sum, r) => sum + (r.unitsConsumed || 0), 0);
        const totalAmount = records.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
        const paidAmount = records
          .filter(r => r.paymentStatus === 'paid')
          .reduce((sum, r) => sum + (r.totalAmount || 0), 0);
        const unpaidAmount = totalAmount - paidAmount;
        const paidCount = records.filter(r => r.paymentStatus === 'paid').length;
        const unpaidCount = records.length - paidCount;
        
        return {
          ...customer.toObject(),
          stats: {
            totalUnits,
            totalAmount,
            paidAmount,
            unpaidAmount,
            paidCount,
            unpaidCount,
            totalRecords: records.length
          }
        };
      })
    );

    res.json(customersWithStats);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;


