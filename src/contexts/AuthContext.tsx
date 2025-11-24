'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
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

/**
 * ---- Helpers: normalize backend user to app User shape ----
 * Some APIs may return avatar as { avatarUrl: string } (or null/undefined).
 * We keep the app contract strictly as avatar: string.
 */

type MaybeAvatar = string | { avatarUrl?: string | null } | null | undefined;

// Backend user may not strictly match our User; avoid intersecting with User here.
type BackendUser = Omit<User, 'avatar'> & { avatar?: MaybeAvatar } & Record<string, any>;

function extractAvatar(avatar: unknown): string {
  if (typeof avatar === 'string') return avatar;
  if (avatar && typeof avatar === 'object' && 'avatarUrl' in (avatar as object)) {
    const v = (avatar as { avatarUrl?: unknown }).avatarUrl;
    return typeof v === 'string' ? v : '';
  }
  return '';
}

function normalizeUser(u: BackendUser): User {
  const { avatar: rawAvatar, ...rest } = u;
  const avatar = extractAvatar(rawAvatar);
  return { ...(rest as Omit<User, 'avatar'>), avatar };
}

// ----------------- Auth Actions -----------------
type AuthAction =
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; tokens: AuthTokens } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_UPDATE_USER'; payload: User }
  | { type: 'AUTH_CLEAR_ERROR' };

// ----------------- Context Types -----------------
interface AuthContextType extends AuthState {
  // OTP Authentication
  requestOTP: (request: OTPRequest) => Promise<OTPStatusResponse>;
  verifyOTP: (verification: OTPVerification) => Promise<void>;
  logout: () => Promise<void>;

  // Profile
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;

  // Tokens
  refreshTokens: () => Promise<void>;

  // Utils
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
}

// ----------------- Initial State -----------------
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// ----------------- Reducer -----------------
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, isLoading: true, error: null };

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
      return { ...initialState, isLoading: false };

    case 'AUTH_UPDATE_USER':
      return { ...state, user: action.payload, error: null };

    case 'AUTH_CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}

// ----------------- Context -----------------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// ----------------- Provider -----------------
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  /**
   * Check current authentication status
   * (defined BEFORE useEffect so we can safely include it in deps)
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      dispatch({ type: 'AUTH_LOADING' });

      const storedTokens = authService.getStoredTokens();

      if (!storedTokens || !authService.isAuthenticated()) {
        dispatch({ type: 'AUTH_LOGOUT' });
        return;
      }

      // Normalize backend shape -> app User
      const rawUser = (await authService.getCurrentUser()) as BackendUser;
      const user = normalizeUser(rawUser);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, tokens: storedTokens },
      });
    } catch (error: any) {
      if (error?.status !== 401 && error?.response?.status !== 401) {
        console.error('Auth check failed:', error);
      }
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  // Initialize authentication state on mount
  useEffect(() => {
    void checkAuthStatus();
  }, [checkAuthStatus]);

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
      const user = normalizeUser(response.user as BackendUser);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, tokens: response.tokens },
      });
    } catch (error) {
      const authError = error as ApiError;
      dispatch({
        type: 'AUTH_FAILURE',
        payload: authError.message || 'OTP verification failed',
      });
      throw error;
    }
  }, []);

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
      const rawUser = (await authService.updateProfile(data)) as BackendUser;
      const updatedUser = normalizeUser(rawUser);
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
      // Service may return a string OR an object { avatarUrl: string }
      const uploaded = (await authService.uploadAvatar(file)) as unknown;
      const avatarUrl = extractAvatar(uploaded); // normalize to string

      // Update user profile with new avatar (string)
      if (state.user) {
        const updatedUser: User = { ...state.user, avatar: avatarUrl };
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
            user: state.user, // already normalized
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
   * Utility
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

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// ----------------- Hook -----------------
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
