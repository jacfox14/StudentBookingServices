import { hashPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import {
  sequelize,
  User,
  ServiceCategory,
  Service,
  AvailabilityBlock,
  Booking,
} from '../models/index.js';

/** Truncate all tables in safe order (no FK violations). */
export async function truncateAll() {
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of ['audit_log', 'notifications', 'bookings', 'availability_blocks', 'services', 'service_categories', 'users']) {
    await sequelize.query(`DELETE FROM \`${table}\``);
  }
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
}

/** Close the sequelize pool after a test suite. */
export async function closeDb() {
  await sequelize.close();
}

export interface SeedResult {
  admin: User;
  staff: User;
  student: User;
  bannedStudent: User;
  category: ServiceCategory;
  service: Service;
  inactiveService: Service;
  studentToken: string;
  staffToken: string;
  adminToken: string;
}

/** Seed a minimal consistent dataset for integration tests. */
export async function seed(): Promise<SeedResult> {
  const adminUser = await User.create({
    email: 'admin@test.com',
    passwordHash: await hashPassword('password123'),
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isBanned: false,
    emailVerifiedAt: null,
  });

  const staffUser = await User.create({
    email: 'staff@test.com',
    passwordHash: await hashPassword('password123'),
    firstName: 'Staff',
    lastName: 'User',
    role: 'staff',
    isBanned: false,
    emailVerifiedAt: null,
  });

  const studentUser = await User.create({
    email: 'student@test.com',
    passwordHash: await hashPassword('password123'),
    firstName: 'Student',
    lastName: 'User',
    role: 'student',
    isBanned: false,
    emailVerifiedAt: null,
  });

  const bannedUser = await User.create({
    email: 'banned@test.com',
    passwordHash: await hashPassword('password123'),
    firstName: 'Banned',
    lastName: 'User',
    role: 'student',
    isBanned: true,
    emailVerifiedAt: null,
  });

  const cat = await ServiceCategory.create({ name: 'Advising', icon: '🎓' });

  const svc = await Service.create({
    categoryId: cat.id,
    providerId: staffUser.id,
    title: 'Academic Advising',
    description: 'One-on-one advising session',
    location: 'Sloan Hall 210',
    durationMinutes: 30,
    isActive: true,
  });

  const inactiveSvc = await Service.create({
    categoryId: cat.id,
    providerId: staffUser.id,
    title: 'Inactive Service',
    description: 'Not accepting bookings',
    location: 'Room 0',
    durationMinutes: 30,
    isActive: false,
  });

  const makeJwt = (u: User) => signToken({ sub: u.id, role: u.role, email: u.email });

  return {
    admin: adminUser,
    staff: staffUser,
    student: studentUser,
    bannedStudent: bannedUser,
    category: cat,
    service: svc,
    inactiveService: inactiveSvc,
    studentToken: makeJwt(studentUser),
    staffToken: makeJwt(staffUser),
    adminToken: makeJwt(adminUser),
  };
}

/** Create an availability block for the given service, defaulting to tomorrow 10-11am. */
export async function createAvailBlock(serviceId: number, offsetHours = 24) {
  const start = new Date(Date.now() + offsetHours * 3_600_000);
  const end = new Date(start.getTime() + 3_600_000);
  return AvailabilityBlock.create({ serviceId, startAt: start, endAt: end });
}

/** Create a booking for a student on a given service window. */
export async function createBooking(
  studentId: number,
  serviceId: number,
  start: Date,
  end: Date,
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' = 'pending'
) {
  return Booking.create({ studentId, serviceId, startAt: start, endAt: end, status });
}
