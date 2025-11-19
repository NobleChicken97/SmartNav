/**
 * Verify User Creation Script
 * Tests that user creation properly sets custom claims with full profile
 * Creates a test user, verifies claims, then deletes it
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

import { getFirebaseAuth, getFirebaseFirestore } from '../src/utils/firebaseAdmin.js';
import { createUser, deleteUser } from '../src/repositories/userRepository.js';

const TEST_USER = {
  email: 'test-verification@example.com',
  password: 'TestPassword123!',
  name: 'Test User',
  role: 'student',
  interests: ['testing', 'verification'],
  photoURL: null
};

async function verifyUserCreation() {
  console.log('🧪 User Creation Verification Test\n');
  console.log('This test will:');
  console.log('  1. Create a test user');
  console.log('  2. Verify custom claims are set correctly');
  console.log('  3. Verify Firestore document is created');
  console.log('  4. Clean up (delete test user)\n');

  const auth = getFirebaseAuth();
  const db = getFirebaseFirestore();
  let testUserUid = null;

  try {
    // Step 1: Create test user
    console.log('📝 Step 1: Creating test user...');
    const user = await createUser(TEST_USER);
    testUserUid = user.uid;
    console.log(`  ✅ User created with UID: ${testUserUid}\n`);

    // Step 2: Verify custom claims
    console.log('🔍 Step 2: Verifying custom claims...');
    const authUser = await auth.getUser(testUserUid);
    const claims = authUser.customClaims || {};
    
    console.log('  Custom Claims:', JSON.stringify(claims, null, 2));
    
    // Check each required claim
    const checks = {
      'role': claims.role === TEST_USER.role,
      'name': claims.name === TEST_USER.name,
      'email': claims.email === TEST_USER.email,
      'interests (array)': Array.isArray(claims.interests),
      'interests (content)': JSON.stringify(claims.interests) === JSON.stringify(TEST_USER.interests),
      'photoURL': claims.photoURL === TEST_USER.photoURL
    };

    let allPassed = true;
    for (const [check, passed] of Object.entries(checks)) {
      if (passed) {
        console.log(`  ✅ ${check}: PASS`);
      } else {
        console.log(`  ❌ ${check}: FAIL`);
        allPassed = false;
      }
    }

    if (!allPassed) {
      throw new Error('Custom claims verification failed');
    }

    console.log('  ✅ All custom claims are correct!\n');

    // Step 3: Verify Firestore document
    console.log('🔍 Step 3: Verifying Firestore document...');
    const userDoc = await db.collection('users').doc(testUserUid).get();
    
    if (!userDoc.exists) {
      throw new Error('Firestore document not found');
    }

    const userData = userDoc.data();
    console.log('  Firestore Data:', JSON.stringify({
      name: userData.name,
      email: userData.email,
      role: userData.role,
      interests: userData.interests
    }, null, 2));

    const firestoreChecks = {
      'name': userData.name === TEST_USER.name,
      'email': userData.email === TEST_USER.email,
      'role': userData.role === TEST_USER.role,
      'interests': JSON.stringify(userData.interests) === JSON.stringify(TEST_USER.interests),
      'createdAt': !!userData.createdAt,
      'updatedAt': !!userData.updatedAt
    };

    let firestorePassed = true;
    for (const [check, passed] of Object.entries(firestoreChecks)) {
      if (passed) {
        console.log(`  ✅ ${check}: PASS`);
      } else {
        console.log(`  ❌ ${check}: FAIL`);
        firestorePassed = false;
      }
    }

    if (!firestorePassed) {
      throw new Error('Firestore document verification failed');
    }

    console.log('  ✅ Firestore document is correct!\n');

    // Step 4: Cleanup
    console.log('🧹 Step 4: Cleaning up test user...');
    await deleteUser(testUserUid);
    console.log('  ✅ Test user deleted\n');

    // Final result
    console.log('='.repeat(50));
    console.log('✅ VERIFICATION COMPLETE: ALL TESTS PASSED!');
    console.log('='.repeat(50));
    console.log('\n✨ User creation is working correctly!');
    console.log('✨ Custom claims include full profile (role, name, email, interests, photoURL)');
    console.log('✨ Firestore documents are created properly');
    console.log('\n👍 You can safely create new users.\n');

  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error.message);
    
    // Cleanup on error
    if (testUserUid) {
      console.log('\n🧹 Attempting cleanup of test user...');
      try {
        await deleteUser(testUserUid);
        console.log('  ✅ Test user cleaned up\n');
      } catch (cleanupError) {
        console.error('  ⚠️  Could not cleanup test user:', cleanupError.message);
        console.error(`  ⚠️  Please manually delete user: ${testUserUid}\n`);
      }
    }
    
    process.exit(1);
  }
}

// Run the script
verifyUserCreation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
