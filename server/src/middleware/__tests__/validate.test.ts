import express, { type Request, type Response } from 'express';
import request from 'supertest';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { errorHandler } from '../../middleware/errorHandler.js';

const schema = z.object({ name: z.string().min(1), age: z.coerce.number().int().positive() });

function makeApp() {
  const app = express();
  app.use(express.json());
  app.post('/test', validate(schema), (req: Request, res: Response) => res.json(req.body));
  app.use(errorHandler);
  return app;
}

describe('validate middleware', () => {
  it('passes valid body and calls next', async () => {
    const res = await request(makeApp()).post('/test').send({ name: 'Alice', age: 20 });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Alice');
  });

  it('returns 400 VALIDATION_ERROR for missing required field', async () => {
    const res = await request(makeApp()).post('/test').send({ age: 20 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.fieldErrors?.name).toBeDefined();
  });

  it('returns fieldErrors for multiple invalid fields', async () => {
    const res = await request(makeApp()).post('/test').send({ name: '', age: -1 });
    expect(res.status).toBe(400);
    expect(res.body.fieldErrors?.name).toBeDefined();
    expect(res.body.fieldErrors?.age).toBeDefined();
  });

  it('coerces valid values before passing them downstream', async () => {
    // age is sent as string but schema coerces to number
    const res = await request(makeApp()).post('/test').send({ name: 'Bob', age: '25' });
    expect(res.status).toBe(200);
    expect(res.body.age).toBe(25);
  });
});
