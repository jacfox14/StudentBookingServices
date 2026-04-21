import request from 'supertest';
import { createApp } from '../../app.js';
import { notificationSchema } from '@sbs/shared';
import { Notification } from '../../models/index.js';
import { truncateAll, closeDb, seed, type SeedResult } from '../../test/helpers.js';

const app = createApp();

describe('Notifications routes', () => {
  let ctx: SeedResult;
  let notifId: number;

  beforeAll(async () => {
    await truncateAll();
    ctx = await seed();

    // Create a notification for the student directly
    const notif = await Notification.create({
      userId: ctx.student.id,
      type: 'booking_approved',
      payload: { bookingId: 1 },
      readAt: null,
    });
    notifId = notif.id;
  });
  afterAll(closeDb);

  describe('GET /api/notifications', () => {
    it('returns notifications for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${ctx.studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((n: unknown) => {
        expect(notificationSchema.safeParse(n).success).toBe(true);
      });
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('marks the notification as read for the owner', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${notifId}/read`)
        .set('Authorization', `Bearer ${ctx.studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.readAt).not.toBeNull();
      expect(notificationSchema.safeParse(res.body).success).toBe(true);
    });

    it('returns 403 when a different user tries to mark it read', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${notifId}/read`)
        .set('Authorization', `Bearer ${ctx.staffToken}`);

      expect(res.status).toBe(403);
    });
  });
});
