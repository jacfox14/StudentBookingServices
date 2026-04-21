/**
 * Runs once before all test suites in the main Jest process.
 * Prereq: MySQL must be running. Creates sbs_test DB if missing, then runs migrations.
 */
const { execSync } = require('child_process');
const path = require('path');

module.exports = async function globalSetup() {
  // Load .env so DB credentials are available
  require('dotenv').config({ path: path.resolve(__dirname, '.env') });

  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const pass = process.env.DB_PASS || 'dev';

  // Create sbs_test DB if it doesn't exist
  try {
    const mysql = require('mysql2/promise');
    const conn = await mysql.createConnection({ host, port, user, password: pass });
    await conn.query('CREATE DATABASE IF NOT EXISTS sbs_test');
    await conn.query('USE sbs_test');
    await conn.end();
  } catch (err) {
    console.warn(
      '\n⚠️  Could not connect to MySQL — skipping DB setup.\n' +
      '   Run MySQL on port ' + port + ' with user "' + user + '" to enable server integration tests.\n' +
      '   Error: ' + err.message + '\n'
    );
    // Don't throw — let test files fail gracefully with connection errors
    return;
  }

  // Run sequelize-cli migrations against sbs_test
  try {
    execSync('node_modules/.bin/sequelize-cli db:migrate --env test', {
      cwd: __dirname,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'test',
        DB_HOST: host,
        DB_PORT: String(port),
        DB_USER: user,
        DB_PASS: pass,
      },
    });
  } catch (err) {
    console.error('Migration failed:', err.message);
    throw err;
  }
};
