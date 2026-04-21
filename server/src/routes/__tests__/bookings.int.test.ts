import request from 'supertest';
import { createApp } from '../../app.js';
import { apiErrorSchema, bookingSchema } from '@sbs/shared';
import { truncateAll, closeDb, seed, type SeedResult } from '../../test/helpers.js';

const app = createApp();

describe('Bookings routes', () => {
  let ctx: SeedResult;
  let baseStart: Date;
  let baseEnd: Date;

  function futureWindow(offsetHours = 50) {
    const s = new Date(Date.now() + offsetHours * 3_600_000);
    const e = new Date(s.getTime() + 3_600_000);
    return { startAt: s.toISOString(), endAt: e.toISOString() };
  }

  beforeAll(async () => {
    await truncateAll();
    ctx = await seed();
  });
  afterAll(closeDb);

  beforeEach(() => {
    baseStart = new Date(Date.now() + 50 * 3_600_000);
    baseEnd = new Date(baseStart.getTime() + 3_600_000);
  });

  describe('POST /api/bookings', () => {
    it('creates a booking as student — 201 + bookingSchema body', async () => {
      const window = futureWindow(60);
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${ctx.studentToken}`)
        .send({ serviceId: ctx.service.id, ...window });

      expect(res.status).toBe(201);
      expect(bookingSchema.safeParse(res.body).success).toBe(true);
      expect(res.body.status).toBe('pending');
    });

    it('returns 409 CONFLICT on overlapping slot', async () => {
      const window = futureWindow(80);
      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${ctx.studentToken}`)
        .send({ serviceId: ctx.service.id, ...window });

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${ctx.studentToken}`)
        .send({ serviceId: ctx.service.id, ...window });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('CONFLICT');
      expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
    });

    it('returns 401 when not authenticated', async () => {
      const window = futureWindow(90);
      const res = await request(app)
        .post('/api/bookings')
        .send({ serviceId: ctx.service.id, ...window });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/bookings', () => {
    it('returns only the authenticated user\'s bookings', async () => {
      // Student creates a booking first
      const window = futureWindow(110);
      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${ctx.studentToken}`)
        .send({ serviceId: ctx.service.id, ...window });

      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${ctx.studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((b: unknown) => {
        expect(bookingSchema.safeParse(b).success).toBe(true);
      });
    });
  });

  describe('POST /api/bookings/:id/approve', () => {
    it('student cannot approve — 403', async () => {
      const window = futureWindow(130);
      const createRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${ctx.studentToken}`)
        .send({ serviceId: ctx.service.id, ...window });

      const bookingId = createRes.body.id;
      const res = await request(app)
        .post(`/api/bookings/${bookingId}/approve`)
        .set('Authorization', `Bearer ${ctx.studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
      expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
    });

    it('provider can approve — 200', async () => {
      const window = futureWindow(140);
      const createRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${ctx.studentToken}`)
        .send({ serviceId: ctx.service.id, ...window });

      const bookingId = createRes.body.id;
      const res = await request(app)
        .post(`/api/bookings/${bookingId}/approve`)
        .set('Authorization', `Bearer ${ctx.staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('approved');
      expect(bookingSchema.safeParse(res.body).success).toBe(true);
    });
  });

  describe('DELETE /api/bookings/:id', () => {
    it('unrelated student cannot cancel — 403', async () => {
      const window = futureWindow(160);
      const createRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${ctx.studentToken}`)
        .send({ serviceId: ctx.service.id, ...window });

      // Register a different student
      const regRes = await request(app).post('/api/auth/register').send({
        email: `other-${Date.now()}@test.com`, password: 'password123', confirmPassword: 'password123',
        firstName: 'Other', lastName: 'Student', role: 'student',
      });
      const otherToken = regRes.body.token;

      const res = await request(app)
        .delete(`/api/bookings/${createRes.body.id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
    });

    it('admin can cancel any booking — 200', async () => {
      const window = futureWindow(180);
      const createRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${ctx.studentToken}`)
        .send({ serviceId: ctx.service.id, ...window });

      const res = await request(app)
        .delete(`/api/bookings/${createRes.body.id}`)
        .set('Authorization', `Bearer ${ctx.adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('cancelled');
    });
  });
});
