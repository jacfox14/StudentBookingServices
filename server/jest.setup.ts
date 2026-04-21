// Set test env vars BEFORE any server module is imported.
// env.ts reads from process.env on first import, so these must be set here.
process.env.DB_NAME = 'sbs_test';
process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1';
process.env.DB_PORT = process.env.DB_PORT || '3306';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASS = process.env.DB_PASS || 'dev';
process.env.JWT_SECRET = 'test-jwt-secret-minimum-16-chars!!';
process.env.JWT_TTL = '1h';
process.env.BCRYPT_ROUNDS = '4'; // low rounds for speed
process.env.NODE_ENV = 'test';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
