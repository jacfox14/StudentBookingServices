import request from 'supertest';
import { createApp } from '../../app.js';
import { apiErrorSchema, authResponseSchema } from '@sbs/shared';
import { truncateAll, closeDb, seed } from '../../test/helpers.js';

const app = createApp();

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await truncateAll();
    await seed();
  });
  afterAll(closeDb);

  it('returns 200 + token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(authResponseSchema.safeParse(res.body).success).toBe(true);
    expect(typeof res.body.token).toBe('string');
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@test.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 when account is banned', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'banned@test.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('returns 400 VALIDATION_ERROR for missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
  });
});

describe('POST /api/auth/register', () => {
  beforeEach(truncateAll);
  afterAll(closeDb);

  it('returns 201 + token for a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'newuser@test.com',
      password: 'password123',
      confirmPassword: 'password123',
      firstName: 'New',
      lastName: 'User',
      role: 'student',
    });

    expect(res.status).toBe(201);
    expect(authResponseSchema.safeParse(res.body).success).toBe(true);
  });

  it('returns 409 CONFLICT for duplicate email', async () => {
    const payload = {
      email: 'dup@test.com', password: 'password123', confirmPassword: 'password123', firstName: 'Alice', lastName: 'B', role: 'student',
    };
    await request(app).post('/api/auth/register').send(payload);
    const res = await request(app).post('/api/auth/register').send(payload);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
  });
});

describe('POST /api/auth/logout', () => {
  afterAll(closeDb);

  it('returns 204 (session-less, just a signal)', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(204);
  });
});
