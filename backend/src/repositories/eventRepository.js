/**
 * Firestore Event Repository
 * @fileoverview Data access layer for event operations in Firestore
 * @module repositories/eventRepository
 */

import { getFirebaseFirestore } from '../utils/firebaseAdmin.js';
import logger from '../utils/logger.js';

const db = getFirebaseFirestore();
const EVENTS_COLLECTION = 'events';

/**
 * Create a new event
 * @async
 * @param {Object} eventData - Event data
 * @param {string} eventData.title - Event title
 * @param {string} eventData.description - Event description
 * @param {string} eventData.category - Event category
 * @param {string} eventData.locationId - Location ID reference
 * @param {Date|string} eventData.dateTime - Event start date/time
 * @param {Date|string} eventData.endDateTime - Event end date/time
 * @param {number} eventData.capacity - Event capacity
 * @param {string} eventData.organizer - Organizer name
 * @param {string} eventData.createdBy - User ID of creator
 * @param {string[]} eventData.tags - Event tags (optional)
 * @param {string} eventData.status - Event status (draft, published, cancelled)
 * @returns {Promise<Object>} Created event object
 */
export const createEvent = async (eventData) => {
  try {
    const {
      title,
      description,
      category,
      locationId,
      dateTime,
      endDateTime,
      capacity = 50,
      organizer,
      createdBy,
      tags = [],
      status = 'published'
    } = eventData;

    // Convert dates to ISO strings if they're Date objects
    const startDate = dateTime instanceof Date ? dateTime.toISOString() : dateTime;
    const endDate = endDateTime instanceof Date ? endDateTime.toISOString() : endDateTime;

    // Validate dates
    if (new Date(startDate) <= new Date()) {
      throw new Error('Event date must be in the future');
    }

    if (new Date(endDate) <= new Date(startDate)) {
      throw new Error('Event end time must be after start time');
    }

    const eventDoc = {
      title,
      description,
      category: category.toLowerCase(),
      locationId,
      dateTime: startDate,
      endDateTime: endDate,
      capacity,
      organizer,
      createdBy,
      attendees: [],
      tags: tags.map(tag => tag.toLowerCase()),
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection(EVENTS_COLLECTION).add(eventDoc);

    const repoLogger = logger.child({ component: 'event_repository', operation: 'create' });
    repoLogger.info('Event created successfully', {
      id: docRef.id,
      title
    });

    return {
      _id: docRef.id,
      id: docRef.id,
      ...eventDoc
    };
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'event_repository', 
      operation: 'create',
      error: true 
    });
    repoLogger.error('Failed to create event', {
      message: error.message
    });
    throw error;
  }
};

/**
 * Find event by ID with optional population of location data
 * @async
 * @param {string} id - Event ID
 * @param {boolean} populateLocation - Whether to populate location data
 * @returns {Promise<Object|null>} Event object or null if not found
 */
export const findEventById = async (id, populateLocation = false) => {
  try {
    const doc = await db.collection(EVENTS_COLLECTION).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const event = {
      _id: doc.id,
      id: doc.id,
      ...doc.data()
    };

    // Populate location if requested
    if (populateLocation && event.locationId) {
      const locationDoc = await db.collection('locations').doc(event.locationId).get();
      if (locationDoc.exists) {
        event.location = {
          _id: locationDoc.id,
          id: locationDoc.id,
          ...locationDoc.data()
        };
      }
    }

    return event;
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'event_repository', 
      operation: 'find_by_id',
      error: true 
    });
    repoLogger.error('Failed to find event by ID', {
      message: error.message
    });
    throw error;
  }
};

/**
 * Update event
 * @async
 * @param {string} id - Event ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated event object
 */
export const updateEvent = async (id, updateData) => {
  try {
    const eventRef = db.collection(EVENTS_COLLECTION).doc(id);
    const doc = await eventRef.get();

    if (!doc.exists) {
      throw new Error('Event not found');
    }

    // Prepare update data
    const updates = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.id;
    delete updates.createdAt;
    delete updates.createdBy;
    delete updates.attendees; // Use separate methods for attendee management

    // Normalize tags if present
    if (updates.tags) {
      updates.tags = updates.tags.map(tag => tag.toLowerCase());
    }

    // Normalize category if present
    if (updates.category) {
      updates.category = updates.category.toLowerCase();
    }

    // Convert dates if present
    if (updates.dateTime instanceof Date) {
      updates.dateTime = updates.dateTime.toISOString();
    }
    if (updates.endDateTime instanceof Date) {
      updates.endDateTime = updates.endDateTime.toISOString();
    }

    await eventRef.update(updates);

    const repoLogger = logger.child({ component: 'event_repository', operation: 'update' });
    repoLogger.info('Event updated successfully', { id });

    // Return updated event
    const updatedDoc = await eventRef.get();
    return {
      _id: updatedDoc.id,
      id: updatedDoc.id,
      ...updatedDoc.data()
    };
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'event_repository', 
      operation: 'update',
      error: true 
    });
    repoLogger.error('Failed to update event', {
      message: error.message
    });
    throw error;
  }
};

/**
 * Delete event
 * @async
 * @param {string} id - Event ID
 * @returns {Promise<void>}
 */
export const deleteEvent = async (id) => {
  try {
    const eventRef = db.collection(EVENTS_COLLECTION).doc(id);
    const doc = await eventRef.get();

    if (!doc.exists) {
      throw new Error('Event not found');
    }

    await eventRef.delete();

    const repoLogger = logger.child({ component: 'event_repository', operation: 'delete' });
    repoLogger.info('Event deleted successfully', { id });
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'event_repository', 
      operation: 'delete',
      error: true 
    });
    repoLogger.error('Failed to delete event', {
      message: error.message
    });
    throw error;
  }
};

/**
 * Register user for event
 * @async
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated event object
 */
export const registerUserForEvent = async (eventId, userId) => {
  try {
    const eventRef = db.collection(EVENTS_COLLECTION).doc(eventId);
    const doc = await eventRef.get();

    if (!doc.exists) {
      throw new Error('Event not found');
    }

    const event = doc.data();

    // Check if user is already registered
    const isRegistered = event.attendees.some(a => a.userId === userId);
    if (isRegistered) {
      throw new Error('User is already registered for this event');
    }

    // Check capacity
    if (event.attendees.length >= event.capacity) {
      throw new Error('Event is full');
    }

    // Add user to attendees
    const updatedAttendees = [
      ...event.attendees,
      {
        userId,
        registeredAt: new Date().toISOString()
      }
    ];

    await eventRef.update({
      attendees: updatedAttendees,
      updatedAt: new Date().toISOString()
    });

    const repoLogger = logger.child({ component: 'event_repository', operation: 'register_user' });
    repoLogger.info('User registered for event', { eventId, userId });

    // Return updated event
    const updatedDoc = await eventRef.get();
    return {
      _id: updatedDoc.id,
      id: updatedDoc.id,
      ...updatedDoc.data()
    };
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'event_repository', 
      operation: 'register_user',
      error: true 
    });
    repoLogger.error('Failed to register user for event', {
      message: error.message
    });
    throw error;
  }
};

/**
 * Unregister user from event
 * @async
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated event object
 */
export const unregisterUserFromEvent = async (eventId, userId) => {
  try {
    const eventRef = db.collection(EVENTS_COLLECTION).doc(eventId);
    const doc = await eventRef.get();

    if (!doc.exists) {
      throw new Error('Event not found');
    }

    const event = doc.data();

    // Remove user from attendees
    const updatedAttendees = event.attendees.filter(a => a.userId !== userId);

    await eventRef.update({
      attendees: updatedAttendees,
      updatedAt: new Date().toISOString()
    });

    const repoLogger = logger.child({ component: 'event_repository', operation: 'unregister_user' });
    repoLogger.info('User unregistered from event', { eventId, userId });

    // Return updated event
    const updatedDoc = await eventRef.get();
    return {
      _id: updatedDoc.id,
      id: updatedDoc.id,
      ...updatedDoc.data()
    };
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'event_repository', 
      operation: 'unregister_user',
      error: true 
    });
    repoLogger.error('Failed to unregister user from event', {
      message: error.message
    });
    throw error;
  }
};

/**
 * List events with optional filters
 * @async
 * @param {Object} options - Query options
 * @param {string} options.category - Filter by category
 * @param {string} options.locationId - Filter by location
 * @param {string} options.createdBy - Filter by creator
 * @param {boolean} options.upcomingOnly - Show only future events
 * @param {number} options.limit - Maximum number of results
 * @param {boolean} options.populateLocation - Whether to populate location data
 * @returns {Promise<Object[]>} Array of event objects
 */
export const listEvents = async (options = {}) => {
  try {
    let query = db.collection(EVENTS_COLLECTION);

    // Apply filters
    if (options.category) {
      query = query.where('category', '==', options.category.toLowerCase());
    }

    if (options.locationId) {
      query = query.where('locationId', '==', options.locationId);
    }

    if (options.createdBy) {
      query = query.where('createdBy', '==', options.createdBy);
    }

    if (options.upcomingOnly) {
      query = query.where('dateTime', '>=', new Date().toISOString());
    }

    // Apply ordering
    query = query.orderBy('dateTime', options.upcomingOnly ? 'asc' : 'desc');

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();

    const events = snapshot.docs.map(doc => ({
      _id: doc.id,
      id: doc.id,
      ...doc.data()
    }));

    // Populate location if requested
    if (options.populateLocation) {
      const locationIds = [...new Set(events.map(e => e.locationId))];
      const locationDocs = await Promise.all(
        locationIds.map(id => db.collection('locations').doc(id).get())
      );

      const locationMap = {};
      locationDocs.forEach(doc => {
        if (doc.exists) {
          locationMap[doc.id] = {
            _id: doc.id,
            id: doc.id,
            ...doc.data()
          };
        }
      });

      events.forEach(event => {
        if (event.locationId && locationMap[event.locationId]) {
          event.location = locationMap[event.locationId];
        }
      });
    }

    return events;
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'event_repository', 
      operation: 'list',
      error: true 
    });
    repoLogger.error('Failed to list events', {
      message: error.message
    });
    throw error;
  }
};

/**
 * Get recommended events based on user interests
 * @async
 * @param {string[]} userInterests - User's interests/tags
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Object[]>} Array of recommended events
 */
export const getRecommendedEvents = async (userInterests = [], limit = 5) => {
  try {
    let query = db.collection(EVENTS_COLLECTION)
      .where('dateTime', '>=', new Date().toISOString())
      .orderBy('dateTime', 'asc');

    if (userInterests.length > 0) {
      // Firestore 'array-contains-any' supports up to 10 values
      const interests = userInterests.slice(0, 10).map(tag => tag.toLowerCase());
      query = query.where('tags', 'array-contains-any', interests);
    }

    query = query.limit(limit);

    const snapshot = await query.get();

    return snapshot.docs.map(doc => ({
      _id: doc.id,
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'event_repository', 
      operation: 'get_recommendations',
      error: true 
    });
    repoLogger.error('Failed to get recommended events', {
      message: error.message
    });
    throw error;
  }
};

/**
 * Find events by date range
 * @async
 * @param {Date|string} startDate - Start of date range
 * @param {Date|string} endDate - End of date range
 * @param {boolean} populateLocation - Whether to populate location data
 * @returns {Promise<Object[]>} Array of events in date range
 */
export const findEventsByDateRange = async (startDate, endDate, populateLocation = false) => {
  try {
    const start = startDate instanceof Date ? startDate.toISOString() : startDate;
    const end = endDate instanceof Date ? endDate.toISOString() : endDate;

    const query = db.collection(EVENTS_COLLECTION)
      .where('dateTime', '>=', start)
      .where('dateTime', '<=', end)
      .orderBy('dateTime', 'asc');

    const snapshot = await query.get();

    const events = snapshot.docs.map(doc => ({
      _id: doc.id,
      id: doc.id,
      ...doc.data()
    }));

    // Populate location if requested
    if (populateLocation) {
      const locationIds = [...new Set(events.map(e => e.locationId))];
      const locationDocs = await Promise.all(
        locationIds.map(id => db.collection('locations').doc(id).get())
      );

      const locationMap = {};
      locationDocs.forEach(doc => {
        if (doc.exists) {
          locationMap[doc.id] = {
            _id: doc.id,
            id: doc.id,
            ...doc.data()
          };
        }
      });

      events.forEach(event => {
        if (event.locationId && locationMap[event.locationId]) {
          event.location = locationMap[event.locationId];
        }
      });
    }

    return events;
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'event_repository', 
      operation: 'find_by_date_range',
      error: true 
    });
    repoLogger.error('Failed to find events by date range', {
      message: error.message
    });
    throw error;
  }
};
