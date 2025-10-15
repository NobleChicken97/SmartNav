import User from '../models/User.js';
import { generateToken, generateCSRFToken } from '../utils/jwt.js';
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
 * @description Creates a new user with hashed password and generates authentication tokens
 * @route POST /api/auth/register
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing user data
 * @param {string} req.body.name - User's full name (required)
 * @param {string} req.body.email - User's email address (required, unique)
 * @param {string} req.body.password - User's password (required, min 6 characters)
 * @param {string[]} [req.body.interests] - Array of user interests (optional)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with user data and auth tokens
 * @throws {400} When user already exists or validation fails
 * @throws {500} When database operation fails
 * @example
 * // POST /api/auth/register
 * // Body: { "name": "John Doe", "email": "john@example.com", "password": "password123", "interests": ["sports"] }
 * // Response: { "success": true, "data": { "user": {...}, "csrfToken": "..." } }
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, interests } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  // Create user - Always force 'student' role for security
  // Only admins can promote users to 'organizer' or 'admin' roles
  const user = await User.create({
    name,
    email,
    password,
    interests: interests || [],
    role: 'student' // Force student role - prevent privilege escalation
  });

  // Generate token
  const token = generateToken({ id: user._id });

  // Set cookie
  res.cookie(process.env.COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      csrfToken: generateCSRFToken()
    }
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists and get password
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check password
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Generate token
  const token = generateToken({ id: user._id });

  // Set cookie
  res.cookie(process.env.COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  // Remove password from response
  user.password = undefined;

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      csrfToken: generateCSRFToken()
    }
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // Clear cookie
  res.clearCookie(process.env.COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });

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

export {
  register,
  login,
  logout,
  getMe,
  getCSRFToken
};
