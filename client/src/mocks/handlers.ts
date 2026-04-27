import { http, HttpResponse } from "msw";
import {
  availability,
  bookings,
  categories,
  makeToken,
  notifications,
  passwords,
  services,
  users,
} from "./fixtures";
import type { Booking, Notification } from "@shared/schemas";

const BASE = "/api";

function error(status: number, code: string, message: string, fieldErrors?: Record<string, string>) {
  return HttpResponse.json({ code, message, fieldErrors }, { status });
}

function currentUserFromAuth(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/, "");
  if (!token || !token.startsWith("mock.")) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return users.find((u) => u.id === payload.sub) ?? null;
  } catch {
    return null;
  }
}

function nextId<T extends { id: number }>(list: T[]) {
  return list.reduce((m, x) => Math.max(m, x.id), 0) + 1;
}

export const handlers = [
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    const user = users.find((u) => u.email.toLowerCase() === body.email.toLowerCase());
    if (!user || passwords[user.email] !== body.password) {
      return error(400, "VALIDATION_ERROR", "Invalid credentials", {
        email: "Check your email and password",
      });
    }
    if (user.isBanned) {
      return error(403, "FORBIDDEN", "This account has been suspended");
    }
    return HttpResponse.json({ token: makeToken(user.id, user.role), user });
  }),

  http.post(`${BASE}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role: "student" | "staff";
    };
    if (users.some((u) => u.email.toLowerCase() === body.email.toLowerCase())) {
      return error(409, "CONFLICT", "An account with this email already exists", {
        email: "Email already registered",
      });
    }
    const user = {
      id: nextId(users),
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role,
      isBanned: false,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    passwords[user.email] = body.password;
    return HttpResponse.json({ token: makeToken(user.id, user.role), user }, { status: 201 });
  }),

  http.post(`${BASE}/auth/logout`, () => HttpResponse.json({})),

  http.get(`${BASE}/users/me`, ({ request }) => {
    const user = currentUserFromAuth(request);
    if (!user) return error(401, "UNAUTHENTICATED", "Not logged in");
    return HttpResponse.json(user);
  }),

  http.put(`${BASE}/users/me`, async ({ request }) => {
    const user = currentUserFromAuth(request);
    if (!user) return error(401, "UNAUTHENTICATED", "Not logged in");
    const body = (await request.json()) as Partial<typeof user>;
    Object.assign(user, body);
    return HttpResponse.json(user);
  }),

  http.get(`${BASE}/service-categories`, () => HttpResponse.json(categories)),

  http.get(`${BASE}/services`, ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.toLowerCase() ?? "";
    const categoryId = url.searchParams.get("categoryId");
    let list = services.filter((s) => s.isActive);
    if (q) {
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.providerName.toLowerCase().includes(q)
      );
    }
    if (categoryId) list = list.filter((s) => s.categoryId === Number(categoryId));
    return HttpResponse.json(list);
  }),

  http.get(`${BASE}/services/:id`, ({ params }) => {
    const svc = services.find((s) => s.id === Number(params.id));
    if (!svc) return error(404, "NOT_FOUND", "Service not found");
    return HttpResponse.json(svc);
  }),

  http.get(`${BASE}/services/:id/availability`, ({ params }) => {
    const id = Number(params.id);
    const taken = new Set(
      bookings
        .filter((b) => b.serviceId === id && (b.status === "pending" || b.status === "approved"))
        .map((b) => b.startAt)
    );
    const slots = availability.filter((a) => a.serviceId === id && !taken.has(a.startAt));
    return HttpResponse.json(slots);
  }),

  http.post(`${BASE}/bookings`, async ({ request }) => {
    const user = currentUserFromAuth(request);
    if (!user) return error(401, "UNAUTHENTICATED", "Not logged in");
    if (user.role !== "student")
      return error(403, "FORBIDDEN", "Only students can create bookings");
    const body = (await request.json()) as {
      serviceId: number;
      startAt: string;
      endAt: string;
      notes?: string;
    };
    const svc = services.find((s) => s.id === body.serviceId);
    if (!svc) return error(404, "NOT_FOUND", "Service not found");
    const conflict = bookings.find(
      (b) =>
        b.serviceId === svc.id &&
        b.startAt === body.startAt &&
        (b.status === "pending" || b.status === "approved")
    );
    if (conflict) {
      return error(409, "CONFLICT", "That slot was just booked by another student");
    }
    const booking: Booking = {
      id: nextId(bookings),
      serviceId: svc.id,
      serviceTitle: svc.title,
      providerName: svc.providerName,
      studentId: user.id,
      studentName: `${user.firstName} ${user.lastName}`,
      startAt: body.startAt,
      endAt: body.endAt,
      status: "pending",
      notes: body.notes ?? null,
      location: svc.location,
      createdAt: new Date().toISOString(),
    };
    bookings.push(booking);

    notifications.push({
      id: nextId(notifications),
      userId: svc.providerId,
      type: "booking_created",
      payload: { bookingId: booking.id, service: svc.title, student: booking.studentName },
      readAt: null,
      createdAt: new Date().toISOString(),
    });
    return HttpResponse.json(booking, { status: 201 });
  }),

  http.get(`${BASE}/bookings`, ({ request }) => {
    const user = currentUserFromAuth(request);
    if (!user) return error(401, "UNAUTHENTICATED", "Not logged in");
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    let list = bookings.filter((b) => {
      if (user.role === "student") return b.studentId === user.id;
      if (user.role === "staff") {
        const svc = services.find((s) => s.id === b.serviceId);
        return svc?.providerId === user.id;
      }
      return true;
    });
    if (status) list = list.filter((b) => b.status === status);
    return HttpResponse.json(list);
  }),

  http.get(`${BASE}/bookings/:id`, ({ params, request }) => {
    const user = currentUserFromAuth(request);
    if (!user) return error(401, "UNAUTHENTICATED", "Not logged in");
    const booking = bookings.find((b) => b.id === Number(params.id));
    if (!booking) return error(404, "NOT_FOUND", "Booking not found");
    return HttpResponse.json(booking);
  }),

  http.delete(`${BASE}/bookings/:id`, ({ params, request }) => {
    const user = currentUserFromAuth(request);
    if (!user) return error(401, "UNAUTHENTICATED", "Not logged in");
    const booking = bookings.find((b) => b.id === Number(params.id));
    if (!booking) return error(404, "NOT_FOUND", "Booking not found");
    booking.status = "cancelled";
    notifications.push({
      id: nextId(notifications),
      userId: booking.studentId,
      type: "booking_cancelled",
      payload: { bookingId: booking.id, service: booking.serviceTitle },
      readAt: null,
      createdAt: new Date().toISOString(),
    });
    return HttpResponse.json(booking);
  }),

  http.patch(`${BASE}/bookings/:id`, async ({ params, request }) => {
    const user = currentUserFromAuth(request);
    if (!user) return error(401, "UNAUTHENTICATED", "Not logged in");
    const booking = bookings.find((b) => b.id === Number(params.id));
    if (!booking) return error(404, "NOT_FOUND", "Booking not found");
    const body = (await request.json()) as { startAt: string; endAt: string };
    booking.startAt = body.startAt;
    booking.endAt = body.endAt;
    booking.status = "pending";
    return HttpResponse.json(booking);
  }),

  http.post(`${BASE}/bookings/:id/approve`, ({ params, request }) => {
    const user = currentUserFromAuth(request);
    if (!user || (user.role !== "staff" && user.role !== "admin"))
      return error(403, "FORBIDDEN", "Only staff can approve bookings");
    const booking = bookings.find((b) => b.id === Number(params.id));
    if (!booking) return error(404, "NOT_FOUND", "Booking not found");
    booking.status = "approved";
    notifications.push({
      id: nextId(notifications),
      userId: booking.studentId,
      type: "booking_approved",
      payload: { bookingId: booking.id, service: booking.serviceTitle },
      readAt: null,
      createdAt: new Date().toISOString(),
    });
    return HttpResponse.json(booking);
  }),

  http.post(`${BASE}/bookings/:id/reject`, async ({ params, request }) => {
    const user = currentUserFromAuth(request);
    if (!user || (user.role !== "staff" && user.role !== "admin"))
      return error(403, "FORBIDDEN", "Only staff can reject bookings");
    const booking = bookings.find((b) => b.id === Number(params.id));
    if (!booking) return error(404, "NOT_FOUND", "Booking not found");
    const body = (await request.json()) as { reason: string };
    booking.status = "rejected";
    booking.rejectionReason = body.reason;
    notifications.push({
      id: nextId(notifications),
      userId: booking.studentId,
      type: "booking_rejected",
      payload: { bookingId: booking.id, service: booking.serviceTitle, reason: body.reason },
      readAt: null,
      createdAt: new Date().toISOString(),
    });
    return HttpResponse.json(booking);
  }),

  http.get(`${BASE}/provider/requests`, ({ request }) => {
    const user = currentUserFromAuth(request);
    if (!user || user.role !== "staff")
      return error(403, "FORBIDDEN", "Provider access only");
    const myServiceIds = services.filter((s) => s.providerId === user.id).map((s) => s.id);
    const list = bookings.filter(
      (b) => myServiceIds.includes(b.serviceId) && b.status === "pending"
    );
    return HttpResponse.json(list);
  }),

  http.get(`${BASE}/provider/bookings`, ({ request }) => {
    const user = currentUserFromAuth(request);
    if (!user || user.role !== "staff")
      return error(403, "FORBIDDEN", "Provider access only");
    const myServiceIds = services.filter((s) => s.providerId === user.id).map((s) => s.id);
    const list = bookings
      .filter((b) => myServiceIds.includes(b.serviceId))
      .slice()
      .sort((a, b) => (a.startAt < b.startAt ? -1 : 1));
    return HttpResponse.json(list);
  }),

  http.get(`${BASE}/provider/schedule`, ({ request }) => {
    const user = currentUserFromAuth(request);
    if (!user || user.role !== "staff")
      return error(403, "FORBIDDEN", "Provider access only");
    const myServiceIds = services.filter((s) => s.providerId === user.id).map((s) => s.id);
    const list = availability.filter((a) => myServiceIds.includes(a.serviceId));
    return HttpResponse.json(list);
  }),

  http.get(`${BASE}/provider/services`, ({ request }) => {
    const user = currentUserFromAuth(request);
    if (!user || user.role !== "staff")
      return error(403, "FORBIDDEN", "Provider access only");
    return HttpResponse.json(services.filter((s) => s.providerId === user.id));
  }),

  http.post(`${BASE}/provider/availability`, async ({ request }) => {
    const user = currentUserFromAuth(request);
    if (!user || user.role !== "staff")
      return error(403, "FORBIDDEN", "Provider access only");
    const body = (await request.json()) as {
      serviceId: number;
      startAt: string;
      endAt: string;
    };
    const block = { id: nextId(availability), ...body };
    availability.push(block);
    return HttpResponse.json(block, { status: 201 });
  }),

  http.delete(`${BASE}/provider/availability/:id`, ({ params }) => {
    const id = Number(params.id);
    const idx = availability.findIndex((a) => a.id === id);
    if (idx !== -1) availability.splice(idx, 1);
    return HttpResponse.json({});
  }),

  http.get(`${BASE}/notifications`, ({ request }) => {
    const user = currentUserFromAuth(request);
    if (!user) return error(401, "UNAUTHENTICATED", "Not logged in");
    return HttpResponse.json(
      notifications
        .filter((n) => n.userId === user.id)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    );
  }),

  http.patch(`${BASE}/notifications/:id/read`, ({ params, request }) => {
    const user = currentUserFromAuth(request);
    if (!user) return error(401, "UNAUTHENTICATED", "Not logged in");
    const n = notifications.find((x) => x.id === Number(params.id));
    if (!n) return error(404, "NOT_FOUND", "Notification not found");
    n.readAt = new Date().toISOString();
    return HttpResponse.json(n);
  }),

  // Admin
  http.get(`${BASE}/admin/users`, ({ request }) => {
    const user = currentUserFromAuth(request);
    if (!user || user.role !== "admin") return error(403, "FORBIDDEN", "Admin only");
    return HttpResponse.json(users);
  }),

  http.patch(`${BASE}/admin/users/:id`, async ({ params, request }) => {
    const admin = currentUserFromAuth(request);
    if (!admin || admin.role !== "admin") return error(403, "FORBIDDEN", "Admin only");
    const u = users.find((x) => x.id === Number(params.id));
    if (!u) return error(404, "NOT_FOUND", "User not found");
    const body = (await request.json()) as Partial<typeof u>;
    Object.assign(u, body);
    return HttpResponse.json(u);
  }),

  http.delete(`${BASE}/admin/users/:id`, ({ params, request }) => {
    const admin = currentUserFromAuth(request);
    if (!admin || admin.role !== "admin") return error(403, "FORBIDDEN", "Admin only");
    const idx = users.findIndex((u) => u.id === Number(params.id));
    if (idx !== -1) users.splice(idx, 1);
    return HttpResponse.json({});
  }),

  http.get(`${BASE}/admin/services`, ({ request }) => {
    const admin = currentUserFromAuth(request);
    if (!admin || admin.role !== "admin") return error(403, "FORBIDDEN", "Admin only");
    return HttpResponse.json(services);
  }),

  http.post(`${BASE}/admin/services`, async ({ request }) => {
    const admin = currentUserFromAuth(request);
    if (!admin || admin.role !== "admin") return error(403, "FORBIDDEN", "Admin only");
    const body = (await request.json()) as any;
    const category = categories.find((c) => c.id === body.categoryId);
    const provider = users.find((u) => u.id === body.providerId);
    if (!category || !provider)
      return error(400, "VALIDATION_ERROR", "Invalid category or provider");
    const svc = {
      id: nextId(services),
      categoryId: body.categoryId,
      categoryName: category.name,
      providerId: body.providerId,
      providerName: `${provider.firstName} ${provider.lastName}`,
      title: body.title,
      description: body.description,
      location: body.location,
      durationMinutes: body.durationMinutes,
      isActive: body.isActive ?? true,
    };
    services.push(svc);
    return HttpResponse.json(svc, { status: 201 });
  }),

  http.put(`${BASE}/admin/services/:id`, async ({ params, request }) => {
    const admin = currentUserFromAuth(request);
    if (!admin || admin.role !== "admin") return error(403, "FORBIDDEN", "Admin only");
    const svc = services.find((s) => s.id === Number(params.id));
    if (!svc) return error(404, "NOT_FOUND", "Service not found");
    const body = (await request.json()) as any;
    Object.assign(svc, body);
    return HttpResponse.json(svc);
  }),

  http.delete(`${BASE}/admin/services/:id`, ({ params, request }) => {
    const admin = currentUserFromAuth(request);
    if (!admin || admin.role !== "admin") return error(403, "FORBIDDEN", "Admin only");
    const idx = services.findIndex((s) => s.id === Number(params.id));
    if (idx !== -1) services.splice(idx, 1);
    return HttpResponse.json({});
  }),

  http.get(`${BASE}/admin/reports/summary`, ({ request }) => {
    const admin = currentUserFromAuth(request);
    if (!admin || admin.role !== "admin") return error(403, "FORBIDDEN", "Admin only");
    return HttpResponse.json({
      totalUsers: users.length,
      totalBookings: bookings.length,
      totalServices: services.length,
      pendingRequests: bookings.filter((b) => b.status === "pending").length,
      approvedThisWeek: bookings.filter((b) => b.status === "approved").length,
      activeProviders: users.filter((u) => u.role === "staff").length,
    });
  }),

  http.get(`${BASE}/admin/reports/bookings`, ({ request }) => {
    const admin = currentUserFromAuth(request);
    if (!admin || admin.role !== "admin") return error(403, "FORBIDDEN", "Admin only");
    const map = new Map<string, number>();
    for (const b of bookings) {
      const d = b.startAt.slice(0, 10);
      map.set(d, (map.get(d) ?? 0) + 1);
    }
    return HttpResponse.json(
      Array.from(map.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([date, count]) => ({ date, count }))
    );
  }),
];
