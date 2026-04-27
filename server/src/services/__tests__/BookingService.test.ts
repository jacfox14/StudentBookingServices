import { BookingService } from '../../services/BookingService.js';
import { Booking, Notification, AuditLog } from '../../models/index.js';
import { truncateAll, closeDb, seed, createAvailBlock, type SeedResult } from '../../test/helpers.js';

describe('BookingService', () => {
  let ctx: SeedResult;
  let tomorrow: Date;
  let tomorrowEnd: Date;

  beforeAll(async () => {
    await truncateAll();
    ctx = await seed();
  });

  beforeEach(() => {
    // Fresh window each test to avoid conflicts
    tomorrow = new Date(Date.now() + 25 * 3_600_000);
    tomorrowEnd = new Date(tomorrow.getTime() + 3_600_000);
  });

  afterAll(closeDb);

  describe('create', () => {
    it('creates a booking with notifications and audit log', async () => {
      const booking = await BookingService.create(ctx.student.id, {
        serviceId: ctx.service.id,
        startAt: tomorrow.toISOString(),
        endAt: tomorrowEnd.toISOString(),
      });

      expect(booking.id).toBeDefined();
      expect(booking.status).toBe('pending');

      const notif = await Notification.findOne({ where: { userId: ctx.staff.id, type: 'booking_created' } });
      expect(notif).not.toBeNull();

      const audit = await AuditLog.findOne({ where: { targetId: booking.id, action: 'booking.create' } });
      expect(audit).not.toBeNull();
    });

    it('throws VALIDATION_ERROR when startAt >= endAt', async () => {
      await expect(BookingService.create(ctx.student.id, {
        serviceId: ctx.service.id,
        startAt: tomorrowEnd.toISOString(),
        endAt: tomorrow.toISOString(),
      })).rejects.toMatchObject({ code: 'VALIDATION_ERROR', fieldErrors: { startAt: expect.any(String) } });
    });

    it('throws NOT_FOUND for a missing service', async () => {
      await expect(BookingService.create(ctx.student.id, {
        serviceId: 99999,
        startAt: tomorrow.toISOString(),
        endAt: tomorrowEnd.toISOString(),
      })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws CONFLICT for an inactive service', async () => {
      await expect(BookingService.create(ctx.student.id, {
        serviceId: ctx.inactiveService.id,
        startAt: tomorrow.toISOString(),
        endAt: tomorrowEnd.toISOString(),
      })).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('throws CONFLICT on overlapping pending/approved bookings', async () => {
      const start = new Date(Date.now() + 30 * 3_600_000);
      const end = new Date(start.getTime() + 3_600_000);
      // First booking succeeds
      await BookingService.create(ctx.student.id, {
        serviceId: ctx.service.id,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });
      // Second booking on same slot throws CONFLICT
      await expect(BookingService.create(ctx.student.id, {
        serviceId: ctx.service.id,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      })).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('allows a booking when previous one on same slot is rejected or cancelled', async () => {
      const start = new Date(Date.now() + 48 * 3_600_000);
      const end = new Date(start.getTime() + 3_600_000);
      // Create then reject the first booking
      const first = await BookingService.create(ctx.student.id, {
        serviceId: ctx.service.id,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });
      await BookingService.transition(first.id, 'rejected', { id: ctx.staff.id, role: ctx.staff.role }, {
        rejectionReason: 'unavailable',
      });
      // A new booking on the same slot should succeed
      await expect(BookingService.create(ctx.student.id, {
        serviceId: ctx.service.id,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      })).resolves.toMatchObject({ status: 'pending' });
    });
  });

  describe('transition', () => {
    async function makePendingBooking(offset = 72) {
      const start = new Date(Date.now() + offset * 3_600_000);
      const end = new Date(start.getTime() + 3_600_000);
      return BookingService.create(ctx.student.id, {
        serviceId: ctx.service.id,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });
    }

    it('approve: provider can approve a pending booking', async () => {
      const booking = await makePendingBooking();
      const approved = await BookingService.transition(booking.id, 'approved', { id: ctx.staff.id, role: ctx.staff.role });
      expect(approved.status).toBe('approved');

      const notif = await Notification.findOne({ where: { userId: ctx.student.id, type: 'booking_approved' } });
      expect(notif).not.toBeNull();
    });

    it('approve: student cannot approve — throws FORBIDDEN', async () => {
      const booking = await makePendingBooking();
      await expect(BookingService.transition(booking.id, 'approved', { id: ctx.student.id, role: 'student' }))
        .rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('approve: cannot approve a non-pending booking — throws CONFLICT', async () => {
      const booking = await makePendingBooking();
      await BookingService.transition(booking.id, 'approved', { id: ctx.staff.id, role: ctx.staff.role });
      await expect(BookingService.transition(booking.id, 'approved', { id: ctx.staff.id, role: ctx.staff.role }))
        .rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('reject: provider can reject a pending booking with reason', async () => {
      const booking = await makePendingBooking();
      const rejected = await BookingService.transition(booking.id, 'rejected', { id: ctx.staff.id, role: ctx.staff.role }, { rejectionReason: 'no availability' });
      expect(rejected.status).toBe('rejected');

      const notif = await Notification.findOne({ where: { userId: ctx.student.id, type: 'booking_rejected' } });
      expect(notif).not.toBeNull();

      const audit = await AuditLog.findOne({ where: { targetId: booking.id, action: 'booking.rejected' } });
      expect(audit).not.toBeNull();
    });

    it('cancel: owner can cancel pending booking', async () => {
      const booking = await makePendingBooking();
      const cancelled = await BookingService.transition(booking.id, 'cancelled', { id: ctx.student.id, role: 'student' });
      expect(cancelled.status).toBe('cancelled');
    });

    it('cancel: admin can cancel any booking', async () => {
      const booking = await makePendingBooking();
      const cancelled = await BookingService.transition(booking.id, 'cancelled', { id: ctx.admin.id, role: 'admin' });
      expect(cancelled.status).toBe('cancelled');
    });

    it('cancel: notifies the other party, not the actor', async () => {
      // Student cancels → provider should get notified
      const booking = await makePendingBooking();
      const notifsBefore = await Notification.count({ where: { userId: ctx.staff.id, type: 'booking_cancelled' } });
      await BookingService.transition(booking.id, 'cancelled', { id: ctx.student.id, role: 'student' });
      const notifsAfter = await Notification.count({ where: { userId: ctx.staff.id, type: 'booking_cancelled' } });
      expect(notifsAfter).toBe(notifsBefore + 1);
    });

    it('cancel: throws CONFLICT from a rejected status', async () => {
      const booking = await makePendingBooking();
      await BookingService.transition(booking.id, 'rejected', { id: ctx.staff.id, role: ctx.staff.role });
      await expect(BookingService.transition(booking.id, 'cancelled', { id: ctx.student.id, role: 'student' }))
        .rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('invalid target throws CONFLICT', async () => {
      const booking = await makePendingBooking();
      await expect(BookingService.transition(booking.id, 'completed' as never, { id: ctx.admin.id, role: 'admin' }))
        .rejects.toMatchObject({ code: 'CONFLICT' });
    });
  });

  describe('reschedule', () => {
    it('owner can reschedule a pending booking', async () => {
      const start = new Date(Date.now() + 100 * 3_600_000);
      const end = new Date(start.getTime() + 3_600_000);
      const booking = await BookingService.create(ctx.student.id, {
        serviceId: ctx.service.id,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });

      const newStart = new Date(start.getTime() + 2 * 3_600_000);
      const newEnd = new Date(newStart.getTime() + 3_600_000);
      const rescheduled = await BookingService.reschedule(
        booking.id,
        { id: ctx.student.id, role: 'student' },
        { startAt: newStart.toISOString(), endAt: newEnd.toISOString() }
      );
      expect(rescheduled.status).toBe('pending');
      expect(new Date(rescheduled.startAt).getTime()).toBe(newStart.getTime());
    });

    it('owner can reschedule an approved booking and resets status to pending', async () => {
      const start = new Date(Date.now() + 105 * 3_600_000);
      const end = new Date(start.getTime() + 3_600_000);
      const booking = await BookingService.create(ctx.student.id, {
        serviceId: ctx.service.id,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });
      await BookingService.transition(booking.id, 'approved', { id: ctx.staff.id, role: ctx.staff.role });

      const newStart = new Date(start.getTime() + 3 * 3_600_000);
      const newEnd = new Date(newStart.getTime() + 3_600_000);
      const rescheduled = await BookingService.reschedule(
        booking.id,
        { id: ctx.student.id, role: 'student' },
        { startAt: newStart.toISOString(), endAt: newEnd.toISOString() }
      );
      expect(rescheduled.status).toBe('pending');
    });

    it('non-owner cannot reschedule — throws FORBIDDEN', async () => {
      const start = new Date(Date.now() + 120 * 3_600_000);
      const end = new Date(start.getTime() + 3_600_000);
      const booking = await BookingService.create(ctx.student.id, {
        serviceId: ctx.service.id,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });

      await expect(BookingService.reschedule(
        booking.id,
        { id: ctx.admin.id, role: 'admin' },
        { startAt: start.toISOString(), endAt: end.toISOString() }
      )).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('overlap with a different booking throws CONFLICT', async () => {
      const base = Date.now() + 150 * 3_600_000;
      const s1 = new Date(base);
      const e1 = new Date(base + 3_600_000);
      // Occupy the slot with another booking from another session
      const other = await Booking.create({
        studentId: ctx.student.id,
        serviceId: ctx.service.id,
        startAt: s1,
        endAt: e1,
        status: 'approved',
      });

      // Try to reschedule a third booking into the occupied slot
      const s2 = new Date(base + 5 * 3_600_000);
      const e2 = new Date(s2.getTime() + 3_600_000);
      const toReschedule = await BookingService.create(ctx.student.id, {
        serviceId: ctx.service.id,
        startAt: s2.toISOString(),
        endAt: e2.toISOString(),
      });

      await expect(BookingService.reschedule(
        toReschedule.id,
        { id: ctx.student.id, role: 'student' },
        { startAt: s1.toISOString(), endAt: e1.toISOString() }
      )).rejects.toMatchObject({ code: 'CONFLICT' });

      await other.destroy();
    });

    it('reschedule succeeds when new range overlaps only the booking itself', async () => {
      // Regression test for excludeBookingId behavior in assertNoOverlap.
      const start = new Date(Date.now() + 200 * 3_600_000);
      const end = new Date(start.getTime() + 3_600_000);
      const booking = await BookingService.create(ctx.student.id, {
        serviceId: ctx.service.id,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });

      // Reschedule to a window that overlaps the booking itself (e.g. shift by 30 min).
      const newStart = new Date(start.getTime() + 30 * 60_000);
      const newEnd = new Date(newStart.getTime() + 3_600_000);
      const rescheduled = await BookingService.reschedule(
        booking.id,
        { id: ctx.student.id, role: 'student' },
        { startAt: newStart.toISOString(), endAt: newEnd.toISOString() }
      );
      expect(new Date(rescheduled.startAt).getTime()).toBe(newStart.getTime());
    });

    it('throws CONFLICT when the booking is cancelled', async () => {
      const start = new Date(Date.now() + 220 * 3_600_000);
      const end = new Date(start.getTime() + 3_600_000);
      const booking = await BookingService.create(ctx.student.id, {
        serviceId: ctx.service.id,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });
      await BookingService.transition(booking.id, 'cancelled', { id: ctx.student.id, role: 'student' });

      const newStart = new Date(start.getTime() + 2 * 3_600_000);
      const newEnd = new Date(newStart.getTime() + 3_600_000);
      await expect(BookingService.reschedule(
        booking.id,
        { id: ctx.student.id, role: 'student' },
        { startAt: newStart.toISOString(), endAt: newEnd.toISOString() }
      )).rejects.toMatchObject({ code: 'CONFLICT', message: expect.stringMatching(/Cannot reschedule a cancelled/) });
    });

    it('throws CONFLICT when within the lead-time window', async () => {
      // Booking that starts in 30 minutes — within the 120-minute lead-time guard.
      const start = new Date(Date.now() + 30 * 60_000);
      const end = new Date(start.getTime() + 3_600_000);
      const booking = await Booking.create({
        studentId: ctx.student.id,
        serviceId: ctx.service.id,
        startAt: start,
        endAt: end,
        status: 'approved',
      });

      const newStart = new Date(Date.now() + 50 * 3_600_000);
      const newEnd = new Date(newStart.getTime() + 3_600_000);
      await expect(BookingService.reschedule(
        booking.id,
        { id: ctx.student.id, role: 'student' },
        { startAt: newStart.toISOString(), endAt: newEnd.toISOString() }
      )).rejects.toMatchObject({
        code: 'CONFLICT',
        message: expect.stringMatching(/at least/),
      });

      await booking.destroy();
    });

    it('throws VALIDATION_ERROR when new startAt is in the past', async () => {
      const start = new Date(Date.now() + 240 * 3_600_000);
      const end = new Date(start.getTime() + 3_600_000);
      const booking = await BookingService.create(ctx.student.id, {
        serviceId: ctx.service.id,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });

      const pastStart = new Date(Date.now() - 60 * 60_000);
      const pastEnd = new Date(pastStart.getTime() + 3_600_000);
      await expect(BookingService.reschedule(
        booking.id,
        { id: ctx.student.id, role: 'student' },
        { startAt: pastStart.toISOString(), endAt: pastEnd.toISOString() }
      )).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    });

    it('increments rescheduleCount by 1 on success', async () => {
      const start = new Date(Date.now() + 260 * 3_600_000);
      const end = new Date(start.getTime() + 3_600_000);
      const booking = await BookingService.create(ctx.student.id, {
        serviceId: ctx.service.id,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });

      const newStart = new Date(start.getTime() + 2 * 3_600_000);
      const newEnd = new Date(newStart.getTime() + 3_600_000);
      await BookingService.reschedule(
        booking.id,
        { id: ctx.student.id, role: 'student' },
        { startAt: newStart.toISOString(), endAt: newEnd.toISOString() }
      );
      const fresh = await Booking.findByPk(booking.id);
      expect(fresh!.rescheduleCount).toBe(1);
    });

    it('writes booking_rescheduled notifications to provider and student + audit row', async () => {
      const start = new Date(Date.now() + 280 * 3_600_000);
      const end = new Date(start.getTime() + 3_600_000);
      const booking = await BookingService.create(ctx.student.id, {
        serviceId: ctx.service.id,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });

      const providerBefore = await Notification.count({ where: { userId: ctx.staff.id, type: 'booking_rescheduled' } });
      const studentBefore = await Notification.count({ where: { userId: ctx.student.id, type: 'booking_rescheduled' } });

      const newStart = new Date(start.getTime() + 4 * 3_600_000);
      const newEnd = new Date(newStart.getTime() + 3_600_000);
      await BookingService.reschedule(
        booking.id,
        { id: ctx.student.id, role: 'student' },
        { startAt: newStart.toISOString(), endAt: newEnd.toISOString() }
      );

      const providerAfter = await Notification.count({ where: { userId: ctx.staff.id, type: 'booking_rescheduled' } });
      const studentAfter = await Notification.count({ where: { userId: ctx.student.id, type: 'booking_rescheduled' } });
      expect(providerAfter).toBe(providerBefore + 1);
      expect(studentAfter).toBe(studentBefore + 1);

      const audit = await AuditLog.findOne({ where: { targetId: booking.id, action: 'booking.reschedule' } });
      expect(audit).not.toBeNull();
    });
  });
});
