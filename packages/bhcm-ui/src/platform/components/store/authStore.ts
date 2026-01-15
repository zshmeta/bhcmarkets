// Stub auth store for bhcm-ui components
import { create } from 'zustand';

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
    language: 'en-US' | 'zh-CN';
    quoteAsset: 'USDT' | 'BTC';
}

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    preferences: Preferences;
}

interface AuthActions {
    login: (username: string, password: string) => { success: boolean };
    logout: () => void;
    updateProfile: (data: Partial<User>) => void;
    updateAvatar: (avatar: string) => void;
    updatePreferences: (prefs: Partial<Preferences>) => void;
    changePassword: (oldPw: string, newPw: string) => { success: boolean; error?: string };
}

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
    isAuthenticated: true, // Auto-authenticated for demo
    user: mockUser,
    preferences: defaultPreferences,

    login: (username, password) => {
        set({ isAuthenticated: true, user: mockUser });
        return { success: true };
    },

    logout: () => {
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
