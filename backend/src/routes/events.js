import express from 'express';
const router = express.Router();
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getRecommendedEvents,
  registerForEvent,
  unregisterFromEvent,
  getUpcomingEvents,
  getMyEvents
} from '../controllers/eventController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { 
  validateEvent, 
  validateEventQuery, 
  validateObjectId 
} from '../middleware/validation.js';
import { isEventOwner, requireOrganizerOrAdmin } from '../middleware/rbac.js';

// Public routes (with optional auth for personalization)
router.get('/', optionalAuth, validateEventQuery, getEvents);
router.get('/upcoming', getUpcomingEvents);

// Authenticated routes (all roles) - MUST come BEFORE /:id dynamic route
router.use(authenticate);
router.get('/recommended', getRecommendedEvents);
router.get('/my-events', getMyEvents); // Get events created by current user

// Dynamic ID route - MUST be after specific routes to avoid matching /my-events
router.get('/:id', validateObjectId, getEvent);
router.post('/:id/register', validateObjectId, registerForEvent);
router.delete('/:id/register', validateObjectId, unregisterFromEvent);

// Organizer and Admin routes - Create events
router.post('/', 
  requireOrganizerOrAdmin,
  validateEvent, 
  createEvent
);

// Owner or Admin routes - Edit/Delete own events
router.put('/:id', 
  validateObjectId, 
  isEventOwner, // Checks ownership or admin
  validateEvent,
  updateEvent
);

router.delete('/:id', 
  validateObjectId,
  isEventOwner, // Checks ownership or admin
  deleteEvent
);

export default router;
