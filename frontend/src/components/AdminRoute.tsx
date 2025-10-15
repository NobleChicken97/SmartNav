/**
 * AdminRoute - Protected route for admins only
 * Redirects non-admins to home page
 * Redirects unauthenticated users to login
 */

import { memo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { isAdmin } from '../utils/permissions';
import LoadingSpinner from './LoadingSpinner';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = memo<AdminRouteProps>(({ children }) => {
  const { user, isLoading, _hasCheckedOnce } = useAuthStore();

  // Show loading spinner while checking auth OR before first check completes
  // This prevents flash of wrong content during initial mount
  if (isLoading || !_hasCheckedOnce) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to home if not admin
  if (!isAdmin(user)) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated and has admin role
  return <>{children}</>;
});

AdminRoute.displayName = 'AdminRoute';

export default AdminRoute;
