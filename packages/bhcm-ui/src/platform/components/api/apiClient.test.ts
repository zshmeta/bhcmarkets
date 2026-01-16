import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from './apiClient';

describe('ApiClient', () => {
  const originalFetch = global.fetch;
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should make a GET request with correct headers and base URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    vi.mocked(localStorage.getItem).mockReturnValue('mock-token');

    const response = await apiClient.get('/test-endpoint');

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/test-endpoint');
    expect(init.method).toBe('GET');
    // @ts-ignore
    expect(init.headers.get('Authorization')).toBe('Bearer mock-token');
    // @ts-ignore
    expect(init.headers.get('Content-Type')).toBe('application/json');

    expect(response).toEqual({ success: true });
  });

  it('should handle POST requests with body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1 }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    vi.mocked(localStorage.getItem).mockReturnValue('mock-token');

    const payload = { name: 'test' };
    await apiClient.post('/create', payload);

    expect(mockFetch).toHaveBeenCalledWith('/api/create', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload),
    }));
  });

  it('should throw error on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ message: 'Invalid input' }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    await expect(apiClient.get('/error')).rejects.toThrow('Invalid input');
  });
  
  it('should not add Authorization header if token is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });
  
      vi.mocked(localStorage.getItem).mockReturnValue(null);
  
      await apiClient.get('/public');
  
      expect(mockFetch).toHaveBeenCalledWith('/api/public', expect.objectContaining({
        headers: expect.not.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
        })
      }));
  });
});
