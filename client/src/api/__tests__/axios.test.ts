import { http, HttpResponse } from 'msw';
import { server } from '../../test/setup';
import { http as axiosHttp, getToken, setToken, clearToken } from '../axios';

const BASE = '/api';

afterEach(() => {
  clearToken();
});

describe('axios interceptors', () => {
  describe('request interceptor', () => {
    it('attaches Authorization header when token is in localStorage', async () => {
      let capturedAuth: string | null = null;

      server.use(
        http.get(`${BASE}/test-auth`, ({ request }) => {
          capturedAuth = request.headers.get('Authorization');
          return HttpResponse.json({ ok: true });
        })
      );

      setToken('test-token-123');
      await axiosHttp.get('/test-auth');
      expect(capturedAuth).toBe('Bearer test-token-123');
    });

    it('does not attach Authorization header when no token', async () => {
      let capturedAuth: string | null = 'sentinel';

      server.use(
        http.get(`${BASE}/test-noauth`, ({ request }) => {
          capturedAuth = request.headers.get('Authorization');
          return HttpResponse.json({ ok: true });
        })
      );

      clearToken();
      await axiosHttp.get('/test-noauth');
      expect(capturedAuth).toBeNull();
    });
  });

  describe('response interceptor', () => {
    it('normalizes non-2xx to ApiError with code, message, status', async () => {
      server.use(
        http.get(`${BASE}/test-error`, () =>
          HttpResponse.json({ code: 'NOT_FOUND', message: 'Gone' }, { status: 404 })
        )
      );

      try {
        await axiosHttp.get('/test-error');
        throw new Error('should have thrown');
      } catch (e: unknown) {
        const err = e as { code: string; status: number; message: string };
        expect(err.code).toBe('NOT_FOUND');
        expect(err.status).toBe(404);
        expect(err.message).toBe('Gone');
      }
    });

    it('dispatches sbs:logout CustomEvent on 401 and clears token', async () => {
      server.use(
        http.get(`${BASE}/test-401`, () =>
          HttpResponse.json({ code: 'UNAUTHENTICATED', message: 'Not logged in' }, { status: 401 })
        )
      );

      setToken('some-token');
      const logoutFired = new Promise<boolean>((resolve) => {
        window.addEventListener('sbs:logout', () => resolve(true), { once: true });
      });

      try {
        await axiosHttp.get('/test-401');
      } catch {
        // expected
      }

      await expect(logoutFired).resolves.toBe(true);
      expect(getToken()).toBeNull();
    });

    it('maps VALIDATION_ERROR with fieldErrors', async () => {
      server.use(
        http.post(`${BASE}/test-validation`, () =>
          HttpResponse.json(
            { code: 'VALIDATION_ERROR', message: 'Bad input', fieldErrors: { email: 'Invalid' } },
            { status: 400 }
          )
        )
      );

      try {
        await axiosHttp.post('/test-validation', {});
        throw new Error('should have thrown');
      } catch (e: unknown) {
        const err = e as { code: string; fieldErrors: Record<string, string> };
        expect(err.code).toBe('VALIDATION_ERROR');
        expect(err.fieldErrors?.email).toBe('Invalid');
      }
    });
  });
});
