import {
  loginSchema,
  registerSchema,
  createBookingSchema,
  rescheduleBookingSchema,
  rejectBookingSchema,
  createServiceSchema,
  createAvailabilitySchema,
  profileUpdateSchema,
  apiErrorSchema,
  authResponseSchema,
  bookingSchema,
  serviceSchema,
  roleSchema,
  bookingStatusSchema,
  notificationTypeSchema,
} from '@shared/schemas';

describe('Shared Zod schemas', () => {
  describe('loginSchema', () => {
    it('accepts valid input', () => {
      expect(loginSchema.safeParse({ email: 'a@b.com', password: 'password123' }).success).toBe(true);
    });
    it('rejects missing email', () => {
      const r = loginSchema.safeParse({ password: 'password123' });
      expect(r.success).toBe(false);
    });
    it('rejects invalid email format', () => {
      const r = loginSchema.safeParse({ email: 'notanemail', password: 'password123' });
      expect(r.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    const valid = { email: 'a@b.com', password: 'password123', confirmPassword: 'password123', firstName: 'Alice', lastName: 'B', role: 'student' };
    it('accepts valid input', () => expect(registerSchema.safeParse(valid).success).toBe(true));
    it('rejects empty firstName', () => {
      expect(registerSchema.safeParse({ ...valid, firstName: '' }).success).toBe(false);
    });
    it('rejects unknown role', () => {
      expect(registerSchema.safeParse({ ...valid, role: 'superuser' }).success).toBe(false);
    });
    it('rejects mismatched passwords', () => {
      expect(registerSchema.safeParse({ ...valid, confirmPassword: 'different' }).success).toBe(false);
    });
  });

  describe('createBookingSchema', () => {
    const now = new Date();
    const valid = {
      serviceId: 1,
      startAt: new Date(now.getTime() + 3600000).toISOString(),
      endAt: new Date(now.getTime() + 7200000).toISOString(),
    };
    it('accepts valid input', () => expect(createBookingSchema.safeParse(valid).success).toBe(true));
    it('rejects missing serviceId', () => {
      expect(createBookingSchema.safeParse({ startAt: valid.startAt, endAt: valid.endAt }).success).toBe(false);
    });
  });

  describe('rescheduleBookingSchema', () => {
    const valid = { startAt: new Date().toISOString(), endAt: new Date().toISOString() };
    it('accepts valid input', () => expect(rescheduleBookingSchema.safeParse(valid).success).toBe(true));
  });

  describe('rejectBookingSchema', () => {
    it('accepts a rejection reason', () => {
      // schema uses field name "reason" not "rejectionReason"
      expect(rejectBookingSchema.safeParse({ reason: 'Unavailable' }).success).toBe(true);
    });
    it('rejects empty reason', () => {
      expect(rejectBookingSchema.safeParse({ reason: '' }).success).toBe(false);
    });
  });

  describe('createServiceSchema', () => {
    const valid = {
      categoryId: 1, providerId: 2,
      title: 'Test Service', description: 'A detailed description here.', location: 'Hall A',
      durationMinutes: 30, isActive: true,
    };
    it('accepts valid input', () => expect(createServiceSchema.safeParse(valid).success).toBe(true));
    it('rejects empty title', () => {
      expect(createServiceSchema.safeParse({ ...valid, title: '' }).success).toBe(false);
    });
    it('rejects short description', () => {
      expect(createServiceSchema.safeParse({ ...valid, description: 'Short' }).success).toBe(false);
    });
  });

  describe('createAvailabilitySchema', () => {
    const start = new Date();
    const end = new Date(start.getTime() + 3_600_000);
    const valid = { serviceId: 1, startAt: start.toISOString(), endAt: end.toISOString() };
    it('accepts valid input with endAt > startAt', () => expect(createAvailabilitySchema.safeParse(valid).success).toBe(true));
    it('rejects when endAt <= startAt', () => {
      expect(createAvailabilitySchema.safeParse({ ...valid, endAt: start.toISOString() }).success).toBe(false);
    });
  });

  describe('profileUpdateSchema', () => {
    it('accepts a full profile update', () => {
      expect(profileUpdateSchema.safeParse({ firstName: 'Bob', lastName: 'Smith', email: 'bob@wsu.edu' }).success).toBe(true);
    });
    it('rejects missing email', () => {
      expect(profileUpdateSchema.safeParse({ firstName: 'Bob', lastName: 'S' }).success).toBe(false);
    });
  });

  describe('apiErrorSchema', () => {
    it('accepts a standard error body', () => {
      expect(apiErrorSchema.safeParse({ code: 'NOT_FOUND', message: 'Gone' }).success).toBe(true);
    });
    it('accepts a body with fieldErrors', () => {
      expect(apiErrorSchema.safeParse({ code: 'VALIDATION_ERROR', message: 'Bad', fieldErrors: { email: 'Invalid' } }).success).toBe(true);
    });
    it('rejects unknown code', () => {
      expect(apiErrorSchema.safeParse({ code: 'MYSTERY', message: 'x' }).success).toBe(false);
    });
  });

  describe('authResponseSchema', () => {
    it('accepts a valid auth response', () => {
      const body = {
        token: 'tok.tok.tok',
        user: { id: 1, email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'student', isBanned: false, createdAt: new Date().toISOString() },
      };
      expect(authResponseSchema.safeParse(body).success).toBe(true);
    });
  });

  describe('bookingSchema', () => {
    it('accepts a valid booking object', () => {
      const body = {
        id: 1, serviceId: 1, serviceTitle: 'Svc', providerName: 'P', studentId: 2, studentName: 'S',
        startAt: new Date().toISOString(), endAt: new Date().toISOString(), status: 'pending',
        notes: null, rejectionReason: null, location: 'Hall', createdAt: new Date().toISOString(),
      };
      expect(bookingSchema.safeParse(body).success).toBe(true);
    });
  });

  describe('serviceSchema round-trip', () => {
    it('accepts a valid service object', () => {
      const body = {
        id: 1, categoryId: 1, categoryName: 'Advising', providerId: 2, providerName: 'P',
        title: 'T', description: 'D', location: 'L', durationMinutes: 30, isActive: true,
      };
      expect(serviceSchema.safeParse(body).success).toBe(true);
    });
  });

  describe('enum schemas', () => {
    it('roleSchema rejects unknown values', () => {
      expect(roleSchema.safeParse('superadmin').success).toBe(false);
    });
    it('bookingStatusSchema rejects unknown values', () => {
      expect(bookingStatusSchema.safeParse('unknown').success).toBe(false);
    });
    it('notificationTypeSchema rejects unknown values', () => {
      expect(notificationTypeSchema.safeParse('foo').success).toBe(false);
    });
  });
});
