const mongoose = require('mongoose');

const electricityRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  },
  meterNumber: {
    type: String,
    required: [true, 'Meter number is required'],
    trim: true,
    match: [/^[A-Z0-9]{6,12}$/, 'Invalid meter number format']
  },
  previousReading: {
    type: Number,
    required: [true, 'Previous reading is required'],
    min: [0, 'Previous reading cannot be negative'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value) && value >= 0;
      },
      message: 'Previous reading must be a non-negative integer'
    }
  },
  currentReading: {
    type: Number,
    required: [true, 'Current reading is required'],
    min: [0, 'Current reading cannot be negative'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value) && value >= 0;
      },
      message: 'Current reading must be a non-negative integer'
    }
  },
  unitsConsumed: {
    type: Number,
    required: false,
    min: [0, 'Units consumed cannot be negative'],
    validate: {
      validator: function(value) {
        return !value || (Number.isInteger(value) && value >= 0);
      },
      message: 'Units consumed must be a non-negative integer'
    }
  },
  ratePerUnit: {
    type: Number,
    required: [true, 'Rate per unit is required'],
    min: [0.01, 'Rate per unit must be greater than 0'],
    max: [1000, 'Rate per unit cannot exceed 1000'],
    default: 8.0
  },
  totalAmount: {
    type: Number,
    required: false,
    min: [0, 'Total amount cannot be negative'],
    validate: {
      validator: function(value) {
        return !value || (typeof value === 'number' && value >= 0);
      },
      message: 'Total amount must be a non-negative number'
    }
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ['pending', 'paid', 'overdue', 'cancelled'],
      message: 'Payment status must be one of: pending, paid, overdue, cancelled'
    },
    default: 'pending',
    required: true
  },
  paymentDate: {
    type: Date,
    validate: {
      validator: function(value) {
        if (!value) return true;
        return value <= new Date();
      },
      message: 'Payment date cannot be in the future'
    }
  },
  paymentScreenshot: {
    type: String,
    trim: true,
    default: null
  },
  paymentSubmittedAt: {
    type: Date,
    default: null
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    validate: {
      validator: function(value) {
        if (!value) return true;
        
        // Get current date in local timezone (midnight)
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Parse the due date value
        const due = new Date(value);
        // Get date components in local timezone to avoid UTC issues
        const dueDate = new Date(due.getFullYear(), due.getMonth(), due.getDate());
        
        // Allow today or future dates (dueDate >= today)
        return dueDate.getTime() >= today.getTime();
      },
      message: 'Due date must be today or in the future'
    }
  },
  billImage: {
    type: String,
    validate: {
      validator: function(value) {
        if (!value) return true;
        return /^[\/\w\-\.]+$/.test(value) || /^https?:\/\/.+/.test(value);
      },
      message: 'Invalid bill image path or URL'
    }
  },
  remarks: {
    type: String,
    maxlength: [500, 'Remarks cannot exceed 500 characters'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      ret.unitsConsumed = ret.unitsConsumed || 0;
      ret.totalAmount = ret.totalAmount || 0;
      return ret;
    }
  }
});

electricityRecordSchema.index({ user: 1, createdAt: -1 });
electricityRecordSchema.index({ meterNumber: 1, createdAt: -1 });
electricityRecordSchema.index({ paymentStatus: 1 });
electricityRecordSchema.index({ dueDate: 1 });
electricityRecordSchema.index({ createdAt: -1 });
electricityRecordSchema.index({ 'user.meterNumber': 1 });

electricityRecordSchema.virtual('isOverdue').get(function() {
  if (this.paymentStatus === 'paid') return false;
  return this.dueDate < new Date();
});

electricityRecordSchema.virtual('daysUntilDue').get(function() {
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

electricityRecordSchema.virtual('statusColor').get(function() {
  switch (this.paymentStatus) {
    case 'paid': return 'success';
    case 'overdue': return 'danger';
    case 'cancelled': return 'secondary';
    default: return 'warning';
  }
});

electricityRecordSchema.pre('save', function(next) {
  if (this.currentReading < this.previousReading) {
    return next(new Error('Current reading cannot be less than previous reading'));
  }

  // Calculate units and amount
  this.unitsConsumed = this.currentReading - this.previousReading;
  this.totalAmount = Math.round((this.unitsConsumed * this.ratePerUnit) * 100) / 100;

  // Only auto-update status if it's a new record or status hasn't been explicitly set
  // Don't override manually set statuses
  if (this.isNew && !this.paymentStatus) {
    if (this.dueDate < new Date()) {
      this.paymentStatus = 'overdue';
    } else {
      this.paymentStatus = 'pending';
    }
  } else if (this.isModified('dueDate') && this.paymentStatus !== 'paid' && this.paymentStatus !== 'cancelled') {
    // Only auto-update to overdue if dueDate changed and status is not paid/cancelled
    if (this.dueDate < new Date()) {
      this.paymentStatus = 'overdue';
    }
  }

  this.updatedAt = Date.now();
  next();
});

electricityRecordSchema.post('save', function(doc) {
  if (typeof doc.unitsConsumed !== 'number' || typeof doc.totalAmount !== 'number') {
    console.error('Calculated fields not set properly:', {
      unitsConsumed: doc.unitsConsumed,
      totalAmount: doc.totalAmount
    });
  }
});

electricityRecordSchema.statics.findOverdue = function() {
  return this.find({
    paymentStatus: { $nin: ['paid', 'cancelled'] },
    dueDate: { $lt: new Date() }
  }).populate('user', 'name email meterNumber');
};

electricityRecordSchema.statics.findByStatus = function(status) {
  return this.find({ paymentStatus: status }).populate('user', 'name email meterNumber');
};

electricityRecordSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    createdAt: { $gte: startDate, $lte: endDate }
  }).populate('user', 'name email meterNumber');
};

electricityRecordSchema.methods.markAsPaid = function() {
  this.paymentStatus = 'paid';
  this.paymentDate = new Date();
  return this.save();
};

electricityRecordSchema.methods.calculateLateFees = function() {
  if (this.paymentStatus === 'paid') return 0;
  const now = new Date();
  const due = new Date(this.dueDate);
  if (due >= now) return 0;
  const daysLate = Math.ceil((now - due) / (1000 * 60 * 60 * 24));
  const lateFeeRate = 0.05;
  return Math.round((this.totalAmount * lateFeeRate * daysLate) * 100) / 100;
};

module.exports = mongoose.model('ElectricityRecord', electricityRecordSchema);


