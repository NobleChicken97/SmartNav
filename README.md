# 🗺️ Smart Navigator

**A modern campus navigation system for Thapar Institute of Engineering & Technology**

[![Quality Gate Status](https://img.shields.io/badge/Quality%20Gate-A+-brightgreen)](https://github.com/NobleChicken97/SmartNav)
[![ES Modules](https://img.shields.io/badge/ES%20Modules-✓-green)](https://github.com/NobleChicken97/SmartNav)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-ES%20Modules-green)](https://nodejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28)](https://firebase.google.com/)

> A comprehensive web application that helps students, faculty, and visitors navigate Thapar University campus with interactive maps, location search, and real-time information.

## ✨ Features

- 🗺️ **Interactive Campus Map** - Leaflet-based mapping with custom markers and event locations
- 🎉 **Event Management** - Create, manage, and display campus events with start/end times
- ⏰ **Real-Time Event Status** - Automatic detection of upcoming, ongoing, and completed events
- 📊 **Smart Dashboards** - Role-specific dashboards with clickable statistics and filtering
- 🔍 **Smart Search** - Find buildings, rooms, events, and points of interest quickly
- 📍 **Location Management** - Add, edit, and manage campus locations (Admin)
- 🎯 **Categories** - Buildings, rooms, dining, recreation, events, and more
- 👥 **Role-Based Access** - Student, Organizer, and Admin roles with proper permissions
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- 🔒 **Secure API** - Firebase Authentication with ID token verification
- ⚡ **Modern Tech Stack** - React 18, TypeScript, Node.js with ES Modules
- 🎨 **Modern Design System** - Consistent brand colors, Poppins/Dancing Script fonts, cream backgrounds
- 📚 **API Documentation** - Complete Swagger/OpenAPI documentation

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- Firebase project (free tier available)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/NobleChicken97/SmartNav.git
cd SmartNavigator

# Install dependencies for both frontend and backend
npm run install:all

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit the .env files with your configuration

# Start development servers
npm run dev
```

The application will be available at:

| Service         | Development Mode      | Docker Mode           |
| --------------- | --------------------- | --------------------- |
| **Frontend**    | http://localhost:5173 | http://localhost:3000 |
| **Backend API** | http://localhost:5000 | http://localhost:5000 |

**Note:** Use development mode (`npm run dev`) for hot-reload during coding, or Docker mode (`docker-compose up`) for production-like testing.

## 📖 Documentation

- **[📋 Development Rules](./.github/instructions/development.instructions.md)** - Coding standards for AI assistants
- **[📋 Project Workflow](./.github/instructions/project.instructions.md)** - Student-friendly development workflow

**Note:** Full API documentation available via Swagger at `http://localhost:5000/api-docs` when backend is running.

## 🏗️ Tech Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling with custom design system
- **Leaflet** for interactive maps
- **Zustand** for state management
- **Axios** for API communication
- **Design System:**
  - Primary Green: `#16a34a`
  - Secondary Blue: `#0284c7`
  - Background Cream: `#fefce8`
  - Fonts: Poppins (body), Dancing Script (headings)

### Backend

- **Vercel Serverless Functions** for API endpoints
- **Node.js** with ES Modules
- **Firebase** (Firestore + Authentication)
- **Firebase Admin SDK** for server-side operations
- **Serverless Architecture** for automatic scaling

### DevOps & Quality

- **Docker & Docker Compose** for containerization
- **GitHub Actions** for CI/CD
- **ESLint & Prettier** for code quality
- **Jest** for testing

## 📁 Project Structure

```
SmartNavigator/
├── 📁 api/                     # Vercel Serverless Functions
│   ├── _lib/                   # Shared library code
│   │   ├── controllers/        # Business logic
│   │   ├── repositories/       # Firestore data access
│   │   ├── middleware/         # Auth, RBAC, validation
│   │   ├── utils/              # Firebase admin, helpers
│   │   └── config/             # Permissions config
│   ├── auth.js                 # Auth endpoints
│   ├── events.js               # Events endpoints
│   ├── locations.js            # Locations endpoints
│   ├── users.js                # Users endpoints
│   └── package.json            # API dependencies
├── 📁 backend/                 # Legacy backend (deprecated)
│   └── src/                    # Use api/ folder instead
├── 📁 frontend/                # React + TypeScript app
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Route components
│   │   ├── services/           # API services
│   │   ├── stores/             # Zustand stores
│   │   ├── types/              # TypeScript definitions
│   │   └── utils/              # Helper functions
│   └── public/                 # Static assets
├── 📁 scripts/                 # Database seeding utilities
├── API_DEPLOYMENT.md           # Vercel deployment guide
├── vercel.json                 # Vercel configuration
└── README.md                   # You are here!
```

## 🎯 Current Status

**Project Status:** Production Ready ✅  
**Architecture:** Vercel Serverless + Firebase  
**Last Updated:** November 19, 2025

### ✅ Completed Features

- ✅ **Vercel Serverless Deployment** - Full backend converted to serverless functions
- ✅ **Firebase Integration** - Firestore database + Authentication
- ✅ **Google Sign-In** - OAuth authentication flow
- ✅ **Modern Design System** - Custom branding with green/blue/cream colors
- ✅ Full ES Modules support (Frontend + API)
- ✅ Interactive Leaflet maps with campus locations
- ✅ Location CRUD operations with Firestore
- ✅ **Event end time tracking with time ranges**
- ✅ **Real-time event status detection (Upcoming/Ongoing/Completed)**
- ✅ **Smart dashboards with clickable statistics and filtering**
- ✅ Role-based access control (Student, Organizer, Admin)
- ✅ **Serverless API** - Auto-scaling, pay-per-use deployment
- ✅ Responsive design for all devices
- ✅ Docker containerization (simplified, no MongoDB)
- ✅ Clean architecture (44% fewer dependencies)
- ✅ **Modern Design System** - Consistent brand colors, custom fonts, improved typography
- ✅ **Polished UI** - Light navbar gradient, cream backgrounds, green/blue accent colors

### 🚧 In Progress

- 🔄 Enhanced test coverage
- 🔄 Advanced map features (routing, categories)
- 🔄 Performance optimizations

### 🎯 Planned Features

- 📋 Route planning between locations
- 📊 Usage analytics dashboard
- 🔔 Real-time notifications
- 📱 Progressive Web App (PWA) capabilities
- 🤖 AI-powered search suggestions

## �️ Development Commands

```bash
# Install dependencies
npm run install:all

# Development
npm run dev                    # Start both frontend & backend
npm run dev:frontend          # Frontend only (port 5173)
npm run dev:backend           # Backend only (port 5000)

# Code Quality
npm run lint                  # Run ESLint
npm run type-check           # TypeScript checking
npm test                     # Run tests

# Database
node scripts/seed.js         # Seed sample data
node scripts/reset-db.js     # Reset database

# Production
npm run build               # Build for production
npm start                  # Start production server
docker-compose up -d       # Start with Docker
```

## 🎓 Project Status

**Current Version:** 2.0.0 - Production Ready ✅  
**Architecture:** Firebase-based (Firestore + Authentication)

### What's Working

- ✅ Interactive campus map with Leaflet
- ✅ Event markers with visual distinction (🎉 markers)
- ✅ Location search and filtering
- ✅ Role-based access control (Student, Organizer, Admin)
- ✅ **Firebase Authentication** - Secure client-side password validation + Google Sign-In
- ✅ **Firestore Database** - All data in Firebase (users, locations, events)
- ✅ **Error Handling** - Persistent, user-friendly error messages
- ✅ Complete API with Firebase ID token verification
- ✅ Docker deployment ready (no MongoDB required)
- ✅ Type-safe TypeScript codebase
- ✅ **Clean UI** - Simplified map interface with enhanced navbar

### Recent Updates (November 2025)

- ✅ **Complete Firebase Migration** - Removed all MongoDB/JWT dependencies
- ✅ **Security Enhanced** - Passwords never sent to backend (Firebase handles client-side)
- ✅ **Simplified Auth Flow** - Reduced login steps from 5 to 2
- ✅ **Dependency Optimization** - Reduced packages by 44% (47→26)
- ✅ **Clean Architecture** - Removed 13 redundant files, 21 npm packages
- ✅ **Updated Documentation** - Firebase-focused guides (QUICK_START_FIREBASE.md)
- ✅ **Event end time tracking** - Events with start and end times
- ✅ **Real-time event status** - Automatic detection of upcoming/ongoing/completed events
- ✅ **Enhanced dashboards** - Clickable statistics with smart filtering
- ✅ **Firestore Repositories** - Clean data access layer for all collections
- ✅ **Error Display Fix** - Fixed React Strict Mode error clearing issue
- ✅ **Design System Overhaul** - Comprehensive redesign with brand colors and custom fonts
- ✅ **UI Consistency** - All pages updated with card components, improved typography
- ✅ **Production Merge** - Firebase branch successfully merged to main

## 🚀 Deployment

### Vercel (Recommended - Free Tier)

This project is optimized for **Vercel** deployment with serverless functions.

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod
```

**Complete deployment guide:** See [API_DEPLOYMENT.md](./API_DEPLOYMENT.md)

**What you get:**

- ✅ Frontend hosted on Vercel CDN
- ✅ Serverless API at `/api/*` endpoints
- ✅ Automatic HTTPS & scaling
- ✅ 100GB bandwidth/month (free tier)

### Environment Variables

Set these in **Vercel Dashboard** → Settings → Environment Variables:

```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# CORS
CORS_ORIGIN=https://yourdomain.vercel.app
NODE_ENV=production
```

## 🔥 Firebase Setup

This project uses Firebase for authentication and database. See **[QUICK_START_FIREBASE.md](./QUICK_START_FIREBASE.md)** for detailed setup instructions.

**Quick Setup:**

1. Create Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password + Google)
3. Enable Firestore Database
4. Get service account credentials for Vercel deployment
5. Get web app credentials for frontend
6. Configure environment variables in Vercel Dashboard

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👥 Team

- **Lead Developer:** [NobleChicken97](https://github.com/NobleChicken97)
- **LinkedIn:** [linkedin.com/in/arpangoyal97](https://linkedin.com/in/arpangoyal97/)
- **Institution:** Thapar Institute of Engineering & Technology
