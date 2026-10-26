import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { maskMongoUri } from '../config/db.js';
import User from '../models/user.model.js';

/**
 * Administrative Provisioning Script
 * Creates or elevates a verified Administrator account securely via CLI or environment
 * Usage: npm run create-admin -- <email> <password> "<name>"
 * Or via env: ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME=... npm run create-admin
 */
async function createAdmin() {
  const args = process.argv.slice(2);
  const email = (args[0] || process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = args[1] || process.env.ADMIN_PASSWORD || '';
  const name = (args[2] || process.env.ADMIN_NAME || 'System Administrator').trim();

  // Validate Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    console.error('❌ Error: A valid email address is required.');
    console.error('Usage: npm run create-admin -- <email> <password> "<name>"');
    console.error('Example: npm run create-admin -- admin@localhire.in "MySecretPass123!" "LocalHire Admin"');
    process.exit(1);
  }

  // Validate Password (never hardcode fallback password)
  if (!password || password.length < 8) {
    console.error('❌ Error: Password is required and must be at least 8 characters long.');
    console.error('Usage: npm run create-admin -- <email> <password> "<name>"');
    process.exit(1);
  }

  if (!config.mongoUri) {
    console.error('❌ Error: MONGODB_URI is not set in server/.env.');
    console.error('Please configure your MongoDB Atlas connection in server/.env before provisioning an administrator.');
    process.exit(1);
  }

  try {
    const maskedUri = maskMongoUri(config.mongoUri);
    console.log(`🔌 Connecting to MongoDB Atlas (${maskedUri})...`);
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB Atlas.');

    // Check if account already exists
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`ℹ️ Account with email "${email}" already exists.`);
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        existing.accountStatus = 'active';
        existing.isVerified = true;
        // Update password if new password was provided
        existing.password = password;
        await existing.save();
        console.log(`🛡️ Successfully elevated user "${email}" to administrator.`);
      } else {
        console.log(`🛡️ User "${email}" is already an active administrator.`);
      }
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create new administrator account
    const newAdmin = await User.create({
      name,
      email,
      password, // Password hashed via User model pre-validate hook
      role: 'admin',
      accountStatus: 'active',
      isVerified: true,
    });

    console.log('====================================================');
    console.log('🎉 Administrator account successfully provisioned!');
    console.log(`👤 Name:   ${newAdmin.name}`);
    console.log(`📧 Email:  ${newAdmin.email}`);
    console.log(`🛡️ Role:   ${newAdmin.role}`);
    console.log(`🏷️ Status: ${newAdmin.accountStatus}`);
    console.log('ℹ️ Credentials are ready. You can now sign in at /login');
    console.log('====================================================');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to provision administrator:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

createAdmin();
