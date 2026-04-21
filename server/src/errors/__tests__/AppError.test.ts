import { AppError } from '../../errors/AppError.js';

describe('AppError', () => {
  it('sets code, message, and correct HTTP status for UNAUTHENTICATED', () => {
    const err = new AppError('UNAUTHENTICATED', 'Not logged in');
    expect(err.code).toBe('UNAUTHENTICATED');
    expect(err.status).toBe(401);
    expect(err.message).toBe('Not logged in');
    expect(err.fieldErrors).toBeUndefined();
  });

  it('sets status 400 for VALIDATION_ERROR with fieldErrors', () => {
    const err = new AppError('VALIDATION_ERROR', 'Bad input', { email: 'Invalid' });
    expect(err.status).toBe(400);
    expect(err.fieldErrors).toEqual({ email: 'Invalid' });
  });

  it('sets status 403 for FORBIDDEN', () => {
    expect(new AppError('FORBIDDEN', 'No access').status).toBe(403);
  });

  it('sets status 404 for NOT_FOUND', () => {
    expect(new AppError('NOT_FOUND', 'Missing').status).toBe(404);
  });

  it('sets status 409 for CONFLICT', () => {
    expect(new AppError('CONFLICT', 'Duplicate').status).toBe(409);
  });

  it('sets status 500 for INTERNAL', () => {
    expect(new AppError('INTERNAL', 'Boom').status).toBe(500);
  });

  it('is an instance of Error', () => {
    expect(new AppError('NOT_FOUND', 'x')).toBeInstanceOf(Error);
  });
});
