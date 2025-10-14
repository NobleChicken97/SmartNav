import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import LoadingSpinner from './components/LoadingSpinner';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import OrganizerRoute from './components/OrganizerRoute';
import MapPage from './pages/MapPage';
import ErrorBoundary from './components/ErrorBoundary';
import { RouteErrorBoundary } from './components/SpecializedErrorBoundaries';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const { checkAuth, isLoading } = useAuthStore();

  // Check authentication status on app load
  useEffect(() => {
    checkAuth();
    // checkAuth is stable in Zustand; include to satisfy lint
  }, [checkAuth]);

  if (isLoading) {
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
  </ErrorBoundary>
      </div>
    </Router>
  );
}

export default App;
