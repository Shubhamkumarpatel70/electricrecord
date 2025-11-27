const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/electricity-records';
  await mongoose.connect(uri);
  const email = process.env.ADMIN_EMAIL || 'admin@power.local';
  const password = process.env.ADMIN_PASSWORD || 'Admin@1234';
  const exists = await User.findOne({ email });
  if (exists) {
    console.log('Admin already exists:', email);
    await mongoose.disconnect();
    return;
  }
  const admin = new User({
    name: 'Administrator',
    email,
    password,
    meterNumber: 'ADMIN-0000',
    address: 'Head Office',
    phone: '0000000000',
    role: 'admin',
  });
  await admin.save();
  console.log('Admin created:', email);
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });


