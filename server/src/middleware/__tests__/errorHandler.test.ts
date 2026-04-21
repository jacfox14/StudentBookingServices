import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { ZodError, z } from 'zod';
import { UniqueConstraintError } from 'sequelize';
import { AppError } from '../../errors/AppError.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import { apiErrorSchema } from '@sbs/shared';

function makeApp(throwFn: (req: Request, res: Response, next: NextFunction) => void) {
  const app = express();
  app.use(express.json());
  app.get('/test', (_req, _res, next) => { try { throwFn(_req, _res, next); } catch (e) { next(e); } });
  app.use(errorHandler);
  return app;
}

describe('errorHandler middleware', () => {
  it('maps AppError to its status + code', async () => {
    const app = makeApp((_req, _res, next) => next(new AppError('NOT_FOUND', 'Gone')));
    const res = await request(app).get('/test');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
  });

  it('maps AppError with fieldErrors', async () => {
    const app = makeApp((_req, _res, next) =>
      next(new AppError('VALIDATION_ERROR', 'Bad', { email: 'Required' }))
    );
    const res = await request(app).get('/test');
    expect(res.status).toBe(400);
    expect(res.body.fieldErrors.email).toBe('Required');
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
  });

  it('maps ZodError to 400 VALIDATION_ERROR with fieldErrors', async () => {
    const schema = z.object({ name: z.string().min(1) });
    const app = makeApp((_req, _res, next) => {
      const result = schema.safeParse({});
      if (!result.success) next(result.error);
    });
    const res = await request(app).get('/test');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.fieldErrors).toBeDefined();
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
  });

  it('maps UniqueConstraintError to 409 CONFLICT', async () => {
    const app = makeApp((_req, _res, next) => {
      const err = new UniqueConstraintError({ errors: [{ path: 'email', message: 'Must be unique', type: 'unique violation', origin: 'DB', instance: null, validatorKey: '', validatorArgs: [] } as never] });
      next(err);
    });
    const res = await request(app).get('/test');
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
  });

  it('maps unknown errors to 500 INTERNAL without stack leakage', async () => {
    const app = makeApp((_req, _res, next) => next(new Error('raw boom')));
    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
    expect(res.body.code).toBe('INTERNAL');
    expect(res.body.message).not.toMatch(/boom/i);
    expect(res.body.stack).toBeUndefined();
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
  });
});
