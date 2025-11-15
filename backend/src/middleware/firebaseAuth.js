/**
 * Firebase Authentication Middleware
 * @fileoverview Middleware for verifying Firebase ID tokens and populating req.user
 * @module middleware/firebaseAuth
 */

import { verifyIdToken } from '../utils/firebaseAdmin.js';
import { getFirebaseFirestore } from '../utils/firebaseAdmin.js';
import logger from '../utils/logger.js';

/**
 * Extracts Firebase ID token from request
 * Checks Authorization header (Bearer token) and cookies
 * @param {Object} req - Express request object
 * @returns {string|null} ID token if found, null otherwise
 */
const extractIdToken = (req) => {
  // Check Authorization header first (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check for token in cookies (for session-based auth)
  const cookieName = process.env.FIREBASE_COOKIE_NAME || 'firebase_token';
  if (req.cookies && req.cookies[cookieName]) {
    return req.cookies[cookieName];
  }

  return null;
};

/**
 * Firebase Authentication Middleware
 * Verifies Firebase ID token and populates req.user with user data
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authenticateFirebase = async (req, res, next) => {
  try {
    const idToken = extractIdToken(req);

    if (!idToken) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify Firebase ID token
    const decodedToken = await verifyIdToken(idToken);

    // Get additional user data from Firestore
    const db = getFirebaseFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      // User exists in Firebase Auth but not in Firestore
      // This might happen during migration or if user doc wasn't created
      const authLogger = logger.child({ 
        component: 'firebase_auth', 
        operation: 'authenticate',
        warning: 'user_doc_not_found'
      });
      authLogger.warn('User authenticated but Firestore document not found', {
        uid: decodedToken.uid,
        email: decodedToken.email
      });

      // Create minimal user object from token
      req.user = {
        uid: decodedToken.uid,
        _id: decodedToken.uid, // Alias for consistency with existing code
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email.split('@')[0],
        role: decodedToken.role || 'user', // From custom claims
        emailVerified: decodedToken.email_verified
      };
    } else {
      // Merge Firestore data with auth token data
      const userData = userDoc.data();
      req.user = {
        uid: decodedToken.uid,
        _id: decodedToken.uid, // For backward compatibility
        email: decodedToken.email,
        name: userData.name || decodedToken.name || decodedToken.email.split('@')[0],
        role: userData.role || decodedToken.role || 'user',
        interests: userData.interests || [],
        emailVerified: decodedToken.email_verified,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      };
    }

    next();
  } catch (error) {
    const authLogger = logger.child({ 
      component: 'firebase_auth', 
      operation: 'authenticate',
      error: true 
    });

    if (error.code === 'auth/id-token-expired') {
      authLogger.warn('Token expired', { message: error.message });
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    if (error.code === 'auth/id-token-revoked') {
      authLogger.warn('Token revoked', { message: error.message });
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked.'
      });
    }

    if (error.code === 'auth/argument-error' || error.message.includes('ID token')) {
      authLogger.warn('Invalid token', { message: error.message });
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    authLogger.error('Authentication error', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

/**
 * Optional Firebase Authentication Middleware
 * Attempts to verify token but doesn't fail if no token is present
 * Useful for endpoints that work for both authenticated and unauthenticated users
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const optionalFirebaseAuth = async (req, res, next) => {
  try {
    const idToken = extractIdToken(req);

    if (!idToken) {
      // No token present, continue without authentication
      return next();
    }

    // Verify token
    const decodedToken = await verifyIdToken(idToken);

    // Get user data from Firestore
    const db = getFirebaseFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      req.user = {
        uid: decodedToken.uid,
        _id: decodedToken.uid,
        email: decodedToken.email,
        name: userData.name || decodedToken.name,
        role: userData.role || decodedToken.role || 'user',
        interests: userData.interests || [],
        emailVerified: decodedToken.email_verified
      };
    } else {
      req.user = {
        uid: decodedToken.uid,
        _id: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email.split('@')[0],
        role: decodedToken.role || 'user',
        emailVerified: decodedToken.email_verified
      };
    }

    next();
  } catch (error) {
    // On error, continue without authentication (optional auth)
    const authLogger = logger.child({ 
      component: 'firebase_auth', 
      operation: 'optional_auth',
      warning: true
    });
    authLogger.warn('Optional auth failed, continuing without user', {
      message: error.message
    });
    next();
  }
};

/**
 * Authorization middleware for Firebase users
 * Checks if authenticated user has one of the required roles
 * Must be used after authenticateFirebase middleware
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'organizer', 'user')
 * @returns {Function} Express middleware function
 */
export const authorizeFirebase = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      const authLogger = logger.child({ 
        component: 'firebase_auth', 
        operation: 'authorize',
        warning: true
      });
      authLogger.warn('Insufficient permissions', {
        uid: req.user.uid,
        userRole: req.user.role,
        requiredRoles: roles
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

export default authenticateFirebase;
