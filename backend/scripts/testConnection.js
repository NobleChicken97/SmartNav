/**
 * MongoDB Connection Test Script
 * Tests different connection configurations
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🧪 MongoDB Connection Test\n');
console.log('📍 Testing connection to:', process.env.MONGODB_URI?.replace(/:[^:@]+@/, ':****@'));
console.log('');

async function testConnection() {
  const tests = [
    {
      name: 'Default Connection',
      options: {}
    },
    {
      name: 'With TLS Disabled',
      options: { tls: false }
    },
    {
      name: 'With SSL Validation Disabled',
      options: { tlsAllowInvalidCertificates: true, tlsAllowInvalidHostnames: true }
    }
  ];

  for (const test of tests) {
    try {
      console.log(`\n🔍 Test: ${test.name}`);
      console.log('⏳ Connecting...');
      
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        ...test.options
      });
      
      console.log('✅ SUCCESS! Connection established');
      console.log('📊 Database:', mongoose.connection.db.databaseName);
      console.log('🏠 Host:', mongoose.connection.host);
      
      await mongoose.connection.close();
      console.log('🔌 Connection closed');
      
      return; // Exit on first successful connection
      
    } catch (error) {
      console.log('❌ FAILED:', error.message);
      
      if (error.message.includes('SSL') || error.message.includes('TLS')) {
        console.log('💡 This is an SSL/TLS error - likely IP whitelist or network issue');
      } else if (error.message.includes('authentication failed')) {
        console.log('💡 Authentication failed - check username/password');
      } else if (error.message.includes('ENOTFOUND')) {
        console.log('💡 DNS resolution failed - check connection string');
      }
      
      try {
        await mongoose.connection.close();
      } catch (e) {
        // Ignore
      }
    }
  }
  
  console.log('\n\n❌ All connection attempts failed!');
  console.log('\n📋 Troubleshooting Steps:');
  console.log('1. Go to MongoDB Atlas → Network Access');
  console.log('2. Add your IP address or use 0.0.0.0/0 (allow from anywhere)');
  console.log('3. Go to Database Access and verify the user credentials');
  console.log('4. Make sure the cluster is running (not paused)');
}

testConnection();
