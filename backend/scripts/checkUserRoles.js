/**
 * Check User Roles and Custom Claims
 * Verifies that users have correct roles in Firestore and custom claims
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

import { getFirebaseAuth, getFirebaseFirestore } from '../src/utils/firebaseAdmin.js';

const testEmails = [
  'organizer1@thapar.edu',
  'organizer2@thapar.edu',
  'admin@thapar.edu'
];

async function checkUserRoles() {
  console.log('🔍 Checking User Roles and Custom Claims...\n');
  
  const auth = getFirebaseAuth();
  const db = getFirebaseFirestore();

  for (const email of testEmails) {
    try {
      console.log(`\n📧 Checking: ${email}`);
      
      // 1. Get Firebase Auth user
      const authUser = await auth.getUserByEmail(email);
      console.log(`  ✅ Firebase Auth UID: ${authUser.uid}`);
      
      // 2. Check custom claims
      const claims = authUser.customClaims || {};
      console.log(`  📋 Custom Claims:`, JSON.stringify(claims, null, 2));
      
      // 3. Check Firestore document
      const userDoc = await db.collection('users').doc(authUser.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log(`  📄 Firestore Role: ${userData.role}`);
        console.log(`  📄 Firestore Name: ${userData.name}`);
        
        // Compare
        if (claims.role === userData.role) {
          console.log(`  ✅ Claims and Firestore match!`);
        } else {
          console.log(`  ⚠️  MISMATCH: Claims role="${claims.role}" vs Firestore role="${userData.role}"`);
        }
      } else {
        console.log(`  ❌ No Firestore document found`);
      }
      
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`  ❌ User not found in Firebase Auth`);
      } else {
        console.error(`  ❌ Error:`, error.message);
      }
    }
  }
  
  console.log('\n✨ Check complete!');
}

checkUserRoles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
