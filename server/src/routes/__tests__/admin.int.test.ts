import request from 'supertest';
import { createApp } from '../../app.js';
import { apiErrorSchema } from '@sbs/shared';
import { truncateAll, closeDb, seed, type SeedResult } from '../../test/helpers.js';

const app = createApp();

describe('Admin routes', () => {
  let ctx: SeedResult;

  beforeAll(async () => {
    await truncateAll();
    ctx = await seed();
  });
  afterAll(closeDb);

  describe('GET /api/admin/users', () => {
    it('admin can list all users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${ctx.adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('non-admin gets 403', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${ctx.studentToken}`);

      expect(res.status).toBe(403);
      expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
    });
  });

  describe('PATCH /api/admin/users/:id — ban flow', () => {
    it('admin can ban a user, and banned user cannot login', async () => {
      // Ban the student
      const patchRes = await request(app)
        .patch(`/api/admin/users/${ctx.student.id}`)
        .set('Authorization', `Bearer ${ctx.adminToken}`)
        .send({ isBanned: true });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.isBanned).toBe(true);

      // Banned user's login attempt should fail
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'student@test.com', password: 'password123' });

      expect(loginRes.status).toBe(401);
      expect(loginRes.body.code).toBe('UNAUTHENTICATED');

      // Unban for other tests
      await request(app)
        .patch(`/api/admin/users/${ctx.student.id}`)
        .set('Authorization', `Bearer ${ctx.adminToken}`)
        .send({ isBanned: false });
    });
  });

  describe('Service CRUD', () => {
    it('admin can create a service', async () => {
      const res = await request(app)
        .post('/api/admin/services')
        .set('Authorization', `Bearer ${ctx.adminToken}`)
        .send({
          categoryId: ctx.category.id,
          providerId: ctx.staff.id,
          title: 'New Service',
          description: 'Test desc',
          location: 'Room A',
          durationMinutes: 45,
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('New Service');
    });

    it('student cannot create a service — 403', async () => {
      const res = await request(app)
        .post('/api/admin/services')
        .set('Authorization', `Bearer ${ctx.studentToken}`)
        .send({
          categoryId: ctx.category.id,
          providerId: ctx.staff.id,
          title: 'Unauthorized',
          description: 'x',
          location: 'y',
          durationMinutes: 30,
          isActive: true,
        });

      expect(res.status).toBe(403);
    });

    it('admin can delete a service', async () => {
      const createRes = await request(app)
        .post('/api/admin/services')
        .set('Authorization', `Bearer ${ctx.adminToken}`)
        .send({
          categoryId: ctx.category.id,
          providerId: ctx.staff.id,
          title: 'To Delete',
          description: 'd',
          location: 'l',
          durationMinutes: 30,
          isActive: true,
        });
      const svcId = createRes.body.id;

      const res = await request(app)
        .delete(`/api/admin/services/${svcId}`)
        .set('Authorization', `Bearer ${ctx.adminToken}`);

      expect(res.status).toBe(200);
    });
  });
});
