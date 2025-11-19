/**
 * Vercel Serverless Function: Events Routes
 * Handles all /api/events/* endpoints
 */

import {
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
} from './_lib/controllers/eventController.js';
import { authenticateFirebase, optionalFirebaseAuth } from './_lib/middleware/firebaseAuth.js';
import { requireOrganizerOrAdmin } from './_lib/middleware/rbac.js';
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

  const path = req.url.replace('/api/events', '') || '/';
  const segments = path.split('/').filter(Boolean);

  try {
    // GET /api/events (list all events)
    if (path === '/' && req.method === 'GET') {
      return await asyncHandler(async (req, res) => {
        await optionalFirebaseAuth(req, res, async () => {
          await getEvents(req, res);
        });
      })(req, res);
    }

    // GET /api/events/upcoming
    if (path === '/upcoming' && req.method === 'GET') {
      return await asyncHandler(getUpcomingEvents)(req, res);
    }

    // GET /api/events/recommended (authenticated)
    if (path === '/recommended' && req.method === 'GET') {
      return await asyncHandler(async (req, res) => {
        await authenticateFirebase(req, res, async () => {
          await getRecommendedEvents(req, res);
        });
      })(req, res);
    }

    // GET /api/events/my-events (authenticated)
    if (path === '/my-events' && req.method === 'GET') {
      return await asyncHandler(async (req, res) => {
        await authenticateFirebase(req, res, async () => {
          await getMyEvents(req, res);
        });
      })(req, res);
    }

    // POST /api/events (create event - organizer/admin only)
    if (path === '/' && req.method === 'POST') {
      return await asyncHandler(async (req, res) => {
        await authenticateFirebase(req, res, async () => {
          await requireOrganizerOrAdmin(req, res, async () => {
            await createEvent(req, res);
          });
        });
      })(req, res);
    }

    // Routes with :id parameter
    if (segments.length >= 1) {
      const eventId = segments[0];
      req.params = { id: eventId };

      // GET /api/events/:id
      if (segments.length === 1 && req.method === 'GET') {
        return await asyncHandler(getEvent)(req, res);
      }

      // PUT /api/events/:id (update event)
      if (segments.length === 1 && req.method === 'PUT') {
        return await asyncHandler(async (req, res) => {
          await authenticateFirebase(req, res, async () => {
            await updateEvent(req, res);
          });
        })(req, res);
      }

      // DELETE /api/events/:id
      if (segments.length === 1 && req.method === 'DELETE') {
        return await asyncHandler(async (req, res) => {
          await authenticateFirebase(req, res, async () => {
            await deleteEvent(req, res);
          });
        })(req, res);
      }

      // POST /api/events/:id/register
      if (segments.length === 2 && segments[1] === 'register' && req.method === 'POST') {
        return await asyncHandler(async (req, res) => {
          await authenticateFirebase(req, res, async () => {
            await registerForEvent(req, res);
          });
        })(req, res);
      }

      // DELETE /api/events/:id/register
      if (segments.length === 2 && segments[1] === 'register' && req.method === 'DELETE') {
        return await asyncHandler(async (req, res) => {
          await authenticateFirebase(req, res, async () => {
            await unregisterFromEvent(req, res);
          });
        })(req, res);
      }

      // PUT /api/events/:id/cancel
      if (segments.length === 2 && segments[1] === 'cancel' && req.method === 'PUT') {
        return await asyncHandler(async (req, res) => {
          await authenticateFirebase(req, res, async () => {
            await cancelEvent(req, res);
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
    console.error('Events API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
