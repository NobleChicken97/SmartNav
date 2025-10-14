import { create } from 'zustand';
import { AuthService } from '../services/authService';
import { logger } from '../utils/logger';
import { User, LoginCredentials, RegisterData, Event } from '../types';
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
  // Initial state
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  _hasCheckedOnce: false,

  // Actions
  login: async (credentials: LoginCredentials) => {
    try {
  logger.log('🔐 Auth Store: Starting login process', credentials.email);
      set({ isLoading: true, error: null });
      
  logger.log('🔐 Auth Store: Calling AuthService.login...');
      const user = await AuthService.login(credentials);
  logger.log('🔐 Auth Store: Login successful, user received:', user);
      
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        error: null 
      });
  logger.log('🔐 Auth Store: State updated successfully');
    } catch (error) {
  logger.error('🔐 Auth Store: Login failed:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
        user: null,
        isAuthenticated: false
      });
      throw error;
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
      set({ 
        error: error instanceof Error ? error.message : 'Registration failed',
        isLoading: false,
        user: null,
        isAuthenticated: false
      });
      throw error;
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
  _hasCheckedOnce: false,
      });
    } catch (error) {
      // Even if logout fails on server, clear local state
      set({ 
  user: null, 
  isAuthenticated: false, 
        isLoading: false,
  error: error instanceof Error ? error.message : 'Logout failed',
  _hasCheckedOnce: false,
      });
    }
  },

  checkAuth: async () => {
    // Prevent multiple simultaneous or duplicate auth checks (e.g., StrictMode double-invoke)
    const state = get();
    if (state.isLoading || state._hasCheckedOnce) {
      logger.log('🔍 Auth Store: Auth check already in progress or done, skipping');
      return;
    }

    try {
      logger.log('🔍 Auth Store: Starting auth check...');
      // If no auth cookie, skip the request to avoid 401 noise
      if (!AuthService.hasAuthCookie()) {
        set({ user: null, isAuthenticated: false, isLoading: false, error: null, _hasCheckedOnce: true });
        logger.log('🔍 Auth Store: No auth cookie present; treating as guest');
        return;
      }

      set({ isLoading: true });
      const user = await AuthService.getCurrentUser();
      logger.log('🔍 Auth Store: Auth check successful, user:', user);
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        error: null,
        _hasCheckedOnce: true,
      });
  } catch {
      // Treat unauthenticated as a normal state: no visible errors
      logger.log('🔍 Auth Store: Not authenticated yet (expected when visiting as guest)');
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: null,
        _hasCheckedOnce: true,
      });
    }
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