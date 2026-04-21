import type { User as UserModel } from "../models/User.js";
import type { Service as ServiceModel } from "../models/Service.js";
import type { ServiceCategory as CategoryModel } from "../models/ServiceCategory.js";
import type { AvailabilityBlock as AvailBlockModel } from "../models/AvailabilityBlock.js";
import type { Booking as BookingModel } from "../models/Booking.js";
import type { Notification as NotificationModel } from "../models/Notification.js";

export const toUserDTO = (u: UserModel) => ({
  id: u.id,
  email: u.email,
  firstName: u.firstName,
  lastName: u.lastName,
  role: u.role,
  isBanned: u.isBanned,
  createdAt: u.createdAt.toISOString(),
});

export const toCategoryDTO = (c: CategoryModel) => ({
  id: c.id,
  name: c.name,
  icon: c.icon ?? undefined,
});

type ServiceWithRels = ServiceModel & {
  category?: CategoryModel | null;
  provider?: UserModel | null;
};

export const toServiceDTO = (s: ServiceWithRels) => ({
  id: s.id,
  categoryId: s.categoryId,
  categoryName: s.category?.name ?? "",
  providerId: s.providerId,
  providerName: s.provider
    ? `${s.provider.firstName} ${s.provider.lastName}`.trim()
    : "",
  title: s.title,
  description: s.description,
  location: s.location,
  durationMinutes: s.durationMinutes,
  isActive: s.isActive,
});

export const toAvailabilityDTO = (a: AvailBlockModel) => ({
  id: a.id,
  serviceId: a.serviceId,
  startAt: a.startAt.toISOString(),
  endAt: a.endAt.toISOString(),
});

type BookingWithRels = BookingModel & {
  service?: (ServiceModel & { provider?: UserModel | null }) | null;
  student?: UserModel | null;
};

export const toBookingDTO = (b: BookingWithRels) => ({
  id: b.id,
  serviceId: b.serviceId,
  serviceTitle: b.service?.title ?? "",
  providerName: b.service?.provider
    ? `${b.service.provider.firstName} ${b.service.provider.lastName}`.trim()
    : "",
  studentId: b.studentId,
  studentName: b.student
    ? `${b.student.firstName} ${b.student.lastName}`.trim()
    : "",
  startAt: b.startAt.toISOString(),
  endAt: b.endAt.toISOString(),
  status: b.status,
  notes: b.notes ?? null,
  rejectionReason: b.rejectionReason ?? null,
  location: b.service?.location ?? undefined,
  createdAt: b.createdAt.toISOString(),
});

export const toNotificationDTO = (n: NotificationModel) => ({
  id: n.id,
  userId: n.userId,
  type: n.type,
  payload: n.payload ?? {},
  readAt: n.readAt ? n.readAt.toISOString() : null,
  createdAt: n.createdAt.toISOString(),
});
