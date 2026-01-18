// Stub auth store for bhcm-ui components
import { create } from 'zustand';
import { apiClient, type ApiClient } from '../api/apiClient.js';

declare const window: any;

interface User {
    id: string;
    username: string;
    email: string;
    displayName?: string;
    bio?: string;
    timezone?: string;
    avatar?: string;
    createdAt: number;
    lastLogin: number;
}

interface Preferences {
    theme: 'light' | 'dark' | 'system';
    language: 'en-US' | 'en-US';
    quoteAsset: 'USD' | 'BTC';
}

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    preferences: Preferences;
}

interface AuthActions {
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    loginWithRedirect: () => void;
    handleCallback: (code: string) => Promise<boolean>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => void;
    updateAvatar: (avatar: string) => void;
    updatePreferences: (prefs: Partial<Preferences>) => void;
    changePassword: (oldPw: string, newPw: string) => { success: boolean; error?: string };
}

const AUTH_STORAGE_KEY = 'bhcm.authenticated';
const ACCESS_TOKEN_KEY = 'bhcm.accessToken';

const getInitialAuth = () => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(AUTH_STORAGE_KEY) === '1' || !!localStorage.getItem(ACCESS_TOKEN_KEY);
};

const mockUser: User = {
    id: 'demo-user',
    username: 'demo',
    email: 'demo@bhcm.dev',
    displayName: 'Demo User',
    createdAt: Date.now() - 86400000 * 30,
    lastLogin: Date.now(),
};

const defaultPreferences: Preferences = {
    theme: 'dark',
    language: 'en-US',
    quoteAsset: 'USD',
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
    isAuthenticated: getInitialAuth(),
    user: getInitialAuth() ? mockUser : null,
    preferences: defaultPreferences,

    login: async (username, password) => {
        try {
            const response = await apiClient.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', { email: username, password }); // changed to email as per auth service
            if (typeof window !== 'undefined') {
                localStorage.setItem(AUTH_STORAGE_KEY, '1');
                localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
            }
            set({ isAuthenticated: true, user: response.user });
            return { success: true };
        } catch (_) {
            // Fallback to demo logic only if using demo credentials
            if (username === 'demo' && password === 'demo') {
                const token = typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null;
                if (typeof window !== 'undefined') {
                    if (typeof window !== 'undefined') {
                        window.localStorage.removeItem('auth_token');
                    }
                }
                if (typeof window !== 'undefined') localStorage.setItem(AUTH_STORAGE_KEY, '1');
                set({ isAuthenticated: true, user: { ...mockUser, username: username || mockUser.username, lastLogin: Date.now() } });
                return { success: true };
            }
            return { success: false, error: 'Authentication failed' };
        }
    },

    loginWithRedirect: () => {
        if (typeof window === 'undefined') return;
        // Use auth URL from env, fallback to localhost:5000
        const AUTH_APP_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:5000';
        const returnTo = `${window.location.origin}/auth/callback`;
        window.location.href = `${AUTH_APP_URL}/login?returnTo=${encodeURIComponent(returnTo)}`;
    },

    handleCallback: async (code: string) => {
        try {
            const response = await apiClient.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/exchange', { code });

            if (typeof window !== 'undefined') {
                localStorage.setItem(AUTH_STORAGE_KEY, '1');
                localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
            }

            set({ isAuthenticated: true, user: response.user });
            return true;
        } catch (error) {
            console.error('Auth callback failed:', error);
            return false;
        }
    },

    logout: () => {
        if (typeof window !== 'undefined') localStorage.removeItem(AUTH_STORAGE_KEY);
        set({ isAuthenticated: false, user: null });
    },

    updateProfile: (data) => {
        set((state) => ({
            user: state.user ? { ...state.user, ...data } : null,
        }));
    },

    updateAvatar: (avatar) => {
        set((state) => ({
            user: state.user ? { ...state.user, avatar } : null,
        }));
    },

    updatePreferences: (prefs) => {
        set((state) => ({
            preferences: { ...state.preferences, ...prefs },
        }));
    },

    changePassword: (oldPw, newPw) => {
        if (oldPw !== 'demo') {
            return { success: false, error: 'incorrectPassword' };
        }
        return { success: true };
    },
}));
