/**
 * OrganizerRoute - Protected route for organizers and admins
 * Redirects non-organizers to home page
 * Redirects unauthenticated users to login
 */

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { isOrganizer } from '../utils/permissions';
import LoadingSpinner from './LoadingSpinner';

interface OrganizerRouteProps {
  children: React.ReactNode;
}

const OrganizerRoute: React.FC<OrganizerRouteProps> = ({ children }) => {
  const { user, isLoading, _hasCheckedOnce } = useAuthStore();

  // Show loading spinner while checking auth OR before first check completes
  // This prevents flash of wrong content during initial mount
  if (isLoading || !_hasCheckedOnce) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to home if not organizer or admin
  if (!isOrganizer(user)) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated and has organizer/admin role
  return <>{children}</>;
};

export default OrganizerRoute;
