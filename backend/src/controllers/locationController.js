import {
  createLocation as createLocationRepo,
  findLocationById,
  updateLocation as updateLocationRepo,
  deleteLocation as deleteLocationRepo,
  listLocations,
  searchLocations,
  findWithinBounds,
  findNearby
} from '../repositories/locationRepository.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import csv from 'csv-parser';
import fs from 'fs';

/**
 * @desc    Get all locations
 * @route   GET /api/locations
 * @access  Public
 */
const getLocations = asyncHandler(async (req, res) => {
  const { q, type, north, south, east, west, limit = 100 } = req.query;
  
  let locations;
  
  // Bounding box filter takes priority
  if (north && south && east && west) {
    const bounds = {
      north: parseFloat(north),
      south: parseFloat(south),
      east: parseFloat(east),
      west: parseFloat(west)
    };
    locations = await findWithinBounds(bounds);
    
    // Apply type filter if specified
    if (type) {
      locations = locations.filter(loc => loc.type === type.toLowerCase());
    }
  }
  // Text search
  else if (q) {
    locations = await searchLocations(q, { 
      limit: parseInt(limit),
      type: type ? type.toLowerCase() : undefined
    });
  }
  // List with filters
  else {
    locations = await listLocations({ 
      type: type ? type.toLowerCase() : undefined,
      limit: parseInt(limit)
    });
  }
  
  res.json({
    success: true,
    data: {
      locations,
      pagination: {
        total: locations.length
      }
    }
  });
});

/**
 * @desc    Get single location
 * @route   GET /api/locations/:id
 * @access  Public
 */
const getLocation = asyncHandler(async (req, res) => {
  const location = await findLocationById(req.params.id);
  
  if (!location) {
    return res.status(404).json({
      success: false,
      message: 'Location not found'
    });
  }
  
  res.json({
    success: true,
    data: { location }
  });
});

/**
 * @desc    Create location
 * @route   POST /api/locations
 * @access  Private (Admin only)
 */
const createLocation = asyncHandler(async (req, res) => {
  const location = await createLocationRepo(req.body);
  
  res.status(201).json({
    success: true,
    message: 'Location created successfully',
    data: { location }
  });
});

/**
 * @desc    Update location
 * @route   PUT /api/locations/:id
 * @access  Private (Admin only)
 */
const updateLocation = asyncHandler(async (req, res) => {
  try {
    const location = await updateLocationRepo(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'Location updated successfully',
      data: { location }
    });
  } catch (error) {
    if (error.message === 'Location not found') {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    throw error;
  }
});

/**
 * @desc    Delete location
 * @route   DELETE /api/locations/:id
 * @access  Private (Admin only)
 */
const deleteLocation = asyncHandler(async (req, res) => {
  try {
    await deleteLocationRepo(req.params.id);
    
    res.json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Location not found') {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    throw error;
  }
});

/**
 * @desc    Get nearby locations
 * @route   GET /api/locations/nearby
 * @access  Public
 */
const getNearbyLocations = asyncHandler(async (req, res) => {
  const { lat, lng, maxDistance = 1000 } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude are required'
    });
  }
  
  const locations = await findNearby(
    parseFloat(lat),
    parseFloat(lng),
    parseInt(maxDistance)
  );
  
  res.json({
    success: true,
    data: { locations }
  });
});

/**
 * @desc    Import locations from CSV
 * @route   POST /api/locations/import
 * @access  Private (Admin only)
 */
const importLocations = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'CSV file is required'
    });
  }
  
  const locations = [];
  const errors = [];
  
  return new Promise(() => {
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row, index) => {
        try {
          // Validate required fields
          if (!row.name || !row.type || !row.lat || !row.lng) {
            errors.push(`Row ${index + 1}: Missing required fields (name, type, lat, lng)`);
            return;
          }
          
          // Parse coordinates
          const lat = parseFloat(row.lat);
          const lng = parseFloat(row.lng);
          
          if (isNaN(lat) || isNaN(lng)) {
            errors.push(`Row ${index + 1}: Invalid coordinates`);
            return;
          }
          
          // Validate type
          if (!['building', 'room', 'poi'].includes(row.type.toLowerCase())) {
            errors.push(`Row ${index + 1}: Invalid type (must be building, room, or poi)`);
            return;
          }
          
          // Parse tags
          const tags = row.tags ? row.tags.split(',').map(tag => tag.trim().toLowerCase()) : [];
          
          locations.push({
            name: row.name.trim(),
            description: row.description ? row.description.trim() : '',
            type: row.type.toLowerCase(),
            coordinates: { lat, lng },
            floor: row.floor || null,
            tags
          });
        } catch (error) {
          errors.push(`Row ${index + 1}: ${error.message}`);
        }
      })
      .on('end', async () => {
        try {
          // Clean up uploaded file
          fs.unlinkSync(req.file.path);
          
          if (errors.length > 0) {
            return res.status(400).json({
              success: false,
              message: 'CSV validation failed',
              errors
            });
          }
          
          if (locations.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'No valid locations found in CSV'
            });
          }
          
          // Insert locations one by one (Firestore doesn't have insertMany)
          const insertedLocations = [];
          for (const locationData of locations) {
            try {
              const inserted = await createLocationRepo(locationData);
              insertedLocations.push(inserted);
            } catch (err) {
              errors.push(`Failed to insert location '${locationData.name}': ${err.message}`);
            }
          }
          
          res.status(201).json({
            success: true,
            message: `Successfully imported ${insertedLocations.length} locations`,
            data: {
              imported: insertedLocations.length,
              locations: insertedLocations,
              errors: errors.length > 0 ? errors : undefined
            }
          });
        } catch (error) {
          console.error('Import error:', error);
          res.status(500).json({
            success: false,
            message: 'Error importing locations',
            error: error.message
          });
        }
      })
      .on('error', (error) => {
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
          success: false,
          message: 'Error reading CSV file',
          error: error.message
        });
      });
  });
});

export {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  getNearbyLocations,
  importLocations
};
