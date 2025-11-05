import express from 'express';
const router = express.Router();
import multer from 'multer';
import path from 'path';
import {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  getNearbyLocations,
  importLocations
} from '../controllers/locationController.js';
import { authenticate } from '../middleware/auth.js';
import { 
  validateLocation, 
  validateLocationQuery, 
  validateObjectId 
} from '../middleware/validation.js';
import { requireAdmin } from '../middleware/rbac.js';

// Configure multer for CSV uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname) === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Public routes
router.get('/', validateLocationQuery, getLocations);
router.get('/nearby', validateLocationQuery, getNearbyLocations);
router.get('/:id', validateObjectId, getLocation);

// Admin only routes - Location management restricted to administrators
router.post('/', 
  authenticate,
  requireAdmin,
  validateLocation, 
  createLocation
);

router.put('/:id', 
  authenticate,
  requireAdmin,
  validateObjectId, 
  validateLocation, 
  updateLocation
);

router.delete('/:id', 
  authenticate,
  requireAdmin,
  validateObjectId, 
  deleteLocation
);

router.post('/import', 
  authenticate,
  requireAdmin,
  upload.single('csv'), 
  importLocations
);

export default router;
