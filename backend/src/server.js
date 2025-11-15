import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import logger from './utils/logger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import limiter from './middleware/rateLimiter.js';

// Import routes
import authRoutes from './routes/auth.js';
import locationRoutes from './routes/locations.js';
import eventRoutes from './routes/events.js';
import userRoutes from './routes/users.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Leaflet
        "https://unpkg.com", // Leaflet CDN
        "https://cdnjs.cloudflare.com" // Leaflet icons
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Leaflet
        "https://unpkg.com", // Leaflet CDN
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https://*.tile.openstreetmap.org", // OpenStreetMap tiles
        "https://server.arcgisonline.com", // Satellite tiles
        "https://*.basemaps.cartocdn.com", // CartoDB tiles
        "https://cdnjs.cloudflare.com" // Leaflet marker icons
      ],
      connectSrc: [
        "'self'",
        "https://api.github.com"
      ]
    }
  },
  crossOriginEmbedderPolicy: false, // Required for some third-party resources
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration (support multiple origins from env)
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['Set-Cookie']
}));

// Rate limiting
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing middleware
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);

// In production, serve frontend build and enable SPA fallback
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(distPath));

  // SPA fallback: send index.html for non-API GET routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  const serverLogger = logger.child({ component: 'server', event: 'startup' });
  serverLogger.info('Server started successfully', {
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  const serverLogger = logger.child({ component: 'server', event: 'unhandled_rejection' });
  serverLogger.error('Unhandled Promise Rejection', {
    message: err.message,
    stack: err.stack,
    name: err.name
  });
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  const serverLogger = logger.child({ component: 'server', event: 'uncaught_exception' });
  serverLogger.error('Uncaught Exception', {
    message: err.message,
    stack: err.stack,
    name: err.name
  });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  const serverLogger = logger.child({ component: 'server', event: 'shutdown' });
  serverLogger.info('SIGTERM received - shutting down gracefully');
  server.close(() => {
    serverLogger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
