/**
 * Create Organizer Users
 * Run this script to create organizer role users in Firebase
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

import { createFirebaseUser, setCustomUserClaims } from '../src/utils/firebaseAdmin.js';
import { createUser } from '../src/repositories/userRepository.js';

const organizers = [
  {
    email: 'organizer1@thapar.edu',
    password: 'Organizer123!',
    name: 'Event Organizer 1',
    role: 'organizer'
  },
  {
    email: 'organizer2@thapar.edu',
    password: 'Organizer123!',
    name: 'Event Organizer 2',
    role: 'organizer'
  },
  {
    email: 'admin@thapar.edu',
    password: 'Admin123!',
    name: 'Admin User',
    role: 'admin'
  }
];

async function createOrganizers() {
  console.log('🔥 Creating Organizer Users...\n');

  for (const org of organizers) {
    try {
      console.log(`Creating ${org.role}: ${org.email}`);
      
      // 1. Create Firebase Auth user
      const firebaseUser = await createFirebaseUser(
        org.email,
        org.password,
        org.name
      );
      
      console.log(`  ✅ Firebase user created: ${firebaseUser.uid}`);
      
      // 2. Set custom claims (role)
      await setCustomUserClaims(firebaseUser.uid, { role: org.role });
      console.log(`  ✅ Role set: ${org.role}`);
      
      // 3. Create Firestore user document
      await createUser({
        uid: firebaseUser.uid,
        email: org.email,
        name: org.name,
        role: org.role,
        photoURL: null,
        interests: []
      });
      
      console.log(`  ✅ Firestore document created\n`);
      
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`  ⚠️  User already exists: ${org.email}\n`);
      } else {
        console.error(`  ❌ Error creating ${org.email}:`, error.message, '\n');
      }
    }
  }
  
  console.log('✨ Done! Organizer users created.');
  console.log('\n📝 Login Credentials:');
  organizers.forEach(org => {
    console.log(`\n${org.role.toUpperCase()}:`);
    console.log(`  Email: ${org.email}`);
    console.log(`  Password: ${org.password}`);
  });
}

createOrganizers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
