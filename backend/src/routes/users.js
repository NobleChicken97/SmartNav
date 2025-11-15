import express from 'express';
const router = express.Router();
import {
  getProfile,
  updateProfile,
  getUserEvents,
  deleteAccount,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import { authenticateFirebase } from '../middleware/firebaseAuth.js';
import { validateProfileUpdate, validateObjectId } from '../middleware/validation.js';
import { requireAdmin, canModifyUser } from '../middleware/rbac.js';

// All user routes require authentication
router.use(authenticateFirebase);

// User profile routes (self-service)
router.get('/profile', getProfile);
router.put('/profile', validateProfileUpdate, updateProfile);
router.get('/events', getUserEvents);
router.delete('/profile', deleteAccount);

// Admin routes - User management
router.get('/', requireAdmin, getAllUsers); // Get all users
router.get('/:id', requireAdmin, validateObjectId, getUserById); // Get user by ID
router.put('/:id', validateObjectId, canModifyUser, updateUser); // Update user (admin or self)
router.delete('/:id', validateObjectId, requireAdmin, deleteUser); // Delete user (admin only)

export default router;
