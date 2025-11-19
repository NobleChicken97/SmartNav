import { getFirebaseAuth } from '../utils/firebaseAdmin.js';
import { 
  createUser, 
  findUserByEmail, 
  findUserById 
} from '../repositories/userRepository.js';
import { generateCSRFToken } from '../utils/csrf.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Authentication Controller
 * @fileoverview Handles user authentication operations including registration, login, and logout
 * @module controllers/authController
 */

/**
 * Registers a new user account in the system
 * @async
 * @function register
 * @description Creates a new user in Firebase Auth and Firestore with student role
 * @route POST /api/auth/register
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing user data
 * @param {string} req.body.name - User's full name (required)
 * @param {string} req.body.email - User's email address (required, unique)
 * @param {string} req.body.password - User's password (required, min 6 characters)
 * @param {string[]} [req.body.interests] - Array of user interests (optional)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with user data and ID token
 * @throws {400} When user already exists or validation fails
 * @throws {500} When Firebase operation fails
 * @example
 * // POST /api/auth/register
 * // Body: { "name": "John Doe", "email": "john@example.com", "password": "password123", "interests": ["sports"] }
 * // Response: { "success": true, "data": { "user": {...}, "idToken": "...", "csrfToken": "..." } }
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, interests } = req.body;

  // SECURITY: Strip any role field from request - prevent privilege escalation
  // Only backend scripts can create organizer/admin accounts
  if (req.body.role && req.body.role !== 'student') {
    console.warn(`⚠️ Registration attempt with role: ${req.body.role} for email: ${email}`);
  }
  delete req.body.role; // Remove any role field

  // Check if user already exists in Firestore
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  // Create user in Firebase Auth + Firestore
  // Always force 'student' role for security
  // Only admins can promote users to 'organizer' or 'admin' roles
  const user = await createUser({
    name,
    email,
    password,
    interests: interests || [],
    role: 'student' // Force student role - prevent privilege escalation
  });

  // Generate custom token for the user to sign in
  const auth = getFirebaseAuth();
  const customToken = await auth.createCustomToken(user.uid);

  // Client will use this token to get an ID token
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      customToken, // Client exchanges this for ID token
      csrfToken: generateCSRFToken()
    }
  });
});

/**
 * @desc    Logout user (revoke refresh tokens)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // Revoke all refresh tokens for the user
  const auth = getFirebaseAuth();
  
  if (req.user && req.user.uid) {
    try {
      await auth.revokeRefreshTokens(req.user.uid);
    } catch (error) {
      // Log error but don't fail the logout
      console.error('Failed to revoke refresh tokens:', error);
    }
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user is populated by firebaseAuth middleware
  res.json({
    success: true,
    data: {
      user: req.user,
      csrfToken: generateCSRFToken()
    }
  });
});

/**
 * @desc    Refresh CSRF token
 * @route   GET /api/auth/csrf-token
 * @access  Private
 */
const getCSRFToken = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      csrfToken: generateCSRFToken()
    }
  });
});

/**
 * @desc    Google OAuth callback - verify Google ID token and create/login user
 * @route   POST /api/auth/google
 * @access  Public
 * @param   {string} req.body.idToken - Google ID token from client
 */
const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({
      success: false,
      message: 'Google ID token is required'
    });
  }

  const auth = getFirebaseAuth();

  // Verify the Google ID token with Firebase
  const decodedToken = await auth.verifyIdToken(idToken);
  
  const { uid, email, name, picture } = decodedToken;

  // Check if user exists in Firestore
  let user = await findUserById(uid);

  if (!user) {
    // Create new user in Firestore (Firebase Auth user already exists)
    user = await createUser({
      uid, // Use the Firebase Auth UID
      name: name || email.split('@')[0],
      email,
      role: 'student', // Default role for Google sign-ups
      interests: [],
      photoURL: picture || null
    });
  }

  res.json({
    success: true,
    message: 'Google authentication successful',
    data: {
      user,
      csrfToken: generateCSRFToken()
    }
  });
});

export {
  register,
  logout,
  getMe,
  getCSRFToken,
  googleAuth
};
