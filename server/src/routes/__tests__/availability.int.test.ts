import request from 'supertest';
import { createApp } from '../../app.js';
import { availabilityBlockSchema } from '@sbs/shared';
import { truncateAll, closeDb, seed, type SeedResult } from '../../test/helpers.js';
import { AvailabilityBlock, Booking, User } from '../../models/index.js';
import { hashPassword } from '../../utils/password.js';
import { signToken } from '../../utils/jwt.js';

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

  describe('GET /api/services/:id/availability — excludeBookingId auth scoping', () => {
    /**
     * Creates an availability block + a booking that exactly fills it, returning
     * (slotStart, slotEnd, bookingId, blockId) so we can assert filtering behavior.
     */
    async function setupBookedSlot(serviceId: number, studentId: number, offsetHours: number) {
      const start = new Date(Date.now() + offsetHours * 3_600_000);
      start.setMinutes(0, 0, 0);
      const end = new Date(start.getTime() + 3_600_000);
      const block = await AvailabilityBlock.create({ serviceId, startAt: start, endAt: end });
      const booking = await Booking.create({
        studentId,
        serviceId,
        startAt: start,
        endAt: end,
        status: 'approved',
      });
      return { start, end, blockId: block.id, bookingId: booking.id };
    }

    function rangeAround(start: Date) {
      const from = new Date(start.getTime() - 24 * 3_600_000).toISOString();
      const to = new Date(start.getTime() + 24 * 3_600_000).toISOString();
      return { from, to };
    }

    it('owner passing excludeBookingId sees the slot covered by that booking', async () => {
      const setup = await setupBookedSlot(ctx.service.id, ctx.student.id, 410);
      const { from, to } = rangeAround(setup.start);

      const without = await request(app)
        .get(`/api/services/${ctx.service.id}/availability`)
        .set('Authorization', `Bearer ${ctx.studentToken}`)
        .query({ from, to });
      const withParam = await request(app)
        .get(`/api/services/${ctx.service.id}/availability`)
        .set('Authorization', `Bearer ${ctx.studentToken}`)
        .query({ from, to, excludeBookingId: setup.bookingId });

      expect(without.status).toBe(200);
      expect(withParam.status).toBe(200);
      const includes = (rows: any[]) => rows.some((r) => r.id === setup.blockId);
      expect(includes(without.body)).toBe(false);
      expect(includes(withParam.body)).toBe(true);

      await Booking.destroy({ where: { id: setup.bookingId } });
      await AvailabilityBlock.destroy({ where: { id: setup.blockId } });
    });

    it('different student passing the same excludeBookingId is silently ignored (no leak)', async () => {
      const setup = await setupBookedSlot(ctx.service.id, ctx.student.id, 430);
      const { from, to } = rangeAround(setup.start);

      // Spin up a second student.
      const other = await User.create({
        email: `other-${Date.now()}@test.com`,
        passwordHash: await hashPassword('password123'),
        firstName: 'Other',
        lastName: 'Student',
        role: 'student',
        isBanned: false,
        emailVerifiedAt: null,
      });
      const otherToken = signToken({ sub: other.id, role: other.role, email: other.email });

      const baseline = await request(app)
        .get(`/api/services/${ctx.service.id}/availability`)
        .set('Authorization', `Bearer ${otherToken}`)
        .query({ from, to });
      const probed = await request(app)
        .get(`/api/services/${ctx.service.id}/availability`)
        .set('Authorization', `Bearer ${otherToken}`)
        .query({ from, to, excludeBookingId: setup.bookingId });

      expect(baseline.status).toBe(200);
      expect(probed.status).toBe(200);
      // Identical responses — the param was silently ignored.
      expect(probed.body).toEqual(baseline.body);

      await Booking.destroy({ where: { id: setup.bookingId } });
      await AvailabilityBlock.destroy({ where: { id: setup.blockId } });
      await other.destroy();
    });

    it('garbage / nonexistent excludeBookingId is silently ignored', async () => {
      const setup = await setupBookedSlot(ctx.service.id, ctx.student.id, 450);
      const { from, to } = rangeAround(setup.start);

      const baseline = await request(app)
        .get(`/api/services/${ctx.service.id}/availability`)
        .set('Authorization', `Bearer ${ctx.studentToken}`)
        .query({ from, to });
      const garbage = await request(app)
        .get(`/api/services/${ctx.service.id}/availability`)
        .set('Authorization', `Bearer ${ctx.studentToken}`)
        .query({ from, to, excludeBookingId: 999999 });
      const nonNumeric = await request(app)
        .get(`/api/services/${ctx.service.id}/availability`)
        .set('Authorization', `Bearer ${ctx.studentToken}`)
        .query({ from, to, excludeBookingId: 'foo' });

      expect(garbage.body).toEqual(baseline.body);
      expect(nonNumeric.body).toEqual(baseline.body);

      await Booking.destroy({ where: { id: setup.bookingId } });
      await AvailabilityBlock.destroy({ where: { id: setup.blockId } });
    });
  });
});
