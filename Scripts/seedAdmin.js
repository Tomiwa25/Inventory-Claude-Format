// One-time script to create the first superadmin account, since /users/createuser
// is now protected and requires an existing superadmin to call it.
// Usage: node Scripts/seedAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../Config/DatabaseConfig');
const User = require('../Models/Users');

const run = async () => {
    await connectDB();

    const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const existing = await User.findOne({ email });
    if (existing) {
        console.log(`A user with email ${email} already exists. Nothing to do.`);
        process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!', salt);

    await User.create({
        name: 'Super Admin',
        email,
        password: hashedPassword,
        gender: 'unspecified',
        phone: process.env.SEED_ADMIN_PHONE || '0000000000',
        role: 'superadmin',
        hasAdminAccess: true
    });

    console.log(`Superadmin created: ${email}`);
    console.log('Log in, then use /users/createuser to add the rest of your team.');
    process.exit(0);
};

run().catch(err => {
    console.error(err);
    process.exit(1);
});
