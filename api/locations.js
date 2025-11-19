/**
 * Vercel Serverless Function: Locations Routes
 * Handles all /api/locations/* endpoints
 */

import {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  getNearbyLocations
} from './_lib/controllers/locationController.js';
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

  const path = req.url.replace('/api/locations', '') || '/';
  const segments = path.split('/').filter(Boolean);

  try {
    // GET /api/locations (list all locations)
    if (path === '/' && req.method === 'GET') {
      return await asyncHandler(getLocations)(req, res);
    }

    // GET /api/locations/nearby
    if (path === '/nearby' && req.method === 'GET') {
      return await asyncHandler(getNearbyLocations)(req, res);
    }

    // POST /api/locations (create location - admin only)
    if (path === '/' && req.method === 'POST') {
      return await asyncHandler(async (req, res) => {
        await authenticateFirebase(req, res, async () => {
          await requireAdmin(req, res, async () => {
            await createLocation(req, res);
          });
        });
      })(req, res);
    }

    // Routes with :id parameter
    if (segments.length === 1) {
      const locationId = segments[0];
      req.params = { id: locationId };

      // GET /api/locations/:id
      if (req.method === 'GET') {
        return await asyncHandler(getLocation)(req, res);
      }

      // PUT /api/locations/:id (update location - admin only)
      if (req.method === 'PUT') {
        return await asyncHandler(async (req, res) => {
          await authenticateFirebase(req, res, async () => {
            await requireAdmin(req, res, async () => {
              await updateLocation(req, res);
            });
          });
        })(req, res);
      }

      // DELETE /api/locations/:id (delete location - admin only)
      if (req.method === 'DELETE') {
        return await asyncHandler(async (req, res) => {
          await authenticateFirebase(req, res, async () => {
            await requireAdmin(req, res, async () => {
              await deleteLocation(req, res);
            });
          });
        })(req, res);
      }
    }

    // Route not found
    res.status(404).json({
      success: false,
      message: `Route ${req.method} ${path} not found`
    });
  } catch (error) {
    console.error('Locations API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
