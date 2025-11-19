import {
  findUserById,
  updateUser as updateUserRepo,
  deleteUser as deleteUserRepo,
  listUsers,
  userExistsByEmail
} from '../repositories/userRepository.js';
import { listEvents } from '../repositories/eventRepository.js';
import { getFirebaseAuth } from '../utils/firebaseAdmin.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user }
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, interests } = req.body;
  
  const updateData = {};
  
  if (name) {
    // Validate name length
    if (name.trim().length < 2 || name.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 50 characters'
      });
    }
    updateData.name = name.trim();
  }
  if (interests !== undefined) updateData.interests = interests;
  
  const userId = req.user.uid || req.user._id;
  const user = await updateUserRepo(userId, updateData);
  
  // Update Firebase Auth display name as well
  if (name) {
    try {
      const auth = getFirebaseAuth();
      await auth.updateUser(userId, {
        displayName: name.trim()
      });
    } catch (error) {
      console.warn('Failed to update Firebase Auth display name:', error.message);
    }
  }
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
});

/**
 * @desc    Get user's registered events
 * @route   GET /api/users/events
 * @access  Private
 */
const getUserEvents = asyncHandler(async (req, res) => {
  const userId = req.user.uid || req.user._id;
  
  // Get all events and filter by attendees on client side
  // Note: For better performance with large datasets, consider adding an index
  const allEvents = await listEvents({
    upcomingOnly: true,
    populateLocation: true
  });
  
  // Filter events where user is an attendee
  const events = allEvents.filter(event => 
    event.attendees?.some(a => a.userId === userId)
  );
  
  res.json({
    success: true,
    data: { events }
  });
});

/**
 * @desc    Delete user account
 * @route   DELETE /api/users/profile
 * @access  Private
 */
const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user.uid || req.user._id;
  
  // Note: Events will keep the user reference, but user document will be deleted
  // In production, you might want to update events to remove user from attendees
  // This would require fetching all events and updating them, which is expensive
  
  // Delete user from Firestore and Firebase Auth
  await deleteUserRepo(userId);
  
  res.json({
    success: true,
    message: 'Account deleted successfully'
  });
});

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await listUsers();
  
  res.json({
    success: true,
    data: { users }
  });
});

/**
 * @desc    Get user by ID (Admin only)
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await findUserById(req.params.id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  res.json({
    success: true,
    data: { user }
  });
});

/**
 * @desc    Update user (Admin or self)
 * @route   PUT /api/users/:id
 * @access  Private/Admin or Self
 */
const updateUser = asyncHandler(async (req, res) => {
  const user = await findUserById(req.params.id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Only allow updating certain fields
  const allowedUpdates = ['name', 'email', 'interests'];
  const updates = {};
  
  // Only admins can change user roles (prevent privilege escalation)
  if (req.user.role === 'admin' && req.body.role !== undefined) {
    allowedUpdates.push('role');
  }
  
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });
  
  // If email is being updated, check if it's already taken
  if (updates.email && updates.email !== user.email) {
    const emailExists = await userExistsByEmail(updates.email);
    if (emailExists) {
      res.status(400);
      throw new Error('Email already in use');
    }
    
    // Update email in Firebase Auth as well
    const auth = getFirebaseAuth();
    await auth.updateUser(req.params.id, { email: updates.email });
  }
  
  const updatedUser = await updateUserRepo(req.params.id, updates);
  
  res.json({
    success: true,
    data: { user: updatedUser }
  });
});

/**
 * @desc    Delete user (Admin only)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await findUserById(req.params.id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Prevent deleting yourself
  const currentUserId = req.user.uid || req.user._id;
  if (req.params.id === currentUserId) {
    res.status(400);
    throw new Error('You cannot delete your own account using this endpoint');
  }
  
  await deleteUserRepo(req.params.id);
  
  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

export {
  getProfile,
  updateProfile,
  getUserEvents,
  deleteAccount,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};
