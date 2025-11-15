/**
 * Firebase Admin SDK initialization and utilities
 * @fileoverview Provides Firebase Admin SDK initialization and helper functions for authentication and Firestore
 * @module utils/firebaseAdmin
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import logger from './logger.js';

/**
 * Initialize Firebase Admin SDK
 * Uses service account credentials from environment variables
 * @returns {admin.app.App} Firebase Admin app instance
 */
const initializeFirebaseAdmin = () => {
  try {
    // Check if Firebase Admin is already initialized
    if (getApps().length > 0) {
      const fbLogger = logger.child({ component: 'firebase', operation: 'init' });
      fbLogger.info('Firebase Admin SDK already initialized');
      return getApps()[0];
    }

    // Validate required environment variables
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

    // Prepare service account credentials
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Handle private key with proper newline formatting
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };

    // Initialize Firebase Admin
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });

    const fbLogger = logger.child({ component: 'firebase', operation: 'init' });
    fbLogger.info('Firebase Admin SDK initialized successfully', {
      projectId: process.env.FIREBASE_PROJECT_ID,
      timestamp: new Date().toISOString()
    });

    return app;
  } catch (error) {
    const fbLogger = logger.child({ component: 'firebase', operation: 'init', error: true });
    fbLogger.error('Failed to initialize Firebase Admin SDK', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Initialize Firebase Admin on module load
const firebaseApp = initializeFirebaseAdmin();

/**
 * Get Firebase Auth instance
 * @returns {admin.auth.Auth} Firebase Auth instance
 */
export const getFirebaseAuth = () => {
  return getAuth(firebaseApp);
};

/**
 * Get Firestore instance
 * @returns {admin.firestore.Firestore} Firestore instance
 */
export const getFirebaseFirestore = () => {
  return getFirestore(firebaseApp);
};

/**
 * Verify Firebase ID token
 * @async
 * @param {string} idToken - Firebase ID token to verify
 * @returns {Promise<admin.auth.DecodedIdToken>} Decoded token with user information
 * @throws {Error} When token is invalid or verification fails
 */
export const verifyIdToken = async (idToken) => {
  try {
    if (!idToken || typeof idToken !== 'string') {
      throw new Error('ID token must be a non-empty string');
    }

    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    
    return decodedToken;
  } catch (error) {
    const fbLogger = logger.child({ component: 'firebase', operation: 'verify_token' });
    fbLogger.error('Failed to verify ID token', {
      message: error.message,
      code: error.code
    });
    throw error;
  }
};

/**
 * Create a new Firebase user
 * @async
 * @param {Object} userData - User data for account creation
 * @param {string} userData.email - User's email address
 * @param {string} userData.password - User's password
 * @param {string} userData.displayName - User's display name
 * @returns {Promise<admin.auth.UserRecord>} Created user record
 * @throws {Error} When user creation fails
 */
export const createFirebaseUser = async (userData) => {
  try {
    const { email, password, displayName } = userData;
    
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const auth = getFirebaseAuth();
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0],
      emailVerified: false
    });

    const fbLogger = logger.child({ component: 'firebase', operation: 'create_user' });
    fbLogger.info('Firebase user created successfully', {
      uid: userRecord.uid,
      email: userRecord.email
    });

    return userRecord;
  } catch (error) {
    const fbLogger = logger.child({ component: 'firebase', operation: 'create_user', error: true });
    fbLogger.error('Failed to create Firebase user', {
      message: error.message,
      code: error.code
    });
    throw error;
  }
};

/**
 * Set custom user claims (for role-based access control)
 * @async
 * @param {string} uid - User's Firebase UID
 * @param {Object} claims - Custom claims to set
 * @param {string} claims.role - User role (student, organizer, admin)
 * @returns {Promise<void>}
 * @throws {Error} When setting claims fails
 */
export const setCustomUserClaims = async (uid, claims) => {
  try {
    if (!uid) {
      throw new Error('UID is required');
    }

    const auth = getFirebaseAuth();
    await auth.setCustomUserClaims(uid, claims);

    const fbLogger = logger.child({ component: 'firebase', operation: 'set_claims' });
    fbLogger.info('Custom claims set successfully', {
      uid,
      claims
    });
  } catch (error) {
    const fbLogger = logger.child({ component: 'firebase', operation: 'set_claims', error: true });
    fbLogger.error('Failed to set custom claims', {
      message: error.message,
      code: error.code
    });
    throw error;
  }
};

/**
 * Get Firebase user by UID
 * @async
 * @param {string} uid - User's Firebase UID
 * @returns {Promise<admin.auth.UserRecord>} User record
 * @throws {Error} When user is not found
 */
export const getFirebaseUser = async (uid) => {
  try {
    if (!uid) {
      throw new Error('UID is required');
    }

    const auth = getFirebaseAuth();
    const userRecord = await auth.getUser(uid);
    
    return userRecord;
  } catch (error) {
    const fbLogger = logger.child({ component: 'firebase', operation: 'get_user', error: true });
    fbLogger.error('Failed to get Firebase user', {
      message: error.message,
      code: error.code
    });
    throw error;
  }
};

/**
 * Delete Firebase user
 * @async
 * @param {string} uid - User's Firebase UID
 * @returns {Promise<void>}
 * @throws {Error} When deletion fails
 */
export const deleteFirebaseUser = async (uid) => {
  try {
    if (!uid) {
      throw new Error('UID is required');
    }

    const auth = getFirebaseAuth();
    await auth.deleteUser(uid);

    const fbLogger = logger.child({ component: 'firebase', operation: 'delete_user' });
    fbLogger.info('Firebase user deleted successfully', { uid });
  } catch (error) {
    const fbLogger = logger.child({ component: 'firebase', operation: 'delete_user', error: true });
    fbLogger.error('Failed to delete Firebase user', {
      message: error.message,
      code: error.code
    });
    throw error;
  }
};

/**
 * Revoke refresh tokens for a user (force logout)
 * @async
 * @param {string} uid - User's Firebase UID
 * @returns {Promise<void>}
 * @throws {Error} When revocation fails
 */
export const revokeRefreshTokens = async (uid) => {
  try {
    if (!uid) {
      throw new Error('UID is required');
    }

    const auth = getFirebaseAuth();
    await auth.revokeRefreshTokens(uid);

    const fbLogger = logger.child({ component: 'firebase', operation: 'revoke_tokens' });
    fbLogger.info('Refresh tokens revoked successfully', { uid });
  } catch (error) {
    const fbLogger = logger.child({ component: 'firebase', operation: 'revoke_tokens', error: true });
    fbLogger.error('Failed to revoke refresh tokens', {
      message: error.message,
      code: error.code
    });
    throw error;
  }
};

export default firebaseApp;
