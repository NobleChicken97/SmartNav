/**
 * Vercel Serverless Function: Users Routes
 * Handles all /api/users/* endpoints
 */

import {
  getProfile,
  updateProfile,
  getUserEvents,
  deleteAccount,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} from './_lib/controllers/userController.js';
import { authenticateFirebase } from './_lib/middleware/firebaseAuth.js';
import { requireAdmin } from './_lib/middleware/rbac.js';
import { asyncHandler } from './_lib/middleware/errorHandler.js';

const setCors = (res) => {
  const origin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
};

export default async function handler(req, res) {
  setCors(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.url.replace('/api/users', '') || '/';
  const segments = path.split('/').filter(Boolean);

  try {
    // All routes require authentication
    return await asyncHandler(async (req, res) => {
      await authenticateFirebase(req, res, async () => {
        
        // GET /api/users (list all users - admin only)
        if (path === '/' && req.method === 'GET') {
          return await requireAdmin(req, res, async () => {
            await getAllUsers(req, res);
          });
        }

        // GET /api/users/profile
        if (path === '/profile' && req.method === 'GET') {
          return await getProfile(req, res);
        }

        // PUT /api/users/profile
        if (path === '/profile' && req.method === 'PUT') {
          return await updateProfile(req, res);
        }

        // DELETE /api/users/profile
        if (path === '/profile' && req.method === 'DELETE') {
          return await deleteAccount(req, res);
        }

        // GET /api/users/events
        if (path === '/events' && req.method === 'GET') {
          return await getUserEvents(req, res);
        }

        // Routes with :id parameter
        if (segments.length === 1) {
          const userId = segments[0];
          req.params = { id: userId };

          // GET /api/users/:id (admin only)
          if (req.method === 'GET') {
            return await requireAdmin(req, res, async () => {
              await getUserById(req, res);
            });
          }

          // PUT /api/users/:id (admin or self)
          if (req.method === 'PUT') {
            // Check if user is admin or updating self
            if (req.user.role === 'admin' || req.user.uid === userId) {
              return await updateUser(req, res);
            } else {
              return res.status(403).json({
                success: false,
                message: 'Access denied'
              });
            }
          }

          // DELETE /api/users/:id (admin only)
          if (req.method === 'DELETE') {
            return await requireAdmin(req, res, async () => {
              await deleteUser(req, res);
            });
          }
        }

        // Route not found
        res.status(404).json({
          success: false,
          message: `Route ${req.method} ${path} not found`
        });
      });
    })(req, res);
  } catch (error) {
    console.error('Users API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
