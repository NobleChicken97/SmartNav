import { apiClient } from './apiClient';
import { User, LoginCredentials, RegisterData } from '../types';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  signInWithCustomToken,
  type UserCredential
} from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    customToken?: string;
    csrfToken?: string;
  };
}

interface BackendAuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    customToken: string;
    csrfToken: string;
  };
}

export class AuthService {
  /**
   * Register a new user with email and password
   * 1. Creates user in backend (Firebase Auth + Firestore)
   * 2. Signs in with custom token
   */
  static async register(data: RegisterData): Promise<User> {
    try {
      // Register via backend API
      const response = await apiClient.post<BackendAuthResponse>('/auth/register', data);
      
      // Sign in to Firebase with custom token
      if (response.data.customToken) {
        await signInWithCustomToken(auth, response.data.customToken);
      }
      
      return response.data.user;
    } catch (error: unknown) {
      // Handle Firebase errors that might come from backend
      const errorCode = (error as { code?: string })?.code;
      const errorMessage = error?.message || '';
      
      console.error('Registration error:', { errorCode, errorMessage, error });
      
      if (errorCode === 'auth/email-already-in-use' || errorMessage.includes('email-already-in-use') || errorMessage.includes('already exists')) {
        throw new Error('This email is already registered. Please log in instead.');
      } else if (errorCode === 'auth/weak-password' || errorMessage.includes('weak-password')) {
        throw new Error('Password is too weak. Use at least 6 characters.');
      } else if (errorCode === 'auth/invalid-email' || errorMessage.includes('invalid-email')) {
        throw new Error('Invalid email address. Please check and try again.');
      }
      
      // Re-throw with message
      throw new Error(errorMessage || 'Registration failed. Please try again.');
    }
  }

  /**
   * Login with email and password
   * Simplified flow: Firebase handles everything client-side
   * onAuthStateChanged listener will automatically call /api/auth/me to get user profile
   */
  static async login(credentials: LoginCredentials): Promise<void> {
    try {
      // Sign in with Firebase Auth (validates password, creates session)
      await signInWithEmailAndPassword(
        auth, 
        credentials.email, 
        credentials.password
      );
      
      // Done! onAuthStateChanged listener in authStore.ts will:
      // 1. Detect the sign-in
      // 2. Call getCurrentUser() -> /api/auth/me
      // 3. Update user state in Zustand store
      // No need to do anything else here
      
    } catch (error: unknown) {
      // Handle Firebase Auth errors with proper error codes
      const errorCode = (error as { code?: string })?.code;
      const errorMessage = error?.message || '';
      
      console.error('Login error:', { errorCode, errorMessage, error });
      
      if (errorCode === 'auth/user-not-found' || errorMessage.includes('user-not-found')) {
        throw new Error('User not registered. Please sign up first.');
      } else if (errorCode === 'auth/wrong-password' || errorMessage.includes('wrong-password')) {
        throw new Error('Wrong password. Please try again.');
      } else if (errorCode === 'auth/invalid-email' || errorMessage.includes('invalid-email')) {
        throw new Error('Invalid email format');
      } else if (errorCode === 'auth/user-disabled' || errorMessage.includes('user-disabled')) {
        throw new Error('This account has been disabled');
      } else if (errorCode === 'auth/too-many-requests' || errorMessage.includes('too-many-requests')) {
        throw new Error('Too many failed login attempts. Please try again later.');
      } else if (errorCode === 'auth/invalid-credential' || errorMessage.includes('invalid-credential')) {
        throw new Error('Wrong email or password. Please check and try again.');
      }
      
      // Re-throw with original message if no specific error matched
      throw new Error(errorMessage || 'Login failed. Please try again.');
    }
  }

  /**
   * Sign in with Google
   * 1. Opens Google Sign-In popup
   * 2. Gets ID token from Firebase
   * 3. Sends to backend to create/update user
   */
  static async signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    
    // Sign in with Google popup
    const result = await signInWithPopup(auth, provider);
    
    // Get ID token from Firebase
    const idToken = await result.user.getIdToken();
    
    // Send ID token to backend
    const response = await apiClient.post<BackendAuthResponse>('/auth/google', {
      idToken
    });
    
    return response.data.user;
  }

  /**
   * Logout user
   * 1. Calls backend logout endpoint
   * 2. Signs out from Firebase
   */
  static async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      await signOut(auth);
    }
  }

  /**
   * Get current user from backend
   * Requires valid Firebase ID token in request
   * NOTE: This is now a fallback - prefer using ID token claims for faster access
   */
  static async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{ success: boolean; data: { user: User } }>('/auth/me');
    return response.data.user;
  }

  /**
   * Force refresh ID token to get latest custom claims
   * Use after profile updates to ensure claims are current
   */
  static async refreshIdToken(): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      await user.getIdToken(true); // Force refresh
    }
  }

  /**
   * Get current Firebase user
   */
  static getCurrentFirebaseUser() {
    return auth.currentUser;
  }

  /**
   * Get Firebase ID token for API requests
   */
  static async getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  }

  /**
   * Update user profile
   */
  static async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<AuthResponse>('/auth/profile', data);
    return response.data.user;
  }

  /**
   * Change password via Firebase
   */
  static async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    await apiClient.put('/auth/change-password', data);
  }

  /**
   * Request password reset email via Firebase
   */
  static async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  }

  /**
   * Reset password with token
   */
  static async resetPassword(data: {
    token: string;
    newPassword: string;
  }): Promise<void> {
    await apiClient.post('/auth/reset-password', data);
  }

  /**
   * Verify email address
   */
  static async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/auth/verify-email', { token });
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(): Promise<void> {
    await apiClient.post('/auth/resend-verification');
  }
}
