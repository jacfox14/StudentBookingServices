#!/bin/sh
set -e

: "${DB_HOST:=db}"
: "${DB_PORT:=3306}"

echo "Waiting for MySQL at ${DB_HOST}:${DB_PORT}..."
while ! nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done
echo "MySQL is reachable."

echo "Running migrations..."
npx --no-install sequelize-cli db:migrate --env production

echo "Running seeders (idempotent via sequelize seederStorage)..."
npx --no-install sequelize-cli db:seed:all --env production || true

echo "Starting API server..."
exec npx --no-install tsx src/index.ts
