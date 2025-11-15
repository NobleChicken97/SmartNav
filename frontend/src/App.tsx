import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import LoadingSpinner from './components/LoadingSpinner';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import OrganizerRoute from './components/OrganizerRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { RouteErrorBoundary } from './components/SpecializedErrorBoundaries';
import { Toaster } from 'react-hot-toast';

// Lazy load pages for better initial load performance
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const OrganizerDashboard = lazy(() => import('./pages/OrganizerDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const CreateEventPage = lazy(() => import('./pages/CreateEventPage'));
const EditEventPage = lazy(() => import('./pages/EditEventPage'));

// Reusable loading component for lazy routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

function App() {
  const { isLoading, _hasCheckedOnce } = useAuthStore();

  // Firebase onAuthStateChanged listener handles auth automatically
  // No need to call checkAuth() - it would be redundant

  // Show loading screen only during initial Firebase auth check
  if (isLoading || !_hasCheckedOnce) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Router 
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <div className="App">
        <Toaster position="top-right" />
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route 
                path="/login" 
                element={
                  <RouteErrorBoundary routeName="Login">
                    <LoginPage />
                  </RouteErrorBoundary>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <RouteErrorBoundary routeName="Register">
                    <RegisterPage />
                  </RouteErrorBoundary>
                } 
              />
              
              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <RouteErrorBoundary routeName="Dashboard">
                    <PrivateRoute>
                      <MapPage />
                    </PrivateRoute>
                  </RouteErrorBoundary>
                }
              />
              
              <Route
                path="/map"
                element={
                  <RouteErrorBoundary routeName="Map">
                    <PrivateRoute>
                      <MapPage />
                    </PrivateRoute>
                  </RouteErrorBoundary>
                }
              />

          {/* Organizer Routes */}
          <Route
            path="/organizer/dashboard"
            element={
              <RouteErrorBoundary routeName="Organizer Dashboard">
                <OrganizerRoute>
                  <OrganizerDashboard />
                </OrganizerRoute>
              </RouteErrorBoundary>
            }
          />

          <Route
            path="/events/create"
            element={
              <RouteErrorBoundary routeName="Create Event">
                <OrganizerRoute>
                  <CreateEventPage />
                </OrganizerRoute>
              </RouteErrorBoundary>
            }
          />

          <Route
            path="/events/:id/edit"
            element={
              <RouteErrorBoundary routeName="Edit Event">
                <OrganizerRoute>
                  <EditEventPage />
                </OrganizerRoute>
              </RouteErrorBoundary>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <RouteErrorBoundary routeName="Admin Dashboard">
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              </RouteErrorBoundary>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch all route */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900">404</h1>
                  <p className="text-gray-600 mt-2">Page not found</p>
                  <a
                    href="/dashboard"
                    className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Go to Dashboard
                  </a>
                </div>
              </div>
            }
          />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>
    </Router>
  );
}

export default App;
