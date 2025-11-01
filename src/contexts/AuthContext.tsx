'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  AuthTokens,
  AuthState,
  OTPRequest,
  OTPVerification,
  UpdateProfileRequest,
  ApiError,
  OTPStatusResponse,
} from '@/lib/types';
import { authService } from '@/services/auth.service';

// Authentication Action Types
type AuthAction =
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; tokens: AuthTokens } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_UPDATE_USER'; payload: User }
  | { type: 'AUTH_CLEAR_ERROR' };

// Authentication Context Type
interface AuthContextType extends AuthState {
  // OTP Authentication methods
  requestOTP: (request: OTPRequest) => Promise<OTPStatusResponse>;
  verifyOTP: (verification: OTPVerification) => Promise<void>;
  logout: () => Promise<void>;
  
  // Profile management
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  
  // Token management
  refreshTokens: () => Promise<void>;
  
  // Utility methods
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
}

// Initial authentication state
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Authentication reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case 'AUTH_LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };

    case 'AUTH_UPDATE_USER':
      return {
        ...state,
        user: action.payload,
        error: null,
      };

    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// Create authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * Manages global authentication state and provides auth methods to the entire application
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  // Initialize authentication state on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * Check current authentication status
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      dispatch({ type: 'AUTH_LOADING' });

      // Check if we have stored tokens
      const storedTokens = authService.getStoredTokens();
      
      if (!storedTokens || !authService.isAuthenticated()) {
        dispatch({ type: 'AUTH_LOGOUT' });
        return;
      }

      // Fetch current user profile
      const user = await authService.getCurrentUser();
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, tokens: storedTokens },
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  /**
   * OTP Authentication
   */
  const requestOTP = useCallback(async (request: OTPRequest): Promise<OTPStatusResponse> => {
    try {
      dispatch({ type: 'AUTH_LOADING' });

      const response = await authService.requestOTP(request);
      
      dispatch({ type: 'AUTH_CLEAR_ERROR' });
      return response;
    } catch (error) {
      const authError = error as ApiError;
      dispatch({
        type: 'AUTH_FAILURE',
        payload: authError.message || 'Failed to send OTP',
      });
      throw error;
    }
  }, []);

  const verifyOTP = useCallback(async (verification: OTPVerification) => {
    try {
      dispatch({ type: 'AUTH_LOADING' });

      const response = await authService.verifyOTP(verification);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          tokens: response.tokens,
        },
      });

      // Redirect to dashboard or previous page
      router.push('/');
    } catch (error) {
      const authError = error as ApiError;
      dispatch({
        type: 'AUTH_FAILURE',
        payload: authError.message || 'OTP verification failed',
      });
      throw error;
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
      router.push('/login');
    }
  }, [router]);

  /**
   * Profile Management
   */
  const updateProfile = useCallback(async (data: UpdateProfileRequest) => {
    try {
      const updatedUser = await authService.updateProfile(data);
      dispatch({ type: 'AUTH_UPDATE_USER', payload: updatedUser });
    } catch (error) {
      const authError = error as ApiError;
      dispatch({
        type: 'AUTH_FAILURE',
        payload: authError.message || 'Profile update failed',
      });
      throw error;
    }
  }, []);

  const uploadAvatar = useCallback(async (file: File): Promise<string> => {
    try {
      const avatarUrl = await authService.uploadAvatar(file);
      
      // Update user profile with new avatar
      if (state.user) {
        const updatedUser = { ...state.user, avatar: avatarUrl };
        dispatch({ type: 'AUTH_UPDATE_USER', payload: updatedUser });
      }
      
      return avatarUrl;
    } catch (error) {
      const authError = error as ApiError;
      dispatch({
        type: 'AUTH_FAILURE',
        payload: authError.message || 'Avatar upload failed',
      });
      throw error;
    }
  }, [state.user]);

  /**
   * Token Management
   */
  const refreshTokens = useCallback(async () => {
    try {
      const newTokens = await authService.refreshToken();
      
      if (state.user) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: state.user,
            tokens: newTokens,
          },
        });
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      dispatch({ type: 'AUTH_LOGOUT' });
      router.push('/login?message=session-expired');
    }
  }, [state.user, router]);

  /**
   * Utility Methods
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  }, []);

  // Context value
  const contextValue: AuthContextType = {
    ...state,
    requestOTP,
    verifyOTP,
    logout,
    updateProfile,
    uploadAvatar,
    refreshTokens,
    clearError,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 