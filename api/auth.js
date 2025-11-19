/**
 * Vercel Serverless Function: Auth Routes
 * Handles: /api/auth/register, /api/auth/me, /api/auth/logout, /api/auth/csrf-token, /api/auth/google
 */

import { 
  register, 
  getMe, 
  logout, 
  getCSRFToken, 
  googleAuth 
} from './_lib/controllers/authController.js';
import { authenticateFirebase } from './_lib/middleware/firebaseAuth.js';
import { asyncHandler } from './_lib/middleware/errorHandler.js';

// CORS helper
const setCors = (res) => {
  const origin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
};

// Route handler
export default async function handler(req, res) {
  setCors(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse URL path
  const path = req.url.replace('/api/auth', '');

  try {
    // POST /api/auth/register
    if (path === '/register' && req.method === 'POST') {
      return await asyncHandler(register)(req, res);
    }

    // GET /api/auth/me
    if (path === '/me' && req.method === 'GET') {
      return await asyncHandler(async (req, res) => {
        await authenticateFirebase(req, res, async () => {
          await getMe(req, res);
        });
      })(req, res);
    }

    // POST /api/auth/logout
    if (path === '/logout' && req.method === 'POST') {
      return await asyncHandler(async (req, res) => {
        await authenticateFirebase(req, res, async () => {
          await logout(req, res);
        });
      })(req, res);
    }

    // GET /api/auth/csrf-token
    if (path === '/csrf-token' && req.method === 'GET') {
      return await asyncHandler(getCSRFToken)(req, res);
    }

    // POST /api/auth/google
    if (path === '/google' && req.method === 'POST') {
      return await asyncHandler(googleAuth)(req, res);
    }

    // Route not found
    res.status(404).json({
      success: false,
      message: `Route ${req.method} ${path} not found`
    });
  } catch (error) {
    console.error('Auth API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
