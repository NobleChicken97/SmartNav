import {
  createEvent as createEventRepo,
  findEventById,
  updateEvent as updateEventRepo,
  deleteEvent as deleteEventRepo,
  registerUserForEvent,
  unregisterUserFromEvent,
  listEvents,
  getRecommendedEvents as getRecommendedEventsRepo,
  findEventsByDateRange
} from '../repositories/eventRepository.js';
import { findLocationById } from '../repositories/locationRepository.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @desc    Get all events
 * @route   GET /api/events
 * @access  Public
 */
const getEvents = asyncHandler(async (req, res) => {
  const { 
    category, 
    startDate, 
    endDate, 
    locationId, 
    limit = 20,
    upcoming = false 
  } = req.query;
  
  let events;
  
  // Date range or upcoming filter
  if (startDate || endDate || upcoming) {
    const start = upcoming ? new Date() : (startDate ? new Date(startDate) : null);
    const end = endDate ? new Date(endDate) : null;
    
    if (start || end) {
      events = await findEventsByDateRange(
        start || new Date(0),
        end || new Date('2099-12-31'),
        true // populate location
      );
      
      // Apply additional filters
      if (category) {
        events = events.filter(e => e.category === category.toLowerCase());
      }
      if (locationId) {
        events = events.filter(e => e.locationId === locationId);
      }
    } else {
      events = await listEvents({
        category: category ? category.toLowerCase() : undefined,
        locationId,
        upcomingOnly: upcoming === 'true',
        limit: parseInt(limit),
        populateLocation: true
      });
    }
  } else {
    // List with filters
    events = await listEvents({
      category: category ? category.toLowerCase() : undefined,
      locationId,
      limit: parseInt(limit),
      populateLocation: true
    });
  }
  
  res.json({
    success: true,
    data: {
      events,
      pagination: {
        total: events.length
      }
    }
  });
});

/**
 * @desc    Get single event
 * @route   GET /api/events/:id
 * @access  Public
 */
const getEvent = asyncHandler(async (req, res) => {
  const event = await findEventById(req.params.id, true); // populate location
  
  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }
  
  res.json({
    success: true,
    data: { event }
  });
});

/**
 * @desc    Create event
 * @route   POST /api/events
 * @access  Private (Organizer or Admin)
 */
const createEvent = asyncHandler(async (req, res) => {
  // Verify location exists
  const location = await findLocationById(req.body.locationId);
  if (!location) {
    return res.status(400).json({
      success: false,
      message: 'Invalid location ID'
    });
  }
  
  // Create event with createdBy field
  const eventData = {
    ...req.body,
    createdBy: req.user.uid || req.user._id, // Firebase UID
    organizer: req.body.organizer || req.user.name
  };
  
  const event = await createEventRepo(eventData);
  
  res.status(201).json({
    success: true,
    message: 'Event created successfully',
    data: { event }
  });
});

/**
 * @desc    Update event
 * @route   PUT /api/events/:id
 * @access  Private (Event Owner or Admin)
 */
const updateEvent = asyncHandler(async (req, res) => {
  // If updating location, verify it exists
  if (req.body.locationId) {
    const location = await findLocationById(req.body.locationId);
    if (!location) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID'
      });
    }
  }
  
  try {
    const event = await updateEventRepo(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'Event updated successfully',
      data: { event }
    });
  } catch (error) {
    if (error.message === 'Event not found') {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    throw error;
  }
});

/**
 * @desc    Cancel event
 * @route   PATCH /api/events/:id/cancel
 * @access  Private (Event Owner or Admin)
 */
const cancelEvent = asyncHandler(async (req, res) => {
  try {
    const event = await updateEventRepo(req.params.id, { status: 'cancelled' });
    
    res.json({
      success: true,
      message: 'Event cancelled successfully',
      data: { event }
    });
  } catch (error) {
    if (error.message === 'Event not found') {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    throw error;
  }
});

/**
 * @desc    Delete event
 * @route   DELETE /api/events/:id
 * @access  Private (Event Owner or Admin)
 */
const deleteEvent = asyncHandler(async (req, res) => {
  try {
    await deleteEventRepo(req.params.id);
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Event not found') {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    throw error;
  }
});

/**
 * @desc    Get recommended events for user
 * @route   GET /api/events/recommended
 * @access  Private
 */
const getRecommendedEvents = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;
  
  const userInterests = req.user?.interests || [];
  
  const events = await getRecommendedEventsRepo(userInterests, parseInt(limit));
  
  res.json({
    success: true,
    data: {
      events,
      basedOn: userInterests.length > 0 ? 'your interests' : 'general recommendations'
    }
  });
});

/**
 * @desc    Register for event
 * @route   POST /api/events/:id/register
 * @access  Private
 */
const registerForEvent = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.uid || req.user._id; // Firebase UID
    const event = await registerUserForEvent(req.params.id, userId);
    
    // Calculate available spots
    const availableSpots = event.capacity - (event.attendees?.length || 0);
    
    res.json({
      success: true,
      message: 'Successfully registered for event',
      data: { 
        event,
        availableSpots
      }
    });
  } catch (error) {
    if (error.message === 'Event not found') {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @desc    Unregister from event
 * @route   DELETE /api/events/:id/register
 * @access  Private
 */
const unregisterFromEvent = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.uid || req.user._id; // Firebase UID
    const event = await unregisterUserFromEvent(req.params.id, userId);
    
    // Calculate available spots
    const availableSpots = event.capacity - (event.attendees?.length || 0);
    
    res.json({
      success: true,
      message: 'Successfully unregistered from event',
      data: { 
        event,
        availableSpots
      }
    });
  } catch (error) {
    if (error.message === 'Event not found') {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    throw error;
  }
});

/**
 * @desc    Get upcoming events
 * @route   GET /api/events/upcoming
 * @access  Public
 */
const getUpcomingEvents = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const events = await listEvents({
    upcomingOnly: true,
    limit: parseInt(limit),
    populateLocation: true
  });
  
  res.json({
    success: true,
    data: { events }
  });
});

/**
 * @desc    Get events created by the current user (organizer's events)
 * @route   GET /api/events/my-events
 * @access  Private (Authenticated users)
 */
const getMyEvents = asyncHandler(async (req, res) => {
  const userId = req.user.uid || req.user._id; // Firebase UID
  
  const events = await listEvents({
    createdBy: userId,
    populateLocation: true
  });
  
  res.json({
    success: true,
    data: { events }
  });
});

export {
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
};
