/**
 * Email Worker Tests
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SELF, env } from 'cloudflare:test';

describe('Email Worker', () => {
  describe('Health Check', () => {
    it('should return 200 on GET /health', async () => {
      const response = await SELF.fetch('https://example.com/health');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.service).toBe('email-worker');
    });

    it('should return 200 on GET /', async () => {
      const response = await SELF.fetch('https://example.com/');
      expect(response.status).toBe(200);
    });
  });

  describe('Authentication', () => {
    it('should return 401 without API key', async () => {
      const response = await SELF.fetch('https://example.com/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'welcome',
          to: 'test@example.com',
          userId: 'USR_001',
          emailRef: 'test_ref',
          payload: {},
        }),
      });

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid API key', async () => {
      const response = await SELF.fetch('https://example.com/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'invalid-key',
        },
        body: JSON.stringify({
          type: 'welcome',
          to: 'test@example.com',
          userId: 'USR_001',
          emailRef: 'test_ref',
          payload: {},
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Request Validation', () => {
    const validHeaders = {
      'Content-Type': 'application/json',
      'X-API-Key': env.API_KEY || 'test-api-key',
    };

    it('should return 400 for invalid JSON', async () => {
      const response = await SELF.fetch('https://example.com/send-email', {
        method: 'POST',
        headers: validHeaders,
        body: 'not json',
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing type', async () => {
      const response = await SELF.fetch('https://example.com/send-email', {
        method: 'POST',
        headers: validHeaders,
        body: JSON.stringify({
          to: 'test@example.com',
          userId: 'USR_001',
          emailRef: 'test_ref',
          payload: {},
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('type');
    });

    it('should return 400 for invalid email type', async () => {
      const response = await SELF.fetch('https://example.com/send-email', {
        method: 'POST',
        headers: validHeaders,
        body: JSON.stringify({
          type: 'invalid_type',
          to: 'test@example.com',
          userId: 'USR_001',
          emailRef: 'test_ref',
          payload: {},
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid email type');
    });

    it('should return 400 for invalid email address', async () => {
      const response = await SELF.fetch('https://example.com/send-email', {
        method: 'POST',
        headers: validHeaders,
        body: JSON.stringify({
          type: 'welcome',
          to: 'invalid-email',
          userId: 'USR_001',
          emailRef: 'test_ref',
          payload: {},
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('email');
    });

    it('should return 400 for missing emailRef', async () => {
      const response = await SELF.fetch('https://example.com/send-email', {
        method: 'POST',
        headers: validHeaders,
        body: JSON.stringify({
          type: 'welcome',
          to: 'test@example.com',
          userId: 'USR_001',
          payload: {},
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('emailRef');
    });

    it('should return 400 for 2fa without code', async () => {
      const response = await SELF.fetch('https://example.com/send-email', {
        method: 'POST',
        headers: validHeaders,
        body: JSON.stringify({
          type: '2fa',
          to: 'test@example.com',
          userId: 'USR_001',
          emailRef: 'test_ref',
          payload: {},
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('code');
    });
  });

  describe('Method Handling', () => {
    it('should return 405 for GET on /send-email', async () => {
      const response = await SELF.fetch('https://example.com/send-email', {
        method: 'GET',
      });

      expect(response.status).toBe(405);
    });

    it('should return 405 for POST on /health', async () => {
      const response = await SELF.fetch('https://example.com/health', {
        method: 'POST',
      });

      expect(response.status).toBe(405);
    });

    it('should handle OPTIONS for CORS preflight', async () => {
      const response = await SELF.fetch('https://example.com/send-email', {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });

  describe('404 Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await SELF.fetch('https://example.com/unknown-route');
      expect(response.status).toBe(404);
    });
  });
});
