import { body, query, param, validationResult } from 'express-validator';

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

/**
 * User registration validation
 */
const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array'),
  
  body('interests.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each interest must be between 1 and 50 characters'),
  
  handleValidationErrors
];

/**
 * User login validation
 */
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * Location validation
 */
const validateLocation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('type')
    .isIn(['building', 'room', 'poi'])
    .withMessage('Type must be one of: building, room, poi'),
  
  body('coordinates.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('coordinates.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('buildingId')
    .optional()
    .isMongoId()
    .withMessage('Building ID must be a valid ID'),
  
  body('floor')
    .optional(),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),
  
  handleValidationErrors
];

/**
 * Event validation
 */
const validateEvent = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters'),
  
  body('category')
    .isIn(['academic', 'cultural', 'sports', 'workshop', 'seminar', 'conference', 'social', 'other'])
    .withMessage('Category must be one of: academic, cultural, sports, workshop, seminar, conference, social, other'),
  
  body('locationId')
    .isMongoId()
    .withMessage('Location ID must be a valid ID'),
  
  body('dateTime')
    .isISO8601()
    .toDate()
    .custom((value) => {
      if (value <= new Date()) {
        throw new Error('Event date must be in the future');
      }
      return true;
    }),
  
  body('capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Capacity must be a positive integer'),
  
  body('organizer')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Organizer name must be between 1 and 100 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),
  
  handleValidationErrors
];

/**
 * Profile update validation
 */
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array'),
  
  body('interests.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each interest must be between 1 and 50 characters'),
  
  handleValidationErrors
];

/**
 * Query parameter validation for locations
 */
const validateLocationQuery = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('type')
    .optional()
    .isIn(['building', 'room', 'poi'])
    .withMessage('Type must be one of: building, room, poi'),
  
  query('north')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('North bound must be between -90 and 90'),
  
  query('south')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('South bound must be between -90 and 90'),
  
  query('east')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('East bound must be between -180 and 180'),
  
  query('west')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('West bound must be between -180 and 180'),
  
  handleValidationErrors
];

/**
 * Query parameter validation for events
 */
const validateEventQuery = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('category')
    .optional()
    .isIn(['academic', 'cultural', 'sports', 'workshop', 'seminar', 'conference', 'social', 'other'])
    .withMessage('Category must be one of: academic, cultural, sports, workshop, seminar, conference, social, other'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  query('locationId')
    .optional()
    .isMongoId()
    .withMessage('Location ID must be a valid ID'),
  
  handleValidationErrors
];

/**
 * Generic ID parameter validation (Firestore document IDs)
 */
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('ID must be a valid document ID'),
  
  handleValidationErrors
];

export {
  validateRegister,
  validateLogin,
  validateLocation,
  validateEvent,
  validateProfileUpdate,
  validateLocationQuery,
  validateEventQuery,
  validateObjectId,
  handleValidationErrors
};
