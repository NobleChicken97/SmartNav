/**
 * Firebase Admin SDK initialization for Vercel Serverless
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Initialize Firebase Admin SDK (serverless-friendly)
 */
const initializeFirebaseAdmin = () => {
  try {
    if (getApps().length > 0) {
      return getApps()[0];
    }

    const requiredEnvVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required Firebase environment variables: ${missingVars.join(', ')}`
      );
    }

    // Handle private key - Vercel stores multi-line values with \n as literal string
    // We need to replace the literal \n text with actual newline characters
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.split('\\n').join('\n');

    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey
    };

    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });

    console.log('✅ Firebase Admin initialized');
    return app;
  } catch (error) {
    console.error('❌ Firebase Admin init failed:', error.message);
    throw error;
  }
};

const firebaseApp = initializeFirebaseAdmin();

export const getFirebaseAuth = () => getAuth(firebaseApp);
export const getFirebaseFirestore = () => getFirestore(firebaseApp);

export const verifyIdToken = async (idToken) => {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('ID token must be a non-empty string');
  }
  const auth = getFirebaseAuth();
  return await auth.verifyIdToken(idToken);
};

export const createFirebaseUser = async (userData) => {
  const { email, password, displayName } = userData;
  
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const auth = getFirebaseAuth();
  return await auth.createUser({
    email,
    password,
    displayName: displayName || email.split('@')[0],
    emailVerified: false
  });
};

export const setCustomUserClaims = async (uid, claims) => {
  if (!uid) throw new Error('UID is required');
  const auth = getFirebaseAuth();
  await auth.setCustomUserClaims(uid, claims);
};

export const getFirebaseUser = async (uid) => {
  if (!uid) throw new Error('UID is required');
  const auth = getFirebaseAuth();
  return await auth.getUser(uid);
};

export const deleteFirebaseUser = async (uid) => {
  if (!uid) throw new Error('UID is required');
  const auth = getFirebaseAuth();
  await auth.deleteUser(uid);
};

export const revokeRefreshTokens = async (uid) => {
  if (!uid) throw new Error('UID is required');
  const auth = getFirebaseAuth();
  await auth.revokeRefreshTokens(uid);
};

export default firebaseApp;
