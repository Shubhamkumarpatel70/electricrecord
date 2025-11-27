const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\+]?[1-9][\d]{7,15}$/, 'Please enter a valid phone number']
  },
  meterNumber: {
    type: String,
    required: [true, 'Meter number is required'],
    trim: true,
    validate: {
      validator: function(value) {
        if (this.isNew || this.isModified('meterNumber')) {
          return /^[A-Z0-9]{6,12}$/.test(value);
        }
        return true;
      },
      message: 'Meter number must be 6-12 alphanumeric characters'
    }
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    minlength: [10, 'Address must be at least 10 characters long'],
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true
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
  timestamps: true
});

// Compound index to ensure unique meter number per user
customerSchema.index({ addedBy: 1, meterNumber: 1 }, { unique: true });
customerSchema.index({ addedBy: 1, createdAt: -1 });
customerSchema.index({ shareToken: 1 });

customerSchema.pre('save', function(next) {
  if (this.isModified('meterNumber')) {
    this.meterNumber = this.meterNumber.toUpperCase();
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Customer', customerSchema);

