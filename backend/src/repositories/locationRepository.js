/**
 * Firestore Location Repository
 * @fileoverview Data access layer for location operations in Firestore
 * @module repositories/locationRepository
 */

import { getFirebaseFirestore } from '../utils/firebaseAdmin.js';
import logger from '../utils/logger.js';

const db = getFirebaseFirestore();
const LOCATIONS_COLLECTION = 'locations';

/**
 * Create a new location
 * @async
 * @param {Object} locationData - Location data
 * @param {string} locationData.name - Location name
 * @param {string} locationData.description - Location description
 * @param {string} locationData.type - Location type (building, room, poi)
 * @param {Object} locationData.coordinates - Coordinates {lat, lng}
 * @param {string} locationData.buildingId - Parent building ID (optional)
 * @param {*} locationData.floor - Floor number/name (optional)
 * @param {string[]} locationData.tags - Location tags (optional)
 * @param {Object} locationData.meta - Additional metadata (optional)
 * @returns {Promise<Object>} Created location object
 */
export const createLocation = async (locationData) => {
  try {
    const {
      name,
      description = '',
      type,
      coordinates,
      buildingId = null,
      floor = null,
      tags = [],
      meta = {}
    } = locationData;

    // Validate coordinates
    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      throw new Error('Valid coordinates (lat, lng) are required');
    }

    const locationDoc = {
      name,
      description,
      type: type.toLowerCase(),
      coordinates: {
        lat: coordinates.lat,
        lng: coordinates.lng
      },
      buildingId,
      floor,
      tags: tags.map(tag => tag.toLowerCase()),
      meta,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection(LOCATIONS_COLLECTION).add(locationDoc);

    const repoLogger = logger.child({ component: 'location_repository', operation: 'create' });
    repoLogger.info('Location created successfully', {
      id: docRef.id,
      name
    });

    return {
      _id: docRef.id,
      id: docRef.id,
      ...locationDoc
    };
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'location_repository', 
      operation: 'create',
      error: true 
    });
    repoLogger.error('Failed to create location', {
      message: error.message
    });
    throw error;
  }
};

/**
 * Find location by ID
 * @async
 * @param {string} id - Location ID
 * @returns {Promise<Object|null>} Location object or null if not found
 */
export const findLocationById = async (id) => {
  try {
    const doc = await db.collection(LOCATIONS_COLLECTION).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      _id: doc.id,
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'location_repository', 
      operation: 'find_by_id',
      error: true 
    });
    repoLogger.error('Failed to find location by ID', {
      message: error.message
    });
    throw error;
  }
};

/**
 * Update location
 * @async
 * @param {string} id - Location ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated location object
 */
export const updateLocation = async (id, updateData) => {
  try {
    const locationRef = db.collection(LOCATIONS_COLLECTION).doc(id);
    const doc = await locationRef.get();

    if (!doc.exists) {
      throw new Error('Location not found');
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

    // Normalize tags if present
    if (updates.tags) {
      updates.tags = updates.tags.map(tag => tag.toLowerCase());
    }

    // Normalize type if present
    if (updates.type) {
      updates.type = updates.type.toLowerCase();
    }

    await locationRef.update(updates);

    const repoLogger = logger.child({ component: 'location_repository', operation: 'update' });
    repoLogger.info('Location updated successfully', { id });

    // Return updated location
    const updatedDoc = await locationRef.get();
    return {
      _id: updatedDoc.id,
      id: updatedDoc.id,
      ...updatedDoc.data()
    };
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'location_repository', 
      operation: 'update',
      error: true 
    });
    repoLogger.error('Failed to update location', {
      message: error.message
    });
    throw error;
  }
};

/**
 * Delete location
 * @async
 * @param {string} id - Location ID
 * @returns {Promise<void>}
 */
export const deleteLocation = async (id) => {
  try {
    const locationRef = db.collection(LOCATIONS_COLLECTION).doc(id);
    const doc = await locationRef.get();

    if (!doc.exists) {
      throw new Error('Location not found');
    }

    await locationRef.delete();

    const repoLogger = logger.child({ component: 'location_repository', operation: 'delete' });
    repoLogger.info('Location deleted successfully', { id });
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'location_repository', 
      operation: 'delete',
      error: true 
    });
    repoLogger.error('Failed to delete location', {
      message: error.message
    });
    throw error;
  }
};

/**
 * List locations with optional filters
 * @async
 * @param {Object} options - Query options
 * @param {string} options.type - Filter by type
 * @param {string[]} options.tags - Filter by tags
 * @param {string} options.buildingId - Filter by building ID
 * @param {*} options.floor - Filter by floor
 * @param {number} options.limit - Maximum number of results
 * @param {string} options.startAfter - Pagination cursor (location ID)
 * @returns {Promise<Object[]>} Array of location objects
 */
export const listLocations = async (options = {}) => {
  try {
    let query = db.collection(LOCATIONS_COLLECTION);

    // Apply filters
    if (options.type) {
      query = query.where('type', '==', options.type.toLowerCase());
    }

    if (options.buildingId) {
      query = query.where('buildingId', '==', options.buildingId);
    }

    if (options.floor !== undefined && options.floor !== null) {
      query = query.where('floor', '==', options.floor);
    }

    if (options.tags && options.tags.length > 0) {
      // Firestore 'array-contains-any' supports up to 10 values
      const tags = options.tags.slice(0, 10).map(tag => tag.toLowerCase());
      query = query.where('tags', 'array-contains-any', tags);
    }

    // Apply ordering
    query = query.orderBy('name', 'asc');

    // Apply pagination
    if (options.startAfter) {
      const startDoc = await db.collection(LOCATIONS_COLLECTION).doc(options.startAfter).get();
      if (startDoc.exists) {
        query = query.startAfter(startDoc);
      }
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();

    return snapshot.docs.map(doc => ({
      _id: doc.id,
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'location_repository', 
      operation: 'list',
      error: true 
    });
    repoLogger.error('Failed to list locations', {
      message: error.message
    });
    throw error;
  }
};

/**
 * Search locations by text (name, description, tags)
 * Note: Firestore doesn't have native full-text search.
 * This is a basic implementation. For production, consider using Algolia or similar.
 * @async
 * @param {string} searchText - Search query
 * @param {Object} options - Additional options
 * @param {number} options.limit - Maximum number of results
 * @returns {Promise<Object[]>} Array of matching locations
 */
export const searchLocations = async (searchText, options = {}) => {
  try {
    if (!searchText || searchText.trim().length === 0) {
      return listLocations(options);
    }

    const searchTerm = searchText.toLowerCase();
    
    // Get all locations (or filtered subset)
    const locations = await listLocations({ limit: options.limit || 100 });

    // Client-side filtering (not ideal for large datasets)
    const filtered = locations.filter(location => {
      const nameMatch = location.name.toLowerCase().includes(searchTerm);
      const descMatch = location.description?.toLowerCase().includes(searchTerm);
      const tagMatch = location.tags?.some(tag => tag.toLowerCase().includes(searchTerm));
      
      return nameMatch || descMatch || tagMatch;
    });

    return filtered.slice(0, options.limit || 50);
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'location_repository', 
      operation: 'search',
      error: true 
    });
    repoLogger.error('Failed to search locations', {
      message: error.message
    });
    throw error;
  }
};

/**
 * Find locations within bounding box
 * @async
 * @param {Object} bounds - Bounding box {north, south, east, west}
 * @returns {Promise<Object[]>} Array of locations within bounds
 */
export const findWithinBounds = async (bounds) => {
  try {
    const { north, south, east, west } = bounds;

    // Get all locations and filter client-side
    // Note: For production with many locations, consider using geohashing or GeoFirestore
    const allLocations = await listLocations({ limit: 1000 });

    const filtered = allLocations.filter(location => {
      const { lat, lng } = location.coordinates;
      return lat >= south && lat <= north && lng >= west && lng <= east;
    });

    return filtered;
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'location_repository', 
      operation: 'find_within_bounds',
      error: true 
    });
    repoLogger.error('Failed to find locations within bounds', {
      message: error.message
    });
    throw error;
  }
};

/**
 * Find nearby locations (basic distance calculation)
 * @async
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} maxDistance - Maximum distance in meters
 * @returns {Promise<Object[]>} Array of nearby locations
 */
export const findNearby = async (lat, lng, maxDistance = 1000) => {
  try {
    // Simple bounding box calculation (approximation)
    // 1 degree latitude ≈ 111km
    const latDelta = (maxDistance / 111000);
    const lngDelta = (maxDistance / (111000 * Math.cos(lat * Math.PI / 180)));

    const bounds = {
      north: lat + latDelta,
      south: lat - latDelta,
      east: lng + lngDelta,
      west: lng - lngDelta
    };

    const locations = await findWithinBounds(bounds);

    // Calculate actual distances and filter
    const withDistances = locations.map(location => {
      const distance = calculateDistance(
        lat, 
        lng, 
        location.coordinates.lat, 
        location.coordinates.lng
      );
      return { ...location, distance };
    });

    return withDistances
      .filter(loc => loc.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
  } catch (error) {
    const repoLogger = logger.child({ 
      component: 'location_repository', 
      operation: 'find_nearby',
      error: true 
    });
    repoLogger.error('Failed to find nearby locations', {
      message: error.message
    });
    throw error;
  }
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};
