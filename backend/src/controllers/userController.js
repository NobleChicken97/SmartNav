import User from '../models/User.js';
import Event from '../models/Event.js';
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
  
  if (name) updateData.name = name;
  if (interests !== undefined) updateData.interests = interests;
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  );
  
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
  const events = await Event.find({
    'attendees.userId': req.user._id,
    dateTime: { $gte: new Date() }
  })
  .populate('locationId', 'name coordinates type')
  .sort({ dateTime: 1 });
  
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
  // Remove user from all event attendees
  await Event.updateMany(
    { 'attendees.userId': req.user._id },
    { $pull: { attendees: { userId: req.user._id } } }
  );
  
  // Delete user account
  await User.findByIdAndDelete(req.user._id);
  
  // Clear cookie
  res.clearCookie(process.env.COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  
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
  const users = await User.find()
    .select('-password')
    .sort({ createdAt: -1 });
  
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
  const user = await User.findById(req.params.id).select('-password');
  
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
  const user = await User.findById(req.params.id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Only allow updating certain fields
  const allowedUpdates = ['name', 'email', 'role'];
  const updates = {};
  
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });
  
  // If email is being updated, check if it's already taken
  if (updates.email && updates.email !== user.email) {
    const emailExists = await User.findOne({ email: updates.email });
    if (emailExists) {
      res.status(400);
      throw new Error('Email already in use');
    }
  }
  
  Object.assign(user, updates);
  const updatedUser = await user.save();
  
  res.json({
    success: true,
    data: {
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    }
  });
});

/**
 * @desc    Delete user (Admin only)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Prevent deleting yourself
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot delete your own account using this endpoint');
  }
  
  await user.deleteOne();
  
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
