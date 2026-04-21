/**
 * Contract canary: every error response must conform to apiErrorSchema.
 * Every success response must conform to its matching schema.
 */
import request from 'supertest';
import { createApp } from '../../app.js';
import {
  apiErrorSchema,
  authResponseSchema,
  serviceSchema,
  bookingSchema,
  notificationSchema,
} from '@sbs/shared';
import { truncateAll, closeDb, seed, type SeedResult } from '../../test/helpers.js';

const app = createApp();

describe('Error shape contract', () => {
  let ctx: SeedResult;

  beforeAll(async () => {
    await truncateAll();
    ctx = await seed();
  });
  afterAll(closeDb);

  // ---- Error paths --------------------------------------------------------

  it('login with bad creds → apiErrorSchema', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'x@x.com', password: 'bad' });
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
  });

  it('missing auth token → apiErrorSchema', async () => {
    const res = await request(app).get('/api/bookings');
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
  });

  it('wrong role → apiErrorSchema', async () => {
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${ctx.studentToken}`);
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
  });

  it('booking conflict → apiErrorSchema', async () => {
    const window = { startAt: new Date(Date.now() + 500 * 3_600_000).toISOString(), endAt: new Date(Date.now() + 501 * 3_600_000).toISOString() };
    await request(app).post('/api/bookings').set('Authorization', `Bearer ${ctx.studentToken}`).send({ serviceId: ctx.service.id, ...window });
    const res = await request(app).post('/api/bookings').set('Authorization', `Bearer ${ctx.studentToken}`).send({ serviceId: ctx.service.id, ...window });
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('validation error → apiErrorSchema with fieldErrors', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.fieldErrors).toBeDefined();
  });

  it('unknown route → apiErrorSchema NOT_FOUND', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
  });

  // ---- Success paths -------------------------------------------------------

  it('login success → authResponseSchema', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'student@test.com', password: 'password123' });
    expect(authResponseSchema.safeParse(res.body).success).toBe(true);
  });

  it('GET /api/services → array of serviceSchema', async () => {
    const res = await request(app).get('/api/services').set('Authorization', `Bearer ${ctx.studentToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((s: unknown) => expect(serviceSchema.safeParse(s).success).toBe(true));
  });

  it('POST /api/bookings → bookingSchema', async () => {
    const window = { startAt: new Date(Date.now() + 600 * 3_600_000).toISOString(), endAt: new Date(Date.now() + 601 * 3_600_000).toISOString() };
    const res = await request(app).post('/api/bookings').set('Authorization', `Bearer ${ctx.studentToken}`).send({ serviceId: ctx.service.id, ...window });
    expect(bookingSchema.safeParse(res.body).success).toBe(true);
  });
});
