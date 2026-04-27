import { http } from "./axios";
import type {
  AuthResponse,
  Booking,
  CreateBookingInput,
  CreateServiceInput,
  Service,
  AvailabilityBlock,
  Notification,
  User,
  LoginInput,
  RegisterInput,
  RejectBookingInput,
  CreateAvailabilityInput,
  ProfileUpdateInput,
} from "@shared/schemas";

export const authApi = {
  login: (input: LoginInput) =>
    http.post<AuthResponse>("/auth/login", input).then((r) => r.data),
  register: (input: RegisterInput) =>
    http.post<AuthResponse>("/auth/register", input).then((r) => r.data),
  logout: () => http.post("/auth/logout").then(() => undefined),
  me: () => http.get<User>("/users/me").then((r) => r.data),
  updateMe: (input: ProfileUpdateInput) =>
    http.put<User>("/users/me", input).then((r) => r.data),
};

export const servicesApi = {
  list: (params?: { q?: string; categoryId?: number }) =>
    http.get<Service[]>("/services", { params }).then((r) => r.data),
  get: (id: number) =>
    http.get<Service>(`/services/${id}`).then((r) => r.data),
  availability: (id: number, from: string, to: string, excludeBookingId?: number) =>
    http
      .get<AvailabilityBlock[]>(`/services/${id}/availability`, {
        params: { from, to, ...(excludeBookingId ? { excludeBookingId } : {}) },
      })
      .then((r) => r.data),
  categories: () =>
    http.get<{ id: number; name: string; icon?: string }[]>("/service-categories").then((r) => r.data),
};

export const bookingsApi = {
  create: (input: CreateBookingInput) =>
    http.post<Booking>("/bookings", input).then((r) => r.data),
  listMine: (status?: string) =>
    http.get<Booking[]>("/bookings", { params: { status } }).then((r) => r.data),
  get: (id: number) =>
    http.get<Booking>(`/bookings/${id}`).then((r) => r.data),
  cancel: (id: number) =>
    http.delete<Booking>(`/bookings/${id}`).then((r) => r.data),
  approve: (id: number) =>
    http.post<Booking>(`/bookings/${id}/approve`).then((r) => r.data),
  reject: (id: number, input: RejectBookingInput) =>
    http.post<Booking>(`/bookings/${id}/reject`, input).then((r) => r.data),
  reschedule: (id: number, startAt: string, endAt: string) =>
    http.patch<Booking>(`/bookings/${id}`, { startAt, endAt }).then((r) => r.data),
};

export const providerApi = {
  bookings: () =>
    http.get<Booking[]>("/provider/bookings").then((r) => r.data),
  requests: () =>
    http.get<Booking[]>("/provider/requests").then((r) => r.data),
  schedule: () =>
    http.get<AvailabilityBlock[]>("/provider/schedule").then((r) => r.data),
  addAvailability: (input: CreateAvailabilityInput) =>
    http.post<AvailabilityBlock>("/provider/availability", input).then((r) => r.data),
  removeAvailability: (id: number) =>
    http.delete(`/provider/availability/${id}`).then(() => undefined),
  myServices: () =>
    http.get<Service[]>("/provider/services").then((r) => r.data),
};

export const notificationsApi = {
  list: () => http.get<Notification[]>("/notifications").then((r) => r.data),
  markRead: (id: number) =>
    http.patch<Notification>(`/notifications/${id}/read`).then((r) => r.data),
};

export const adminApi = {
  users: () => http.get<User[]>("/admin/users").then((r) => r.data),
  updateUser: (id: number, data: Partial<User>) =>
    http.patch<User>(`/admin/users/${id}`, data).then((r) => r.data),
  deleteUser: (id: number) =>
    http.delete(`/admin/users/${id}`).then(() => undefined),
  services: () => http.get<Service[]>("/admin/services").then((r) => r.data),
  createService: (input: CreateServiceInput) =>
    http.post<Service>("/admin/services", input).then((r) => r.data),
  updateService: (id: number, input: CreateServiceInput) =>
    http.put<Service>(`/admin/services/${id}`, input).then((r) => r.data),
  deleteService: (id: number) =>
    http.delete(`/admin/services/${id}`).then(() => undefined),
  reportsSummary: () =>
    http.get<{
      totalUsers: number;
      totalBookings: number;
      totalServices: number;
      pendingRequests: number;
      approvedThisWeek: number;
      activeProviders: number;
    }>("/admin/reports/summary").then((r) => r.data),
  reportsBookings: () =>
    http.get<{ date: string; count: number }[]>("/admin/reports/bookings").then((r) => r.data),
};
