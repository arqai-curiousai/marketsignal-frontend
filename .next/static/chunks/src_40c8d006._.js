(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/lib/api/config.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * API Configuration
 * Centralized configuration for all API calls
 */ __turbopack_context__.s({
    "API_CONFIG": (()=>API_CONFIG)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const API_CONFIG = {
    baseURL: ("TURBOPACK compile-time value", "http://localhost:8000/api/v1") || 'http://localhost:8000/api',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    endpoints: {
        chat: '/chat',
        sessions: '/sessions',
        sources: '/sources',
        auth: {
            'request-otp': '/auth/request-otp',
            'verify-otp': '/auth/verify-otp',
            logout: '/auth/logout',
            refresh: '/auth/refresh',
            profile: '/auth/profile',
            '2fa': {
                setup: '/auth/2fa/setup',
                verify: '/auth/2fa/verify',
                disable: '/auth/2fa/disable'
            },
            sessions: '/auth/sessions'
        },
        legal: {
            search: '/legal/search',
            cases: '/legal/cases',
            statutes: '/legal/statutes',
            policies: '/legal/policies'
        }
    },
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    // Authentication specific configuration
    auth: {
        tokenRefreshThreshold: 300,
        maxRetryAttempts: 3,
        lockoutDuration: 15 * 60 * 1000
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/lib/security/csrf.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "addCSRFHeader": (()=>addCSRFHeader),
    "generateCSRFToken": (()=>generateCSRFToken),
    "getCSRFToken": (()=>getCSRFToken),
    "setCSRFToken": (()=>setCSRFToken),
    "verifyCSRFToken": (()=>verifyCSRFToken)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$js$2d$cookie$2f$dist$2f$js$2e$cookie$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/js-cookie/dist/js.cookie.mjs [app-client] (ecmascript)");
;
/**
 * CSRF Protection utilities
 * Implements Double Submit Cookie pattern
 */ const CSRF_TOKEN_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
function generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte)=>byte.toString(16).padStart(2, '0')).join('');
}
function setCSRFToken() {
    const token = generateCSRFToken();
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$js$2d$cookie$2f$dist$2f$js$2e$cookie$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].set(CSRF_TOKEN_NAME, token, {
        secure: ("TURBOPACK compile-time value", "development") === 'production',
        sameSite: 'strict',
        path: '/'
    });
    return token;
}
function getCSRFToken() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$js$2d$cookie$2f$dist$2f$js$2e$cookie$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(CSRF_TOKEN_NAME);
}
function addCSRFHeader(headers = {}) {
    const token = getCSRFToken();
    if (token) {
        return {
            ...headers,
            [CSRF_HEADER_NAME]: token
        };
    }
    return headers;
}
function verifyCSRFToken(token) {
    if (!token) return false;
    const storedToken = getCSRFToken();
    if (!storedToken) return false;
    // Constant time comparison to prevent timing attacks
    return token.length === storedToken.length && token.split('').every((char, i)=>char === storedToken[i]);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/lib/api/client.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "api": (()=>api),
    "apiClient": (()=>apiClient),
    "apiRequest": (()=>apiRequest),
    "setAuthServiceInstance": (()=>setAuthServiceInstance)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api/config.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$security$2f$csrf$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/security/csrf.ts [app-client] (ecmascript)");
;
;
;
// Forward declaration to avoid circular dependency
let authServiceInstance = null;
function setAuthServiceInstance(instance) {
    authServiceInstance = instance;
}
/**
 * Create an Axios instance with secure defaults
 */ const createApiClient = ()=>{
    const client = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].create({
        baseURL: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_CONFIG"].baseURL,
        timeout: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_CONFIG"].timeout,
        headers: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_CONFIG"].headers,
        withCredentials: true
    });
    // Request interceptor for authentication and CSRF
    client.interceptors.request.use({
        "createApiClient.use": async (config)=>{
            // Add CSRF token to headers
            config.headers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$security$2f$csrf$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addCSRFHeader"])(config.headers);
            // Add auth token if available
            if (authServiceInstance) {
                const tokens = authServiceInstance.getStoredTokens();
                if (tokens && tokens.accessToken) {
                    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
                }
            }
            return config;
        }
    }["createApiClient.use"], {
        "createApiClient.use": (error)=>Promise.reject(error)
    }["createApiClient.use"]);
    // Response interceptor for error handling and token refresh
    client.interceptors.response.use({
        "createApiClient.use": (response)=>response
    }["createApiClient.use"], {
        "createApiClient.use": async (error)=>{
            const originalRequest = error.config;
            if (error.response) {
                // Handle specific status codes
                switch(error.response.status){
                    case 401:
                        // Token expired - try to refresh
                        if (!originalRequest._retry && authServiceInstance) {
                            originalRequest._retry = true;
                            try {
                                await authServiceInstance.refreshToken();
                                // Retry the original request with new token
                                const tokens = authServiceInstance.getStoredTokens();
                                if (tokens && tokens.accessToken) {
                                    originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
                                    return client(originalRequest);
                                }
                            } catch (refreshError) {
                                // Token refresh failed, redirect to login
                                if ("TURBOPACK compile-time truthy", 1) {
                                    window.location.href = '/login?message=session-expired';
                                }
                                return Promise.reject(refreshError);
                            }
                        } else {
                            // No auth service or retry already attempted, redirect to login
                            if ("TURBOPACK compile-time truthy", 1) {
                                window.location.href = '/login?message=session-expired';
                            }
                        }
                        break;
                    case 403:
                        // Forbidden - CSRF token might be invalid or insufficient permissions
                        console.error('Access forbidden:', error.response.data);
                        break;
                    case 429:
                        // Rate limit exceeded
                        const retryAfter = error.response.headers['retry-after'];
                        console.error(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
                        break;
                    case 422:
                        // Validation error
                        console.error('Validation error:', error.response.data);
                        break;
                    default:
                        if (error.response.status >= 500) {
                            console.error('Server error:', error.response.data);
                        }
                }
            }
            return Promise.reject(error);
        }
    }["createApiClient.use"]);
    return client;
};
const apiClient = createApiClient();
async function apiRequest(config) {
    try {
        const response = await apiClient.request(config);
        return response.data;
    } catch (error) {
        if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].isAxiosError(error) && error.response?.data) {
            throw error.response.data;
        }
        throw error;
    }
}
const api = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].create({
    baseURL: "/api",
    withCredentials: true
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/services/auth.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "AuthService": (()=>AuthService),
    "authService": (()=>authService)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api/config.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api/client.ts [app-client] (ecmascript)");
;
;
/**
 * Token Storage Management
 * Handles secure storage and retrieval of authentication tokens
 */ class TokenStorage {
    static ACCESS_TOKEN_KEY = 'auth_access_token';
    static REFRESH_TOKEN_KEY = 'auth_refresh_token';
    static TOKEN_EXPIRY_KEY = 'auth_token_expiry';
    static setTokens(tokens) {
        if ("TURBOPACK compile-time falsy", 0) {
            "TURBOPACK unreachable";
        }
        try {
            localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
            localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
            const expiryTime = Date.now() + tokens.expiresIn * 1000;
            localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
        } catch (error) {
            console.error('Failed to store tokens:', error);
        }
    }
    static getAccessToken() {
        if ("TURBOPACK compile-time falsy", 0) {
            "TURBOPACK unreachable";
        }
        return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }
    static getRefreshToken() {
        if ("TURBOPACK compile-time falsy", 0) {
            "TURBOPACK unreachable";
        }
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
    static getTokens() {
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
            tokenType: 'Bearer'
        };
    }
    static isTokenExpired() {
        if ("TURBOPACK compile-time falsy", 0) {
            "TURBOPACK unreachable";
        }
        const expiryStr = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
        if (!expiryStr) return true;
        return Date.now() >= parseInt(expiryStr);
    }
    static clearTokens() {
        if ("TURBOPACK compile-time falsy", 0) {
            "TURBOPACK unreachable";
        }
        localStorage.removeItem(this.ACCESS_TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    }
}
class AuthService {
    static instance;
    refreshPromise = null;
    constructor(){
        // Register this instance with the API client to enable token refresh
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setAuthServiceInstance"])(this);
    }
    static getInstance() {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }
    /**
   * OTP Authentication
   */ async requestOTP(data) {
        try {
            const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiRequest"])({
                method: 'POST',
                url: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_CONFIG"].endpoints.auth['request-otp'],
                data
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
    async verifyOTP(data) {
        const email = data.email.trim().toLowerCase();
        const otpCode = data.otpCode.trim();
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiRequest"])({
            method: 'POST',
            url: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_CONFIG"].endpoints.auth['verify-otp'],
            // ✅ send snake_case exactly as backend expects
            data: {
                email,
                otp_code: otpCode
            }
        }).then((resp)=>{
            TokenStorage.setTokens(resp.tokens);
            return resp;
        }).catch((error)=>{
            throw this.handleAuthError(error);
        });
    }
    async logout() {
        try {
            const refreshToken = TokenStorage.getRefreshToken();
            if (refreshToken) {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiRequest"])({
                    method: 'POST',
                    url: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_CONFIG"].endpoints.auth.logout,
                    data: {
                        refresh_token: refreshToken
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally{
            // Always clear local tokens
            TokenStorage.clearTokens();
        }
    }
    /**
   * Token Management
   */ async refreshToken() {
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
        } finally{
            this.refreshPromise = null;
        }
    }
    async performTokenRefresh(refreshToken) {
        const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiRequest"])({
            method: 'POST',
            url: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_CONFIG"].endpoints.auth.refresh,
            data: {
                refresh_token: refreshToken
            }
        });
        return response.tokens;
    }
    getStoredTokens() {
        return TokenStorage.getTokens();
    }
    isAuthenticated() {
        const tokens = TokenStorage.getTokens();
        return tokens !== null && !TokenStorage.isTokenExpired();
    }
    /**
   * User Profile Management
   */ async getCurrentUser() {
        return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiRequest"])({
            method: 'GET',
            url: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_CONFIG"].endpoints.auth.profile
        });
    }
    async updateProfile(data) {
        return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiRequest"])({
            method: 'PUT',
            url: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_CONFIG"].endpoints.auth.profile,
            data
        });
    }
    async uploadAvatar(file) {
        const formData = new FormData();
        formData.append('avatar', file);
        return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiRequest"])({
            method: 'POST',
            url: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_CONFIG"].endpoints.auth.profile}/avatar`,
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
    /**
   * Two-Factor Authentication
   */ async setupTwoFactor() {
        return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiRequest"])({
            method: 'POST',
            url: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_CONFIG"].endpoints.auth.profile}/2fa/setup`
        });
    }
    async verifyTwoFactor(data) {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiRequest"])({
            method: 'POST',
            url: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_CONFIG"].endpoints.auth.profile}/2fa/verify`,
            data
        });
    }
    async disableTwoFactor(code) {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiRequest"])({
            method: 'POST',
            url: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_CONFIG"].endpoints.auth.profile}/2fa/disable`,
            data: {
                code
            }
        });
    }
    /**
   * Session Management
   */ async getActiveSessions() {
        return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiRequest"])({
            method: 'GET',
            url: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_CONFIG"].endpoints.auth.profile}/sessions`
        });
    }
    async revokeSession(sessionId) {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiRequest"])({
            method: 'DELETE',
            url: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_CONFIG"].endpoints.auth.profile}/sessions/${sessionId}`
        });
    }
    async revokeAllSessions() {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiRequest"])({
            method: 'DELETE',
            url: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_CONFIG"].endpoints.auth.profile}/sessions`
        });
    }
    /**
   * Error Handling
   */ handleAuthError(error) {
        if (error?.response?.status === 401) {
            TokenStorage.clearTokens();
            return {
                message: 'Invalid credentials or session expired',
                status: 401,
                code: 'UNAUTHORIZED'
            };
        }
        if (error?.response?.status === 422) {
            return {
                message: 'Validation error',
                status: 422,
                code: 'VALIDATION_ERROR',
                details: error.response.data?.detail || {}
            };
        }
        return {
            message: error?.response?.data?.message || 'Authentication failed',
            status: error?.response?.status || 500,
            code: error?.response?.data?.code || 'AUTH_ERROR',
            details: error?.response?.data?.details || {}
        };
    }
}
const authService = AuthService.getInstance();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/contexts/AuthContext.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "AuthProvider": (()=>AuthProvider),
    "useAuth": (()=>useAuth)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/auth.service.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
// Initial authentication state
const initialState = {
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
};
// Authentication reducer
function authReducer(state, action) {
    switch(action.type){
        case 'AUTH_LOADING':
            return {
                ...state,
                isLoading: true,
                error: null
            };
        case 'AUTH_SUCCESS':
            return {
                ...state,
                user: action.payload.user,
                tokens: action.payload.tokens,
                isAuthenticated: true,
                isLoading: false,
                error: null
            };
        case 'AUTH_FAILURE':
            return {
                ...state,
                user: null,
                tokens: null,
                isAuthenticated: false,
                isLoading: false,
                error: action.payload
            };
        case 'AUTH_LOGOUT':
            return {
                ...initialState,
                isLoading: false
            };
        case 'AUTH_UPDATE_USER':
            return {
                ...state,
                user: action.payload,
                error: null
            };
        case 'AUTH_CLEAR_ERROR':
            return {
                ...state,
                error: null
            };
        default:
            return state;
    }
}
// Create authentication context
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function AuthProvider({ children }) {
    _s();
    const [state, dispatch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReducer"])(authReducer, initialState);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    // Initialize authentication state on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            checkAuthStatus();
        }
    }["AuthProvider.useEffect"], []);
    /**
   * Check current authentication status
   */ const checkAuthStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[checkAuthStatus]": async ()=>{
            try {
                dispatch({
                    type: 'AUTH_LOADING'
                });
                // Check if we have stored tokens
                const storedTokens = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authService"].getStoredTokens();
                if (!storedTokens || !__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authService"].isAuthenticated()) {
                    dispatch({
                        type: 'AUTH_LOGOUT'
                    });
                    return;
                }
                // Fetch current user profile
                const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authService"].getCurrentUser();
                dispatch({
                    type: 'AUTH_SUCCESS',
                    payload: {
                        user,
                        tokens: storedTokens
                    }
                });
            } catch (error) {
                console.error('Auth check failed:', error);
                dispatch({
                    type: 'AUTH_LOGOUT'
                });
            }
        }
    }["AuthProvider.useCallback[checkAuthStatus]"], []);
    /**
   * OTP Authentication
   */ const requestOTP = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[requestOTP]": async (request)=>{
            try {
                dispatch({
                    type: 'AUTH_LOADING'
                });
                const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authService"].requestOTP(request);
                dispatch({
                    type: 'AUTH_CLEAR_ERROR'
                });
                return response;
            } catch (error) {
                const authError = error;
                dispatch({
                    type: 'AUTH_FAILURE',
                    payload: authError.message || 'Failed to send OTP'
                });
                throw error;
            }
        }
    }["AuthProvider.useCallback[requestOTP]"], []);
    const verifyOTP = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[verifyOTP]": async (verification)=>{
            try {
                dispatch({
                    type: 'AUTH_LOADING'
                });
                const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authService"].verifyOTP(verification);
                dispatch({
                    type: 'AUTH_SUCCESS',
                    payload: {
                        user: response.user,
                        tokens: response.tokens
                    }
                });
                // Redirect to dashboard or previous page
                router.push('/');
            } catch (error) {
                const authError = error;
                dispatch({
                    type: 'AUTH_FAILURE',
                    payload: authError.message || 'OTP verification failed'
                });
                throw error;
            }
        }
    }["AuthProvider.useCallback[verifyOTP]"], [
        router
    ]);
    const logout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[logout]": async ()=>{
            try {
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authService"].logout();
            } catch (error) {
                console.error('Logout error:', error);
            } finally{
                dispatch({
                    type: 'AUTH_LOGOUT'
                });
                router.push('/login');
            }
        }
    }["AuthProvider.useCallback[logout]"], [
        router
    ]);
    /**
   * Profile Management
   */ const updateProfile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[updateProfile]": async (data)=>{
            try {
                const updatedUser = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authService"].updateProfile(data);
                dispatch({
                    type: 'AUTH_UPDATE_USER',
                    payload: updatedUser
                });
            } catch (error) {
                const authError = error;
                dispatch({
                    type: 'AUTH_FAILURE',
                    payload: authError.message || 'Profile update failed'
                });
                throw error;
            }
        }
    }["AuthProvider.useCallback[updateProfile]"], []);
    const uploadAvatar = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[uploadAvatar]": async (file)=>{
            try {
                const avatarUrl = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authService"].uploadAvatar(file);
                // Update user profile with new avatar
                if (state.user) {
                    const updatedUser = {
                        ...state.user,
                        avatar: avatarUrl
                    };
                    dispatch({
                        type: 'AUTH_UPDATE_USER',
                        payload: updatedUser
                    });
                }
                return avatarUrl;
            } catch (error) {
                const authError = error;
                dispatch({
                    type: 'AUTH_FAILURE',
                    payload: authError.message || 'Avatar upload failed'
                });
                throw error;
            }
        }
    }["AuthProvider.useCallback[uploadAvatar]"], [
        state.user
    ]);
    /**
   * Token Management
   */ const refreshTokens = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[refreshTokens]": async ()=>{
            try {
                const newTokens = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authService"].refreshToken();
                if (state.user) {
                    dispatch({
                        type: 'AUTH_SUCCESS',
                        payload: {
                            user: state.user,
                            tokens: newTokens
                        }
                    });
                }
            } catch (error) {
                console.error('Token refresh failed:', error);
                dispatch({
                    type: 'AUTH_LOGOUT'
                });
                router.push('/login?message=session-expired');
            }
        }
    }["AuthProvider.useCallback[refreshTokens]"], [
        state.user,
        router
    ]);
    /**
   * Utility Methods
   */ const clearError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[clearError]": ()=>{
            dispatch({
                type: 'AUTH_CLEAR_ERROR'
            });
        }
    }["AuthProvider.useCallback[clearError]"], []);
    // Context value
    const contextValue = {
        ...state,
        requestOTP,
        verifyOTP,
        logout,
        updateProfile,
        uploadAvatar,
        refreshTokens,
        clearError,
        checkAuthStatus
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: contextValue,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/contexts/AuthContext.tsx",
        lineNumber: 296,
        columnNumber: 5
    }, this);
}
_s(AuthProvider, "XHTSFT9voGASQ7ZK6SG6d/gHfBs=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = AuthProvider;
function useAuth() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_40c8d006._.js.map