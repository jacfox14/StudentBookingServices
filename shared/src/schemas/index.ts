import { z } from "zod";

export const roleSchema = z.enum(["student", "staff", "admin"]);
export type Role = z.infer<typeof roleSchema>;

export const bookingStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "completed",
]);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

export const notificationTypeSchema = z.enum([
  "booking_created",
  "booking_approved",
  "booking_rejected",
  "booking_cancelled",
  "booking_rescheduled",
  "reminder",
]);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const RESCHEDULE_LEAD_TIME_MINUTES = 120;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(80),
    lastName: z.string().min(1, "Last name is required").max(80),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    role: z.enum(["student", "staff"], {
      errorMap: () => ({ message: "Select a role" }),
    }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const profileUpdateSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const userSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: roleSchema,
  isBanned: z.boolean(),
  createdAt: z.string(),
});
export type User = z.infer<typeof userSchema>;

export const serviceCategorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  icon: z.string().optional(),
});
export type ServiceCategory = z.infer<typeof serviceCategorySchema>;

export const serviceSchema = z.object({
  id: z.number().int().positive(),
  categoryId: z.number().int().positive(),
  categoryName: z.string(),
  providerId: z.number().int().positive(),
  providerName: z.string(),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  durationMinutes: z.number().int().positive(),
  isActive: z.boolean(),
});
export type Service = z.infer<typeof serviceSchema>;

export const createServiceSchema = z.object({
  categoryId: z.number().int().positive(),
  providerId: z.number().int().positive(),
  title: z.string().min(3).max(160),
  description: z.string().min(10),
  location: z.string().min(2).max(160),
  durationMinutes: z.number().int().min(10).max(240),
  isActive: z.boolean().default(true),
});
export type CreateServiceInput = z.infer<typeof createServiceSchema>;

export const availabilityBlockSchema = z.object({
  id: z.number().int().positive(),
  serviceId: z.number().int().positive(),
  startAt: z.string(),
  endAt: z.string(),
});
export type AvailabilityBlock = z.infer<typeof availabilityBlockSchema>;

export const createAvailabilitySchema = z
  .object({
    serviceId: z.number().int().positive(),
    startAt: z.string(),
    endAt: z.string(),
  })
  .refine((v) => new Date(v.startAt) < new Date(v.endAt), {
    path: ["endAt"],
    message: "End time must be after start time",
  });
export type CreateAvailabilityInput = z.infer<typeof createAvailabilitySchema>;

export const bookingSchema = z.object({
  id: z.number().int().positive(),
  serviceId: z.number().int().positive(),
  serviceTitle: z.string(),
  providerName: z.string(),
  studentId: z.number().int().positive(),
  studentName: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  status: bookingStatusSchema,
  notes: z.string().nullable().optional(),
  rejectionReason: z.string().nullable().optional(),
  location: z.string().optional(),
  rescheduleCount: z.number().int().nonnegative().optional(),
  createdAt: z.string(),
});
export type Booking = z.infer<typeof bookingSchema>;

export const createBookingSchema = z.object({
  serviceId: z.number().int().positive(),
  startAt: z.string(),
  endAt: z.string(),
  notes: z.string().max(500).optional(),
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const rescheduleBookingSchema = z.object({
  startAt: z.string(),
  endAt: z.string(),
});
export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;

export const rejectBookingSchema = z.object({
  reason: z.string().min(1, "Reason required").max(255),
});
export type RejectBookingInput = z.infer<typeof rejectBookingSchema>;

export const notificationSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  type: notificationTypeSchema,
  payload: z.record(z.any()),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});
export type Notification = z.infer<typeof notificationSchema>;

export const apiErrorSchema = z.object({
  code: z.enum([
    "VALIDATION_ERROR",
    "UNAUTHENTICATED",
    "FORBIDDEN",
    "NOT_FOUND",
    "CONFLICT",
    "INTERNAL",
  ]),
  message: z.string(),
  fieldErrors: z.record(z.string()).optional(),
});
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;

export const authResponseSchema = z.object({
  token: z.string(),
  user: userSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;
