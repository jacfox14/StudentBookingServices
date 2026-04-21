import jwt from 'jsonwebtoken';
import { signToken, verifyToken } from '../../utils/jwt.js';
import { env } from '../../config/env.js';

const payload = { sub: 42, role: 'student' as const, email: 'test@wsu.edu' };

describe('jwt utils', () => {
  it('signToken produces a valid JWT string', () => {
    const token = signToken(payload);
    expect(typeof token).toBe('string');
    // JWT has 3 dot-separated parts
    expect(token.split('.')).toHaveLength(3);
  });

  it('verifyToken round-trips the payload', () => {
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.email).toBe(payload.email);
  });

  it('verifyToken throws on a tampered signature', () => {
    const token = signToken(payload);
    const tampered = token.slice(0, -5) + 'XXXXX';
    expect(() => verifyToken(tampered)).toThrow();
  });

  it('verifyToken throws on a token signed with a different secret', () => {
    const foreign = jwt.sign(payload, 'completely-different-secret-abc', { expiresIn: '1h' });
    expect(() => verifyToken(foreign)).toThrow();
  });

  it('verifyToken throws on an expired token', () => {
    const expired = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '-1s' });
    expect(() => verifyToken(expired)).toThrow(/expired/i);
  });
});
