import express from 'express';
const router = express.Router();
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  cancelEvent,
  deleteEvent,
  getRecommendedEvents,
  registerForEvent,
  unregisterFromEvent,
  getUpcomingEvents,
  getMyEvents
} from '../controllers/eventController.js';
import { authenticateFirebase, optionalFirebaseAuth } from '../middleware/firebaseAuth.js';
import { 
  validateEvent, 
  validateEventQuery, 
  validateObjectId 
} from '../middleware/validation.js';
import { isEventOwner, requireOrganizerOrAdmin } from '../middleware/rbac.js';

// Public routes (with optional auth for personalization)
router.get('/', optionalFirebaseAuth, validateEventQuery, getEvents);
router.get('/upcoming', getUpcomingEvents);

// Authenticated routes (all roles) - MUST come BEFORE /:id dynamic route
router.use(authenticateFirebase);
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

// Cancel event route - No validation needed, just updates status
router.patch('/:id/cancel',
  validateObjectId,
  isEventOwner, // Checks ownership or admin
  cancelEvent
);

router.delete('/:id', 
  validateObjectId,
  isEventOwner, // Checks ownership or admin
  deleteEvent
);

export default router;
