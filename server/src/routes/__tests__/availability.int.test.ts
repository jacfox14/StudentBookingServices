import request from 'supertest';
import { createApp } from '../../app.js';
import { availabilityBlockSchema } from '@sbs/shared';
import { truncateAll, closeDb, seed, type SeedResult } from '../../test/helpers.js';

const app = createApp();

describe('Availability routes', () => {
  let ctx: SeedResult;

  beforeAll(async () => {
    await truncateAll();
    ctx = await seed();
  });
  afterAll(closeDb);

  const tomorrow = () => {
    const d = new Date(Date.now() + 25 * 3_600_000);
    d.setMinutes(0, 0, 0);
    return d;
  };

  describe('POST /api/provider/availability', () => {
    it('provider can create an availability block', async () => {
      const start = tomorrow();
      const end = new Date(start.getTime() + 4 * 3_600_000);

      const res = await request(app)
        .post('/api/provider/availability')
        .set('Authorization', `Bearer ${ctx.staffToken}`)
        .send({ serviceId: ctx.service.id, startAt: start.toISOString(), endAt: end.toISOString() });

      expect(res.status).toBe(201);
      expect(availabilityBlockSchema.safeParse(res.body).success).toBe(true);
    });

    it('student cannot create availability — 403', async () => {
      const start = tomorrow();
      const end = new Date(start.getTime() + 3_600_000);

      const res = await request(app)
        .post('/api/provider/availability')
        .set('Authorization', `Bearer ${ctx.studentToken}`)
        .send({ serviceId: ctx.service.id, startAt: start.toISOString(), endAt: end.toISOString() });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/services/:id/availability', () => {
    it('returns availability blocks for a service in the given date range', async () => {
      const start = tomorrow();
      const end = new Date(start.getTime() + 4 * 3_600_000);

      // Ensure block exists
      await request(app)
        .post('/api/provider/availability')
        .set('Authorization', `Bearer ${ctx.staffToken}`)
        .send({ serviceId: ctx.service.id, startAt: start.toISOString(), endAt: end.toISOString() });

      const from = new Date(Date.now()).toISOString();
      const to = new Date(Date.now() + 7 * 24 * 3_600_000).toISOString();

      const res = await request(app)
        .get(`/api/services/${ctx.service.id}/availability`)
        .set('Authorization', `Bearer ${ctx.studentToken}`)
        .query({ from, to });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((b: unknown) => {
        expect(availabilityBlockSchema.safeParse(b).success).toBe(true);
      });
    });
  });

  describe('DELETE /api/provider/availability/:id', () => {
    it('provider can delete their own availability block', async () => {
      const start = new Date(Date.now() + 200 * 3_600_000);
      const end = new Date(start.getTime() + 3_600_000);

      const createRes = await request(app)
        .post('/api/provider/availability')
        .set('Authorization', `Bearer ${ctx.staffToken}`)
        .send({ serviceId: ctx.service.id, startAt: start.toISOString(), endAt: end.toISOString() });

      const blockId = createRes.body.id;
      const res = await request(app)
        .delete(`/api/provider/availability/${blockId}`)
        .set('Authorization', `Bearer ${ctx.staffToken}`);

      expect(res.status).toBe(200);
    });

    it('student cannot delete availability — 403', async () => {
      const start = new Date(Date.now() + 300 * 3_600_000);
      const end = new Date(start.getTime() + 3_600_000);

      const createRes = await request(app)
        .post('/api/provider/availability')
        .set('Authorization', `Bearer ${ctx.staffToken}`)
        .send({ serviceId: ctx.service.id, startAt: start.toISOString(), endAt: end.toISOString() });

      const res = await request(app)
        .delete(`/api/provider/availability/${createRes.body.id}`)
        .set('Authorization', `Bearer ${ctx.studentToken}`);

      expect(res.status).toBe(403);
    });
  });
});
