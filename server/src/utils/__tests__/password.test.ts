import { hashPassword, verifyPassword } from '../../utils/password.js';

describe('password utils', () => {
  const plain = 'hunter2!';

  it('hashPassword produces a bcrypt hash', async () => {
    const hash = await hashPassword(plain);
    expect(hash).toMatch(/^\$2[ab]\$/);
    expect(hash).not.toBe(plain);
  });

  it('verifyPassword returns true for the correct password', async () => {
    const hash = await hashPassword(plain);
    await expect(verifyPassword(plain, hash)).resolves.toBe(true);
  });

  it('verifyPassword returns false for the wrong password', async () => {
    const hash = await hashPassword(plain);
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('two hashes of the same plaintext are different (salt randomness)', async () => {
    const h1 = await hashPassword(plain);
    const h2 = await hashPassword(plain);
    expect(h1).not.toBe(h2);
  });
});
