# 🗺️ Smart Navigator

**A modern campus navigation system for Thapar Institute of Engineering & Technology**

[![Quality Gate Status](https://img.shields.io/badge/Quality%20Gate-A+-brightgreen)](https://github.com/NobleChicken97/SmartNav)
[![ES Modules](https://img.shields.io/badge/ES%20Modules-✓-green)](https://github.com/NobleChicken97/SmartNav)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-ES%20Modules-green)](https://nodejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28)](https://firebase.google.com/)

> A comprehensive web application that helps students, faculty, and visitors navigate Thapar University campus with interactive maps, location search, and real-time information.

## ✨ Features

- 🗺️ **Interactive Campus Map** - Leaflet-based mapping with custom markers
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

| Service | Development Mode | Docker Mode |
|---------|------------------|-------------|
| **Frontend** | http://localhost:5173 | http://localhost:3000 |
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
- **Tailwind CSS** for styling
- **Leaflet** for interactive maps
- **Zustand** for state management
- **Axios** for API communication

### Backend  
- **Node.js** with ES Modules
- **Express.js** web framework
- **Firebase** (Firestore + Authentication)
- **Firebase Admin SDK** for server-side operations
- **Multer** for file uploads

### DevOps & Quality
- **Docker & Docker Compose** for containerization
- **GitHub Actions** for CI/CD
- **ESLint & Prettier** for code quality
- **Jest** for testing

## 📁 Project Structure

## 📁 Project Structure

```
SmartNavigator/
├── 📁 backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── controllers/        # Route handlers
│   │   ├── repositories/       # Firestore data access  
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Custom middleware
│   │   └── utils/             # Helper functions
│   └── tests/                 # Backend tests
├── 📁 frontend/               # React + TypeScript app
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Route components  
│   │   ├── services/          # API services
│   │   ├── stores/            # Zustand stores
│   │   ├── types/             # TypeScript definitions
│   │   └── utils/             # Helper functions
│   └── public/                # Static assets
├── 📁 docs/                   # Project documentation
├── 📁 scripts/                # Database seeding & utilities  
├── 📁 .github/                # CI/CD workflows
├── docker-compose.yml         # Container orchestration
└── README.md                  # You are here!
```

## 🎯 Current Status

**Project Status:** Production Ready ✅  
**Architecture:** Firebase (Firestore + Authentication)  
**Last Updated:** November 17, 2025

### ✅ Completed Features
- ✅ **Firebase Migration Complete** - Full MongoDB to Firebase Firestore migration
- ✅ **Firebase Authentication** - Secure client-side password handling
- ✅ Full ES Modules conversion (Backend + Frontend)
- ✅ Interactive Leaflet maps with campus locations
- ✅ Location CRUD operations with Firestore
- ✅ **Event end time tracking with time ranges**
- ✅ **Real-time event status detection (Upcoming/Ongoing/Completed)**
- ✅ **Smart dashboards with clickable statistics**
- ✅ Role-based access control (Student, Organizer, Admin)
- ✅ Responsive design for all devices
- ✅ Docker containerization (simplified, no MongoDB)
- ✅ Clean architecture (44% fewer dependencies)

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
- ✅ **Firebase Authentication** - Secure client-side password validation
- ✅ **Firestore Database** - All data in Firebase (users, locations, events)
- ✅ Complete API with Firebase ID token verification
- ✅ Docker deployment ready (no MongoDB required)
- ✅ Type-safe TypeScript codebase

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

## 🔥 Firebase Setup

This project uses Firebase for authentication and database. See **[QUICK_START_FIREBASE.md](./QUICK_START_FIREBASE.md)** for detailed setup instructions.

**Quick Setup:**
1. Create Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password + Google)
3. Enable Firestore Database
4. Get service account credentials for backend
5. Get web app credentials for frontend
6. Configure `.env` files (see `.env.example`)

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


