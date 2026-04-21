import {
  toUserDTO,
  toCategoryDTO,
  toServiceDTO,
  toAvailabilityDTO,
  toBookingDTO,
  toNotificationDTO,
} from '../../dto/index.js';
import {
  userSchema,
  serviceCategorySchema,
  serviceSchema,
  availabilityBlockSchema,
  bookingSchema,
  notificationSchema,
} from '@sbs/shared';

// Minimal mock model builders
const baseDate = new Date('2026-04-21T10:00:00Z');
const isoDate = baseDate.toISOString();

function makeUser(overrides = {}) {
  return {
    id: 1, email: 'a@test.com', passwordHash: 'hash',
    firstName: 'Alice', lastName: 'Smith', role: 'student' as const,
    isBanned: false, emailVerifiedAt: null,
    createdAt: baseDate, updatedAt: baseDate,
    ...overrides,
  };
}

describe('DTO serializers', () => {
  describe('toUserDTO', () => {
    it('conforms to userSchema', () => {
      const dto = toUserDTO(makeUser() as never);
      expect(userSchema.safeParse(dto).success).toBe(true);
    });

    it('createdAt is an ISO string', () => {
      const dto = toUserDTO(makeUser() as never);
      expect(dto.createdAt).toBe(isoDate);
    });
  });

  describe('toCategoryDTO', () => {
    it('conforms to serviceCategorySchema', () => {
      const cat = { id: 1, name: 'Advising', icon: '🎓', createdAt: baseDate, updatedAt: baseDate };
      const dto = toCategoryDTO(cat as never);
      expect(serviceCategorySchema.safeParse(dto).success).toBe(true);
    });

    it('converts null icon to undefined', () => {
      const cat = { id: 1, name: 'Advising', icon: null, createdAt: baseDate, updatedAt: baseDate };
      const dto = toCategoryDTO(cat as never);
      expect(dto.icon).toBeUndefined();
    });
  });

  describe('toServiceDTO', () => {
    it('conforms to serviceSchema with relations', () => {
      const svc = {
        id: 1, categoryId: 1, providerId: 2,
        title: 'Advising', description: 'Help', location: 'Hall 1',
        durationMinutes: 30, isActive: true,
        createdAt: baseDate, updatedAt: baseDate,
        category: { id: 1, name: 'Advising', icon: '🎓' },
        provider: { id: 2, firstName: 'Bob', lastName: 'Jones' },
      };
      const dto = toServiceDTO(svc as never);
      expect(serviceSchema.safeParse(dto).success).toBe(true);
      expect(dto.categoryName).toBe('Advising');
      expect(dto.providerName).toBe('Bob Jones');
    });

    it('falls back to empty strings when relations are missing', () => {
      const svc = {
        id: 1, categoryId: 1, providerId: 2,
        title: 'Svc', description: 'Desc', location: 'Loc',
        durationMinutes: 30, isActive: true,
        createdAt: baseDate, updatedAt: baseDate,
        category: null, provider: null,
      };
      const dto = toServiceDTO(svc as never);
      expect(dto.categoryName).toBe('');
      expect(dto.providerName).toBe('');
    });
  });

  describe('toAvailabilityDTO', () => {
    it('conforms to availabilityBlockSchema', () => {
      const block = { id: 1, serviceId: 1, startAt: baseDate, endAt: baseDate, createdAt: baseDate, updatedAt: baseDate };
      const dto = toAvailabilityDTO(block as never);
      expect(availabilityBlockSchema.safeParse(dto).success).toBe(true);
      expect(dto.startAt).toBe(isoDate);
    });
  });

  describe('toBookingDTO', () => {
    const bookingBase = {
      id: 5, serviceId: 1, studentId: 10,
      startAt: baseDate, endAt: baseDate,
      status: 'pending' as const,
      notes: null, rejectionReason: null,
      createdAt: baseDate, updatedAt: baseDate,
    };

    it('conforms to bookingSchema with relations', () => {
      const booking = {
        ...bookingBase,
        service: {
          title: 'Advising', location: 'Hall',
          provider: { firstName: 'Staff', lastName: 'User' },
        },
        student: { firstName: 'Alex', lastName: 'J' },
      };
      const dto = toBookingDTO(booking as never);
      expect(bookingSchema.safeParse(dto).success).toBe(true);
      expect(dto.serviceTitle).toBe('Advising');
      expect(dto.providerName).toBe('Staff User');
      expect(dto.studentName).toBe('Alex J');
    });

    it('dates are ISO strings not Date objects', () => {
      const dto = toBookingDTO({ ...bookingBase, service: null, student: null } as never);
      expect(typeof dto.startAt).toBe('string');
      expect(typeof dto.createdAt).toBe('string');
    });

    it('notes and rejectionReason are null when absent', () => {
      const dto = toBookingDTO({ ...bookingBase, service: null, student: null } as never);
      expect(dto.notes).toBeNull();
      expect(dto.rejectionReason).toBeNull();
    });
  });

  describe('toNotificationDTO', () => {
    it('conforms to notificationSchema', () => {
      const notif = {
        id: 1, userId: 10, type: 'booking_created' as const,
        payload: { bookingId: 5 }, readAt: null,
        createdAt: baseDate, updatedAt: baseDate,
      };
      const dto = toNotificationDTO(notif as never);
      expect(notificationSchema.safeParse(dto).success).toBe(true);
      expect(dto.readAt).toBeNull();
    });

    it('serializes readAt as ISO string when set', () => {
      const notif = {
        id: 1, userId: 10, type: 'booking_approved' as const,
        payload: {}, readAt: baseDate,
        createdAt: baseDate, updatedAt: baseDate,
      };
      const dto = toNotificationDTO(notif as never);
      expect(dto.readAt).toBe(isoDate);
    });
  });
});
