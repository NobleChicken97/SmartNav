import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: `${dirname(__dirname)}/.env` });

async function checkAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@thapar.edu' }).select('+password');
    
    if (!admin) {
      console.log('❌ No admin user found with email: admin@thapar.edu');
      return;
    }

    console.log('\n📋 Admin User Details:');
    console.log('ID:', admin._id);
    console.log('Name:', admin.name);
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
    console.log('Password Hash (first 50 chars):', admin.password?.substring(0, 50));
    console.log('Created At:', admin.createdAt);
    
    // Test password
    const testPassword = 'Admin123';
    const isMatch = await admin.comparePassword(testPassword);
    console.log(`\n🔐 Password "${testPassword}" matches:`, isMatch);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkAdminUser();
