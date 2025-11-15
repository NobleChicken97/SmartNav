import { create } from 'zustand';
import { AuthService } from '../services/authService';
import { logger } from '../utils/logger';
import { User, LoginCredentials, RegisterData, Event } from '../types';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  isAdmin, 
  isOrganizer, 
  isStudent, 
  canCreateEvent,
  canEditEvent,
  canDeleteEvent,
  canManageLocations,
  canManageUsers,
  canViewEventRegistrations
} from '../utils/permissions';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  _hasCheckedOnce: boolean; // internal: ensure we don't double-run on mount
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  
  // Role checking helpers
  isAdmin: () => boolean;
  isOrganizer: () => boolean;
  isStudent: () => boolean;
  canCreateEvent: () => boolean;
  canEditEvent: (event: Event | null) => boolean;
  canDeleteEvent: (event: Event | null) => boolean;
  canManageLocations: () => boolean;
  canManageUsers: () => boolean;
  canViewEventRegistrations: (event: Event | null) => boolean;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state - start with loading:true to prevent flash
  user: null,
  isLoading: true, // Start as true, Firebase listener will update
  error: null,
  isAuthenticated: false,
  _hasCheckedOnce: false,

  // Actions
  login: async (credentials: LoginCredentials) => {
    try {
      logger.log('🔐 Auth Store: Starting login process', credentials.email);
      set({ isLoading: true, error: null });
      
      logger.log('🔐 Auth Store: Calling AuthService.login (Firebase only)...');
      await AuthService.login(credentials);
      logger.log('🔐 Auth Store: Firebase sign-in successful');
      logger.log('🔐 Auth Store: onAuthStateChanged will handle user state update');
      
      // Don't set state here - onAuthStateChanged listener will handle it
      // Just clear loading state
      set({ isLoading: false });
      
    } catch (error) {
      logger.error('🔐 Auth Store: Login failed:', error);
      
      // Use error message from AuthService (already user-friendly)
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      
      set({ 
        error: errorMessage,
        isLoading: false,
        user: null,
        isAuthenticated: false
      });
      // Don't re-throw - error is already set in state for UI to display
    }
  },

  register: async (data: RegisterData) => {
    try {
      set({ isLoading: true, error: null });
      const user = await AuthService.register(data);
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        error: null 
      });
    } catch (error) {
      // Use error message from AuthService (already user-friendly)
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      
      set({ 
        error: errorMessage,
        isLoading: false,
        user: null,
        isAuthenticated: false
      });
      // Don't re-throw - error is already set in state for UI to display
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await AuthService.logout();
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: null,
        // Keep _hasCheckedOnce: true to allow PrivateRoute to redirect properly
      });
    } catch (error) {
      // Even if logout fails on server, clear local state
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Logout failed',
        // Keep _hasCheckedOnce: true to allow PrivateRoute to redirect properly
      });
    }
  },

  checkAuth: async () => {
    // This is now a no-op - Firebase onAuthStateChanged handles everything
    // Kept for backwards compatibility but does nothing
    // The auth state is managed by the onAuthStateChanged listener below
    logger.log('🔍 Auth Store: checkAuth called (no-op, Firebase listener handles auth)');
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // Role checking helpers
  isAdmin: () => {
    const { user } = get();
    return isAdmin(user);
  },

  isOrganizer: () => {
    const { user } = get();
    return isOrganizer(user);
  },

  isStudent: () => {
    const { user } = get();
    return isStudent(user);
  },

  canCreateEvent: () => {
    const { user } = get();
    return canCreateEvent(user);
  },

  canEditEvent: (event: Event | null) => {
    const { user } = get();
    return canEditEvent(user, event);
  },

  canDeleteEvent: (event: Event | null) => {
    const { user } = get();
    return canDeleteEvent(user, event);
  },

  canManageLocations: () => {
    const { user } = get();
    return canManageLocations(user);
  },

  canManageUsers: () => {
    const { user } = get();
    return canManageUsers(user);
  },

  canViewEventRegistrations: (event: Event | null) => {
    const { user } = get();
    return canViewEventRegistrations(user, event);
  },
}));

// Listen to Firebase auth state changes
// This is the primary auth mechanism - fires immediately on page load
onAuthStateChanged(auth, async (firebaseUser) => {
  logger.log('🔥 Firebase Auth State Changed:', firebaseUser?.email || 'No user');
  
  if (firebaseUser) {
    // User signed in - fetch user data from backend
    try {
      const user = await AuthService.getCurrentUser();
      useAuthStore.setState({ 
        user, 
        isAuthenticated: true,
        isLoading: false,
        error: null,
        _hasCheckedOnce: true
      });
    } catch (error) {
      logger.error('🔥 Failed to fetch user data:', error);
      // Firebase user exists but backend fetch failed - clear state
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        _hasCheckedOnce: true
      });
    }
  } else {
    // User signed out or not logged in
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasCheckedOnce: true
    });
  }
});