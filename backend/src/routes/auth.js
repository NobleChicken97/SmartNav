/**
 * @fileoverview Authentication routes for Smart Navigator API
 * Provides endpoints for user registration, login, logout, and profile management
 * @version 2.0.0
 * @author Smart Navigator Team
 * @requires express
 * @requires ../controllers/authController
 * @requires ../middleware/auth
 * @requires ../middleware/validation
 */

import express from 'express';
const router = express.Router();
import {
  register,
  logout,
  getMe,
  getCSRFToken,
  googleAuth
} from '../controllers/authController.js';
import { authenticateFirebase } from '../middleware/firebaseAuth.js';
import { validateRegister } from '../middleware/validation.js';

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: User's unique identifier
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         role:
 *           type: string
 *           enum: [student, organizer, admin]
 *           description: User's role in the system
 *         isEmailVerified:
 *           type: boolean
 *           description: Whether user's email is verified
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: User creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: User last update timestamp
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: Valid email address
 *         password:
 *           type: string
 *           minLength: 8
 *           description: Strong password (min 8 chars, uppercase, lowercase, number, special char)
 *         role:
 *           type: string
 *           enum: [student, organizer, admin]
 *           default: student
 *           description: User role (student, organizer, or admin)
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           description: User's password
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Response success status
 *         message:
 *           type: string
 *           description: Response message
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             token:
 *               type: string
 *               description: JWT authentication token
 */

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization endpoints
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             student:
 *               summary: Register as student
 *               value:
 *                 name: "Rajesh Kumar"
 *                 email: "rajesh.kumar@thapar.edu"
 *                 password: "SecurePass123!"
 *                 role: "student"
 *             organizer:
 *               summary: Register as organizer
 *               value:
 *                 name: "Priya Sharma"
 *                 email: "priya.sharma@thapar.edu"
 *                 password: "OrganizerPass456!"
 *                 role: "organizer"
 *             admin:
 *               summary: Register as admin
 *               value:
 *                 name: "Dr. Admin Singh"
 *                 email: "admin.singh@thapar.edu"
 *                 password: "AdminSecure789!"
 *                 role: "admin"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid request data or user already exists
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
// Public routes
router.post('/register', validateRegister, register);

// Private routes - require authentication
router.use(authenticateFirebase);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user and clear authentication token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logged out successfully"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post('/logout', authenticateFirebase, logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user's profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User profile retrieved"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/me', authenticateFirebase, getMe);

/**
 * @swagger
 * /api/auth/csrf-token:
 *   get:
 *     summary: Get CSRF token for form submissions
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSRF token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     csrfToken:
 *                       type: string
 *                       description: CSRF protection token
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/csrf-token', authenticateFirebase, getCSRFToken);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Google OAuth Sign-In
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token from client-side Google Sign-In
 *     responses:
 *       200:
 *         description: Google authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     csrfToken:
 *                       type: string
 *       400:
 *         description: Bad request - missing or invalid ID token
 *       401:
 *         description: Unauthorized - invalid Google token
 *       500:
 *         description: Internal server error
 */
router.post('/google', googleAuth);

export default router;
