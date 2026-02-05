export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    sources?: LegalSource[];
    confidence?: number;
    processingTime?: number;
  };
}

export interface LegalSource {
  id: string;
  title: string;
  type: 'case' | 'statute' | 'regulation' | 'article' | 'opinion';
  citation?: string;
  url?: string;
  relevanceScore?: number;
  excerpt?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    category?: string;
    tags?: string[];
  };
}

// Enhanced User interface for authentication
export interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'lawyer' | 'admin';
  avatar?: string;
  phone?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    dataCollection: boolean;
  };
}

// Authentication Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface OTPRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface OTPVerification {
  email: string;
  otpCode: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  message: string;
  isNewUser: boolean;
}

export interface OTPStatusResponse {
  success: boolean;
  message: string;
  expiresIn: number;
  canResendIn: number;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  preferences?: Partial<UserPreferences>;
}

// Authentication State
export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// API Error Types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ValidationError extends ApiError {
  fieldErrors: Record<string, string[]>;
}

// Session Management
export interface SessionInfo {
  id: string;
  userId: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    location?: string;
  };
  createdAt: Date;
  lastActivityAt: Date;
  isActive: boolean;
}

// Two-Factor Authentication
export interface TwoFactorSetup {
  secretKey: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  code: string;
  userId: string;
}

// Email Verification
export interface EmailVerificationRequest {
  email: string;
}

export interface EmailVerificationConfirm {
  token: string;
  email: string;
} 