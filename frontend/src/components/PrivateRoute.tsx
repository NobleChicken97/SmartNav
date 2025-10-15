import { memo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import LoadingSpinner from './LoadingSpinner';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'admin';
}

const PrivateRoute = memo<PrivateRouteProps>(({ 
  children, 
  requiredRole 
}) => {
  const { user, isLoading, _hasCheckedOnce } = useAuthStore();
  const location = useLocation();

  // Show loading spinner while checking auth OR before first check completes
  // This prevents flash of wrong content during initial mount
  if (isLoading || !_hasCheckedOnce) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to dashboard if user doesn't have required role
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
});

PrivateRoute.displayName = 'PrivateRoute';

export default PrivateRoute;
