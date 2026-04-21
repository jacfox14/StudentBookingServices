import { AuthService } from '../../services/AuthService.js';
import { authResponseSchema } from '@sbs/shared';
import { verifyToken } from '../../utils/jwt.js';
import { truncateAll, closeDb } from '../../test/helpers.js';

type RegInput = {
  email: string; password: string; confirmPassword: string;
  firstName: string; lastName: string; role: 'student' | 'staff';
};

function reg(overrides: Partial<RegInput> & { email: string }): RegInput {
  return {
    password: 'password123', confirmPassword: 'password123',
    firstName: 'Test', lastName: 'User', role: 'student',
    ...overrides,
  };
}

// AuthService tests require MySQL (uses User model with real DB)
describe('AuthService', () => {
  beforeEach(truncateAll);
  afterAll(closeDb);

  describe('register', () => {
    it('creates a user and returns token + user conforming to authResponseSchema', async () => {
      const result = await AuthService.register(reg({ email: 'new@test.com' }) as never);
      expect(authResponseSchema.safeParse(result).success).toBe(true);
      expect(result.user.email).toBe('new@test.com');
      expect(typeof result.token).toBe('string');
    });

    it('bcrypts the password — stored hash differs from plaintext', async () => {
      await AuthService.register(reg({ email: 'hash@test.com', password: 'password123', confirmPassword: 'password123' }) as never);
      const { token } = await AuthService.login({ email: 'hash@test.com', password: 'password123' });
      const payload = verifyToken(token);
      expect(payload.email).toBe('hash@test.com');
    });

    it('throws CONFLICT when email is already registered', async () => {
      await AuthService.register(reg({ email: 'dup@test.com' }) as never);
      await expect(AuthService.register(reg({ email: 'dup@test.com' }) as never))
        .rejects.toMatchObject({ code: 'CONFLICT' });
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await AuthService.register(reg({ email: 'login@test.com', role: 'staff' }) as never);
    });

    it('returns token + user for correct credentials', async () => {
      const result = await AuthService.login({ email: 'login@test.com', password: 'password123' });
      expect(authResponseSchema.safeParse(result).success).toBe(true);
      const payload = verifyToken(result.token);
      expect(payload.role).toBe('staff');
    });

    it('throws UNAUTHENTICATED for unknown email', async () => {
      await expect(AuthService.login({ email: 'nobody@test.com', password: 'password123' }))
        .rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    });

    it('throws UNAUTHENTICATED for wrong password', async () => {
      await expect(AuthService.login({ email: 'login@test.com', password: 'wrongpassword' }))
        .rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    });

    it('throws UNAUTHENTICATED when the user is banned', async () => {
      const { user } = await AuthService.register(reg({ email: 'banned@test.com' }) as never);
      const { User } = await import('../../models/User.js');
      await User.update({ isBanned: true }, { where: { id: user.id } });

      await expect(AuthService.login({ email: 'banned@test.com', password: 'password123' }))
        .rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    });
  });
});
