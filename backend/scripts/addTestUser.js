/**
 * Script to add a test user to MongoDB
 * Usage: node scripts/addTestUser.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Import User model
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

/**
 * Add test user to database
 */
async function addTestUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('📍 MongoDB URI:', process.env.MONGODB_URI?.replace(/:[^:@]+@/, ':****@'));
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to MongoDB successfully!');

    // Test user data
    const testUserData = {
      name: 'Rahul Sharma',
      email: 'rahul.sharma@student.thapar.edu',
      password: 'Student123',
      role: 'student'
    };

    // Check if user already exists
    const existingUser = await User.findOne({ email: testUserData.email });
    
    if (existingUser) {
      console.log('⚠️  User already exists:', testUserData.email);
      console.log('🗑️  Deleting existing user...');
      await User.deleteOne({ email: testUserData.email });
      console.log('✅ Existing user deleted');
    }

    // Hash the password
    console.log('🔐 Hashing password...');
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(testUserData.password, salt);

    // Create new user
    const newUser = new User({
      name: testUserData.name,
      email: testUserData.email,
      password: hashedPassword,
      role: testUserData.role
    });

    // Save to database
    await newUser.save();
    
    console.log('\n✅ Test user created successfully!');
    console.log('📧 Email:', testUserData.email);
    console.log('🔑 Password:', testUserData.password);
    console.log('👤 Role:', testUserData.role);
    console.log('🆔 User ID:', newUser._id);
    console.log('\n🎉 You can now login with these credentials!');

  } catch (error) {
    console.error('\n❌ Error adding test user:', error.message);
    
    if (error.name === 'MongoServerError' && error.code === 11000) {
      console.error('💡 Tip: User with this email already exists');
    } else if (error.name === 'MongooseServerSelectionError') {
      console.error('💡 Tip: Cannot connect to MongoDB. Check your connection string and network access.');
    } else if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.error('💡 Tip: SSL/TLS connection error. Check MongoDB Atlas IP whitelist.');
    }
    
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the script
addTestUser();
