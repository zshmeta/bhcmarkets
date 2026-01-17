// Stub auth store for bhcm-ui components
import { create } from 'zustand';
import { apiClient } from '../../../../packages/bhcm-ui/src/platform/components/api/apiClient';

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
    quoteAsset: 'USDT' | 'BTC';
}

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    preferences: Preferences;
}

interface AuthActions {
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
    quoteAsset: 'USDT',
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
    isAuthenticated: getInitialAuth(),
    user: getInitialAuth() ? mockUser : null,
    preferences: defaultPreferences,

    login: async (username, password) => {
        try {
            const response = await apiClient.post<{ user: User; accessToken: string }>('/auth/login', { username, password });
            if (typeof window !== 'undefined') {
                localStorage.setItem(AUTH_STORAGE_KEY, '1');
                localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
            }
            set({ isAuthenticated: true, user: response.user });
            return { success: true };
        } catch (_) {
            // Fallback to demo logic only if using demo credentials
            if (username === 'demo' && password === 'demo') {
                if (typeof window !== 'undefined') localStorage.setItem(AUTH_STORAGE_KEY, '1');
                set({ isAuthenticated: true, user: { ...mockUser, username: username || mockUser.username, lastLogin: Date.now() } });
                return { success: true };
            }
            return { success: false, error: 'Authentication failed' };
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
