/**
 * RBAC Middleware - Role-Based Access Control
 * Middleware functions for checking permissions and ownership
 */

import Event from '../models/Event.js';
import { ROLES, hasPermission } from '../config/permissions.js';

/**
 * Middleware to check if user owns the event
 * Must be used after authenticate() middleware
 * Attaches event to req.event if user is owner or admin
 */
export const isEventOwner = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    
    // Validate event ID format
    if (!eventId || !eventId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }
    
    // Find the event
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Admins can access any event
    if (req.user.role === ROLES.ADMIN) {
      req.event = event;
      req.isOwner = true;
      return next();
    }
    
    // Check if user is the creator
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify events you created.'
      });
    }
    
    // User is the owner
    req.event = event;
    req.isOwner = true;
    next();
  } catch (error) {
    console.error('Event ownership check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking event ownership'
    });
  }
};

/**
 * Middleware to check if user can view event registrations
 * Either the event creator or an admin
 */
export const canViewRegistrations = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    
    // Find the event
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Admins can view any registrations
    if (req.user.role === ROLES.ADMIN) {
      req.event = event;
      return next();
    }
    
    // Organizers can only view registrations for their own events
    if (req.user.role === ROLES.ORGANIZER && 
        event.createdBy.toString() === req.user._id.toString()) {
      req.event = event;
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view registrations for events you created.'
    });
  } catch (error) {
    console.error('Registration view check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking registration permissions'
    });
  }
};

/**
 * Middleware to check specific permission
 * @param {string} permission - Permission key from PERMISSIONS config
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    
    next();
  };
};

/**
 * Middleware to ensure user is an organizer or admin
 * Used for event creation
 */
export const requireOrganizerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  if (req.user.role !== ROLES.ORGANIZER && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only organizers and admins can perform this action.'
    });
  }
  
  next();
};

/**
 * Middleware to ensure user is an admin
 * Used for administrative actions (user management, location management)
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  if (req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.'
    });
  }
  
  next();
};

/**
 * Middleware to check if user can modify their own profile
 * or if admin can modify any profile
 */
export const canModifyUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  const targetUserId = req.params.id || req.params.userId;
  
  // Admins can modify anyone
  if (req.user.role === ROLES.ADMIN) {
    return next();
  }
  
  // Users can only modify their own profile
  if (targetUserId === req.user._id.toString()) {
    return next();
  }
  
  return res.status(403).json({
    success: false,
    message: 'Access denied. You can only modify your own profile.'
  });
};

export default {
  isEventOwner,
  canViewRegistrations,
  requirePermission,
  requireOrganizerOrAdmin,
  requireAdmin,
  canModifyUser
};
