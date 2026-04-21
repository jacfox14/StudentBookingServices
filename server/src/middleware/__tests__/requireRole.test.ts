import express, { type Request, type Response } from 'express';
import request from 'supertest';
import { requireRole } from '../../middleware/requireRole.js';
import { errorHandler } from '../../middleware/errorHandler.js';

function makeApp(roles: ('student' | 'staff' | 'admin')[]) {
  const app = express();
  // Inject a fake req.user without going through requireAuth
  app.use((req: Request, _res: Response, next) => {
    const roleHeader = req.headers['x-test-role'] as string | undefined;
    if (roleHeader) {
      (req as never as { user: { id: number; role: string } }).user = { id: 1, role: roleHeader };
    }
    next();
  });
  app.get('/guarded', requireRole(...roles), (_req, res) => res.json({ ok: true }));
  app.use(errorHandler);
  return app;
}

describe('requireRole middleware', () => {
  it('allows a user with the correct role', async () => {
    const res = await request(makeApp(['admin'])).get('/guarded').set('x-test-role', 'admin');
    expect(res.status).toBe(200);
  });

  it('allows any matching role from a list', async () => {
    const app = makeApp(['staff', 'admin']);
    expect((await request(app).get('/guarded').set('x-test-role', 'staff')).status).toBe(200);
    expect((await request(app).get('/guarded').set('x-test-role', 'admin')).status).toBe(200);
  });

  it('returns 403 when the user role is not in the allowed list', async () => {
    const res = await request(makeApp(['admin'])).get('/guarded').set('x-test-role', 'student');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('returns 401 when req.user is not set (no auth)', async () => {
    const app = makeApp(['admin']);
    // Send with no x-test-role header so middleware adds no user
    const res = await request(app).get('/guarded');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });
});
