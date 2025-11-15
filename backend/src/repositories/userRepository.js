/**
 * Firestore User Repository
 * @fileoverview Data access layer for user operations in Firestore
 * @module repositories/userRepository
 */

import { getFirebaseFirestore } from '../utils/firebaseAdmin.js';
import { 
  createFirebaseUser, 
  setCustomUserClaims,
  deleteFirebaseUser 
} from '../utils/firebaseAdmin.js';
import logger from '../utils/logger.js';

const db = getFirebaseFirestore();
const USERS_COLLECTION = 'users';

/**
 * Create a new user in Firebase Auth and Firestore
 * @async
 * @param {Object} userData - User data
 * @param {string} [userData.uid] - Firebase Auth UID (for Google OAuth users)
 * @param {string} userData.name - User's name
 * @param {string} userData.email - User's email
 * @param {string} [userData.password] - User's password (required for email/password auth)
 * @param {string[]} userData.interests - User's interests (optional)
 * @param {string} userData.role - User's role (default: 'user')
 * @param {string} [userData.photoURL] - User's photo URL (optional)
 * @returns {Promise<Object>} Created user object
 */
export const createUser = async (userData) => {
  try {
    const { uid, name, email, password, interests = [], role = 'user', photoURL = null } = userData;

    let firebaseUid = uid;

    // If UID is not provided (email/password registration), create Firebase Auth user
    if (!uid) {
      if (!password) {
        throw new Error('Password is required for email/password registration');
      }

      const firebaseUser = await createFirebaseUser({
        email,
        password,
        displayName: name
      });

      firebaseUid = firebaseUser.uid;
    }

    // Set custom claims for role
    await setCustomUserClaims(firebaseUid, { role });

    // Create user document in Firestore
    const userDoc = {
      name,
      email,
      role,
      interests,
      photoURL,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection(USERS_COLLECTION).doc(firebaseUid).set(userDoc);

    const repoLogger = logger.child({ component: 'user_repository', operation: 'create' });
    repoLogger.info('User created successfully', {
      uid: firebaseUid,
      email
    });

    // Return user object
    return {
      _id: firebaseUid,
      uid: firebaseUid,
      ...userDoc,
      // Exclude password from return (toJSON method for compatibility)
      toJSON: function() {
        // eslint-disable-next-line no-unused-vars
        const { password, ...rest } = this;
        return rest;
      }
    };
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'user_repository', 
      operation: 'create',
      error: true 
    });
    repoLogger.error('Failed to create user', {
      message: error.message,
      code: error.code
    });
    throw error;
  }
};

/**
 * Find user by email
 * @async
 * @param {string} email - User's email
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const findUserByEmail = async (email) => {
  try {
    const snapshot = await db.collection(USERS_COLLECTION)
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      _id: doc.id,
      uid: doc.id,
      ...doc.data()
    };
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'user_repository', 
      operation: 'find_by_email',
      error: true 
    });
    repoLogger.error('Failed to find user by email', {
      message: error.message
    });
    throw error;
  }
};

/**
 * Find user by UID
 * @async
 * @param {string} uid - User's Firebase UID
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const findUserById = async (uid) => {
  try {
    const doc = await db.collection(USERS_COLLECTION).doc(uid).get();

    if (!doc.exists) {
      return null;
    }

    return {
      _id: doc.id,
      uid: doc.id,
      ...doc.data()
    };
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'user_repository', 
      operation: 'find_by_id',
      error: true 
    });
    repoLogger.error('Failed to find user by ID', {
      message: error.message
    });
    throw error;
  }
};

/**
 * Update user profile
 * @async
 * @param {string} uid - User's Firebase UID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated user object
 */
export const updateUser = async (uid, updateData) => {
  try {
    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      throw new Error('User not found');
    }

    // Prepare update data
    const updates = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    // Remove fields that shouldn't be updated directly
    delete updates.uid;
    delete updates._id;
    delete updates.email; // Email changes should go through Firebase Auth
    delete updates.createdAt;

    // Update Firestore document
    await userRef.update(updates);

    // If role is being updated, also update custom claims
    if (updateData.role) {
      await setCustomUserClaims(uid, { role: updateData.role });
    }

    const repoLogger = logger.child({ component: 'user_repository', operation: 'update' });
    repoLogger.info('User updated successfully', { uid });

    // Return updated user
    const updatedDoc = await userRef.get();
    return {
      _id: updatedDoc.id,
      uid: updatedDoc.id,
      ...updatedDoc.data()
    };
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'user_repository', 
      operation: 'update',
      error: true 
    });
    repoLogger.error('Failed to update user', {
      message: error.message
    });
    throw error;
  }
};

/**
 * Delete user from Firebase Auth and Firestore
 * @async
 * @param {string} uid - User's Firebase UID
 * @returns {Promise<void>}
 */
export const deleteUser = async (uid) => {
  try {
    // Delete from Firestore
    await db.collection(USERS_COLLECTION).doc(uid).delete();

    // Delete from Firebase Auth
    await deleteFirebaseUser(uid);

    const repoLogger = logger.child({ component: 'user_repository', operation: 'delete' });
    repoLogger.info('User deleted successfully', { uid });
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'user_repository', 
      operation: 'delete',
      error: true 
    });
    repoLogger.error('Failed to delete user', {
      message: error.message
    });
    throw error;
  }
};

/**
 * List users with optional filters
 * @async
 * @param {Object} options - Query options
 * @param {string} options.role - Filter by role
 * @param {number} options.limit - Maximum number of results
 * @param {string} options.startAfter - Pagination cursor (user ID)
 * @returns {Promise<Object[]>} Array of user objects
 */
export const listUsers = async (options = {}) => {
  try {
    let query = db.collection(USERS_COLLECTION);

    // Apply filters
    if (options.role) {
      query = query.where('role', '==', options.role);
    }

    // Apply ordering
    query = query.orderBy('createdAt', 'desc');

    // Apply pagination
    if (options.startAfter) {
      const startDoc = await db.collection(USERS_COLLECTION).doc(options.startAfter).get();
      if (startDoc.exists) {
        query = query.startAfter(startDoc);
      }
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();

    return snapshot.docs.map(doc => ({
      _id: doc.id,
      uid: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'user_repository', 
      operation: 'list',
      error: true 
    });
    repoLogger.error('Failed to list users', {
      message: error.message
    });
    throw error;
  }
};

/**
 * Check if user exists by email
 * @async
 * @param {string} email - User's email
 * @returns {Promise<boolean>} True if user exists, false otherwise
 */
export const userExistsByEmail = async (email) => {
  try {
    const snapshot = await db.collection(USERS_COLLECTION)
      .where('email', '==', email)
      .limit(1)
      .get();

    return !snapshot.empty;
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'user_repository', 
      operation: 'exists_by_email',
      error: true 
    });
    repoLogger.error('Failed to check user existence', {
      message: error.message
    });
    throw error;
  }
};
