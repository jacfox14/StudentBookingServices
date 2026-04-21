import express, { type Request, type Response } from 'express';
import request from 'supertest';
import { requireAuth } from '../../middleware/requireAuth.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import { signToken } from '../../utils/jwt.js';
import { User } from '../../models/User.js';

jest.mock('../../models/User.js', () => ({
  User: { findByPk: jest.fn() },
}));

const mockedFindByPk = User.findByPk as jest.Mock;

function makeApp() {
  const app = express();
  app.get('/protected', requireAuth, (_req: Request, res: Response) => {
    res.json({ userId: (_req as never as { user: { id: number } }).user.id });
  });
  app.use(errorHandler);
  return app;
}

const validPayload = { sub: 99, role: 'student' as const, email: 'test@wsu.edu' };

describe('requireAuth middleware', () => {
  afterEach(() => jest.clearAllMocks());

  it('passes when Authorization header has valid token and user exists', async () => {
    const token = signToken(validPayload);
    mockedFindByPk.mockResolvedValue({ id: 99, isBanned: false });

    const res = await request(makeApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(99);
  });

  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(makeApp()).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 when header is not a Bearer token', async () => {
    const res = await request(makeApp()).get('/protected').set('Authorization', 'Basic abc');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 when token signature is invalid', async () => {
    const res = await request(makeApp()).get('/protected').set('Authorization', 'Bearer bad.token.here');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 when user no longer exists in DB', async () => {
    const token = signToken(validPayload);
    mockedFindByPk.mockResolvedValue(null);

    const res = await request(makeApp()).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 when user is banned', async () => {
    const token = signToken(validPayload);
    mockedFindByPk.mockResolvedValue({ id: 99, isBanned: true });

    const res = await request(makeApp()).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });
});
