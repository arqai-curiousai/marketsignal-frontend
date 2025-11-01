import { API_CONFIG } from '@/lib/api/config';
import { apiRequest, setAuthServiceInstance } from '@/lib/api/client';
import {
  User,
  AuthTokens,
  AuthResponse,
  UpdateProfileRequest,
  TwoFactorSetup,
  TwoFactorVerification,
  SessionInfo,
  ApiError,
  OTPRequest,
  OTPVerification,
  OTPStatusResponse,
} from '@/lib/types';

/**
 * Token Storage Management
 * Handles secure storage and retrieval of authentication tokens
 */
class TokenStorage {
  private static readonly ACCESS_TOKEN_KEY = 'auth_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';
  private static readonly TOKEN_EXPIRY_KEY = 'auth_token_expiry';

  static setTokens(tokens: AuthTokens): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
      
      const expiryTime = Date.now() + (tokens.expiresIn * 1000);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static getTokens(): AuthTokens | null {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    const expiryStr = localStorage.getItem(this.TOKEN_EXPIRY_KEY);

    if (!accessToken || !refreshToken || !expiryStr) {
      return null;
    }

    const expiresIn = Math.max(0, (parseInt(expiryStr) - Date.now()) / 1000);

    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer',
    };
  }

  static isTokenExpired(): boolean {
    if (typeof window === 'undefined') return true;
    
    const expiryStr = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiryStr) return true;

    return Date.now() >= parseInt(expiryStr);
  }

  static clearTokens(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }
}

/**
 * Authentication Service
 * Handles all authentication-related API operations
 * Single Responsibility: Managing user authentication and authorization
 */
export class AuthService {
  private static instance: AuthService;
  private refreshPromise: Promise<AuthTokens> | null = null;

  private constructor() {
    // Register this instance with the API client to enable token refresh
    setAuthServiceInstance(this);
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * OTP Authentication
   */
  async requestOTP(data: OTPRequest): Promise<OTPStatusResponse> {
    try {
      const response = await apiRequest<OTPStatusResponse>({
        method: 'POST',
        url: API_CONFIG.endpoints.auth['request-otp'],
        data,
      });

      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // async verifyOTP(data: OTPVerification): Promise<AuthResponse> {
  //   try {
  //     const response = await apiRequest<AuthResponse>({
  //       method: 'POST',
  //       url: API_CONFIG.endpoints.auth['verify-otp'],
  //       // data,
  //       data: { email: data.email, otp_code: data.otpCode} as any,
  //     });

  //     // Store tokens securely
  //     // TokenStorage.setTokens(response.tokens);

  //     return response;
  //   } catch (error) {
  //     throw this.handleAuthError(error);
  //   }
  // }

  async verifyOTP(data: OTPVerification): Promise<AuthResponse> {
    const email = data.email.trim().toLowerCase();
    const otpCode = data.otpCode.trim();
    return apiRequest<AuthResponse>({
      method: 'POST',
      url: API_CONFIG.endpoints.auth['verify-otp'],
      // ✅ send snake_case exactly as backend expects
      data: { email, otp_code: otpCode },
    }).then((resp) => {
      TokenStorage.setTokens(resp.tokens);
      return resp;
    }).catch((error) => { throw this.handleAuthError(error); });
  }
  

  async logout(): Promise<void> {
    try {
      const refreshToken = TokenStorage.getRefreshToken();
      
      if (refreshToken) {
        await apiRequest({
          method: 'POST',
          url: API_CONFIG.endpoints.auth.logout,
          data: { refresh_token: refreshToken },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local tokens
      TokenStorage.clearTokens();
    }
  }

  /**
   * Token Management
   */
  async refreshToken(): Promise<AuthTokens> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = TokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = this.performTokenRefresh(refreshToken);

    try {
      const tokens = await this.refreshPromise;
      TokenStorage.setTokens(tokens);
      return tokens;
    } catch (error) {
      TokenStorage.clearTokens();
      throw error;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(refreshToken: string): Promise<AuthTokens> {
    const response = await apiRequest<{ tokens: AuthTokens }>({
      method: 'POST',
      url: API_CONFIG.endpoints.auth.refresh,
      data: { refresh_token: refreshToken },
    });

    return response.tokens;
  }

  getStoredTokens(): AuthTokens | null {
    return TokenStorage.getTokens();
  }

  isAuthenticated(): boolean {
    const tokens = TokenStorage.getTokens();
    return tokens !== null && !TokenStorage.isTokenExpired();
  }

  /**
   * User Profile Management
   */
  async getCurrentUser(): Promise<User> {
    return await apiRequest<User>({
      method: 'GET',
      url: API_CONFIG.endpoints.auth.profile,
    });
  }

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    return await apiRequest<User>({
      method: 'PUT',
      url: API_CONFIG.endpoints.auth.profile,
      data,
    });
  }

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    return await apiRequest<{ avatarUrl: string }>({
      method: 'POST',
      url: `${API_CONFIG.endpoints.auth.profile}/avatar`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }



  /**
   * Two-Factor Authentication
   */
  async setupTwoFactor(): Promise<TwoFactorSetup> {
    return await apiRequest<TwoFactorSetup>({
      method: 'POST',
      url: `${API_CONFIG.endpoints.auth.profile}/2fa/setup`,
    });
  }

  async verifyTwoFactor(data: TwoFactorVerification): Promise<void> {
    await apiRequest({
      method: 'POST',
      url: `${API_CONFIG.endpoints.auth.profile}/2fa/verify`,
      data,
    });
  }

  async disableTwoFactor(code: string): Promise<void> {
    await apiRequest({
      method: 'POST',
      url: `${API_CONFIG.endpoints.auth.profile}/2fa/disable`,
      data: { code },
    });
  }

  /**
   * Session Management
   */
  async getActiveSessions(): Promise<SessionInfo[]> {
    return await apiRequest<SessionInfo[]>({
      method: 'GET',
      url: `${API_CONFIG.endpoints.auth.profile}/sessions`,
    });
  }

  async revokeSession(sessionId: string): Promise<void> {
    await apiRequest({
      method: 'DELETE',
      url: `${API_CONFIG.endpoints.auth.profile}/sessions/${sessionId}`,
    });
  }

  async revokeAllSessions(): Promise<void> {
    await apiRequest({
      method: 'DELETE',
      url: `${API_CONFIG.endpoints.auth.profile}/sessions`,
    });
  }



  /**
   * Error Handling
   */
  private handleAuthError(error: any): ApiError {
    if (error?.response?.status === 401) {
      TokenStorage.clearTokens();
      return {
        message: 'Invalid credentials or session expired',
        status: 401,
        code: 'UNAUTHORIZED',
      };
    }

    if (error?.response?.status === 422) {
      return {
        message: 'Validation error',
        status: 422,
        code: 'VALIDATION_ERROR',
        details: error.response.data?.detail || {},
      };
    }

    return {
      message: error?.response?.data?.message || 'Authentication failed',
      status: error?.response?.status || 500,
      code: error?.response?.data?.code || 'AUTH_ERROR',
      details: error?.response?.data?.details || {},
    };
  }
}

// Export singleton instance
export const authService = AuthService.getInstance(); 