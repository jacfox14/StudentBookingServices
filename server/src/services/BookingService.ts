import { Op, Transaction } from "sequelize";
import { sequelize, Booking, Service, User, Notification, AuditLog } from "../models/index.js";
import { AppError } from "../errors/AppError.js";
import type { BookingStatus } from "../models/Booking.js";
import type { CreateBookingInput, RescheduleBookingInput } from "@sbs/shared";

async function loadFullBooking(id: number, tx?: Transaction) {
  return Booking.findByPk(id, {
    include: [
      { model: Service, as: "service", include: [{ model: User, as: "provider" }] },
      { model: User, as: "student" },
    ],
    transaction: tx,
  });
}

async function assertNoOverlap(
  serviceId: number,
  startAt: Date,
  endAt: Date,
  tx: Transaction,
  excludeBookingId?: number
) {
  const where: Record<string, unknown> = {
    serviceId,
    status: { [Op.in]: ["pending", "approved"] },
    startAt: { [Op.lt]: endAt },
    endAt: { [Op.gt]: startAt },
  };
  if (excludeBookingId) where.id = { [Op.ne]: excludeBookingId };
  const conflict = await Booking.findOne({
    where,
    transaction: tx,
    lock: tx.LOCK.UPDATE,
  });
  if (conflict) {
    throw new AppError("CONFLICT", "That time slot has already been booked");
  }
}

async function assertNoStudentOverlap(
  studentId: number,
  startAt: Date,
  endAt: Date,
  tx: Transaction,
  excludeBookingId?: number
) {
  const where: Record<string, unknown> = {
    studentId,
    status: { [Op.in]: ["pending", "approved"] },
    startAt: { [Op.lt]: endAt },
    endAt: { [Op.gt]: startAt },
  };
  if (excludeBookingId) where.id = { [Op.ne]: excludeBookingId };
  const conflict = await Booking.findOne({
    where,
    transaction: tx,
    lock: tx.LOCK.UPDATE,
  });
  if (conflict) {
    throw new AppError("CONFLICT", "You already have a booking that overlaps with that time");
  }
}

export const BookingService = {
  async create(studentId: number, input: CreateBookingInput) {
    const startAt = new Date(input.startAt);
    const endAt = new Date(input.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || startAt >= endAt) {
      throw new AppError("VALIDATION_ERROR", "Invalid time range", {
        startAt: "Start must be before end",
      });
    }

    return sequelize.transaction(async (tx) => {
      const service = await Service.findByPk(input.serviceId, { transaction: tx });
      if (!service) throw new AppError("NOT_FOUND", "Service not found");
      if (!service.isActive)
        throw new AppError("CONFLICT", "This service is not currently accepting bookings");

      await assertNoOverlap(service.id, startAt, endAt, tx);
      await assertNoStudentOverlap(studentId, startAt, endAt, tx);

      const booking = await Booking.create(
        {
          serviceId: service.id,
          studentId,
          startAt,
          endAt,
          status: "pending",
          notes: input.notes ?? null,
          rejectionReason: null,
        },
        { transaction: tx }
      );

      await Notification.create(
        {
          userId: service.providerId,
          type: "booking_created",
          payload: {
            bookingId: booking.id,
            serviceTitle: service.title,
            startAt: startAt.toISOString(),
          },
          readAt: null,
        },
        { transaction: tx }
      );

      await AuditLog.create(
        {
          actorId: studentId,
          action: "booking.create",
          targetType: "Booking",
          targetId: booking.id,
          meta: { serviceId: service.id },
        },
        { transaction: tx }
      );

      const full = await loadFullBooking(booking.id, tx);
      return full!;
    });
  },

  async reschedule(
    bookingId: number,
    actor: { id: number; role: string },
    input: RescheduleBookingInput
  ) {
    const startAt = new Date(input.startAt);
    const endAt = new Date(input.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || startAt >= endAt) {
      throw new AppError("VALIDATION_ERROR", "Invalid time range");
    }
    return sequelize.transaction(async (tx) => {
      const booking = await Booking.findByPk(bookingId, { transaction: tx });
      if (!booking) throw new AppError("NOT_FOUND", "Booking not found");
      if (booking.studentId !== actor.id) {
        throw new AppError("FORBIDDEN", "Only the booking owner can reschedule");
      }
      if (!["pending", "approved"].includes(booking.status)) {
        throw new AppError("CONFLICT", `Cannot reschedule a ${booking.status} booking`);
      }
      await assertNoOverlap(booking.serviceId, startAt, endAt, tx, booking.id);
      await assertNoStudentOverlap(booking.studentId, startAt, endAt, tx, booking.id);
      booking.startAt = startAt;
      booking.endAt = endAt;
      booking.status = "pending";
      await booking.save({ transaction: tx });

      await AuditLog.create(
        {
          actorId: actor.id,
          action: "booking.reschedule",
          targetType: "Booking",
          targetId: booking.id,
          meta: { startAt: startAt.toISOString(), endAt: endAt.toISOString() },
        },
        { transaction: tx }
      );
      return (await loadFullBooking(booking.id, tx))!;
    });
  },

  async transition(
    bookingId: number,
    target: BookingStatus,
    actor: { id: number; role: string },
    options: { rejectionReason?: string } = {}
  ) {
    return sequelize.transaction(async (tx) => {
      const booking = await Booking.findByPk(bookingId, {
        include: [{ model: Service, as: "service" }],
        transaction: tx,
      });
      if (!booking) throw new AppError("NOT_FOUND", "Booking not found");
      const service = (booking as unknown as { service?: { providerId: number } }).service;

      const isOwner = booking.studentId === actor.id;
      const isProvider = service?.providerId === actor.id;
      const isAdmin = actor.role === "admin";

      const from = booking.status;
      if (target === "approved") {
        if (!isProvider && !isAdmin) throw new AppError("FORBIDDEN", "Only the provider can approve");
        if (from !== "pending") throw new AppError("CONFLICT", `Cannot approve from ${from}`);
        booking.status = "approved";
      } else if (target === "rejected") {
        if (!isProvider && !isAdmin) throw new AppError("FORBIDDEN", "Only the provider can reject");
        if (from !== "pending") throw new AppError("CONFLICT", `Cannot reject from ${from}`);
        booking.status = "rejected";
        booking.rejectionReason = options.rejectionReason ?? null;
      } else if (target === "cancelled") {
        if (!isOwner && !isProvider && !isAdmin)
          throw new AppError("FORBIDDEN", "Not allowed to cancel this booking");
        if (!["pending", "approved"].includes(from))
          throw new AppError("CONFLICT", `Cannot cancel from ${from}`);
        booking.status = "cancelled";
      } else {
        throw new AppError("CONFLICT", `Invalid transition to ${target}`);
      }
      await booking.save({ transaction: tx });

      const notifyUserIds = new Set<number>();
      if (target === "cancelled") {
        // Notify every party except the one who performed the cancel.
        if (!isOwner) notifyUserIds.add(booking.studentId);
        if (!isProvider && service?.providerId) notifyUserIds.add(service.providerId);
      } else {
        notifyUserIds.add(booking.studentId);
      }

      const notificationType =
        target === "approved"
          ? "booking_approved"
          : target === "rejected"
          ? "booking_rejected"
          : "booking_cancelled";

      for (const userId of notifyUserIds) {
        await Notification.create(
          {
            userId,
            type: notificationType,
            payload: {
              bookingId: booking.id,
              ...(options.rejectionReason
                ? { rejectionReason: options.rejectionReason }
                : {}),
            },
            readAt: null,
          },
          { transaction: tx }
        );
      }

      await AuditLog.create(
        {
          actorId: actor.id,
          action: `booking.${target}`,
          targetType: "Booking",
          targetId: booking.id,
          meta: { from, to: target },
        },
        { transaction: tx }
      );

      return (await loadFullBooking(booking.id, tx))!;
    });
  },
};
