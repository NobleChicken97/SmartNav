/**
 * Error handling utilities for Vercel Serverless
 */

export const asyncHandler = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    console.error('Error:', error);
    
    let statusCode = 500;
    let message = 'Internal Server Error';

    // Firebase token errors
    if (error.code === 'auth/id-token-expired') {
      statusCode = 401;
      message = 'Token expired';
    } else if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
      statusCode = 401;
      message = 'Invalid authentication token';
    } else if (error.message) {
      message = error.message;
    }

    res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};
