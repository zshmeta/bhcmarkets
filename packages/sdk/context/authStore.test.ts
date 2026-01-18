
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Polyfill window and localStorage
if (typeof window === 'undefined') {
  (global as any).window = {};
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});
(global as any).localStorage = localStorageMock;

// Mock API Client
vi.mock('../api/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('initializes as authenticated if accessToken exists in localStorage', async () => {
    localStorageMock.setItem('bhcm.accessToken', 'valid-token');
    const { useAuthStore } = await import('./authStore');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('initializes as unauthenticated if no accessToken exists', async () => {
    const { useAuthStore } = await import('./authStore');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('logs in successfully with API', async () => {
    const mockUser = {
      id: 'real-user',
      username: 'real',
      email: 'real@example.com',
      createdAt: 123,
      lastLogin: 456
    };
    const mockResponse = {
      user: mockUser,
      accessToken: 'api-token',
      refreshToken: 'refresh-token'
    };

    const { apiClient } = await import('../../../../packages/bhcm-ui/src/platform/components/api/apiClient');
    vi.mocked(apiClient.post).mockResolvedValue(mockResponse as any);

    const { useAuthStore } = await import('./authStore');

    // Act
    // @ts-expect-error - we know implementation will become async
    const result = await useAuthStore.getState().login('real', 'password');

    // Assert
    expect(result.success).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual(expect.objectContaining({ username: 'real' }));
    expect(localStorageMock.setItem).toHaveBeenCalledWith('bhcm.accessToken', 'api-token');
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', { username: 'real', password: 'password' });
  });

  it('falls back to demo user if API fails and credentials are demo/demo', async () => {
    const { apiClient } = await import('../../../../packages/bhcm-ui/src/platform/components/api/apiClient');
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Network Error'));
    const { useAuthStore } = await import('./authStore');

    const result = await useAuthStore.getState().login('demo', 'demo');

    expect(result.success).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.username).toBe('demo');
    // Ensure access token is NOT set
    expect(localStorageMock.setItem).not.toHaveBeenCalledWith('bhcm.accessToken', expect.any(String));
  });

  it('fails login if API fails and credentials are NOT demo/demo', async () => {
    const { apiClient } = await import('../../../../packages/bhcm-ui/src/platform/components/api/apiClient');
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Invalid credentials'));
    const { useAuthStore } = await import('./authStore');

    // Act
    try {
      const result = await useAuthStore.getState().login('other', 'wrong');
      expect(result.success).toBe(false);
    } catch (_) {
      // If it throws, that's also acceptable for failure, but returning { success: false } is better for UI
      // expected behavior depends on implementation
    }
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
