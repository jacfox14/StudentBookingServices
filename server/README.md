# SBS Server

Express + Sequelize + MySQL API for Student Booking Services.

## Setup

1. Install MySQL 8 locally and start it, or run via Docker:
   ```
   docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=dev --name sbs-mysql mysql:8
   ```
2. Create the databases:
   ```sql
   CREATE DATABASE sbs_dev;
   CREATE DATABASE sbs_test;
   ```
3. Copy env:
   ```
   cp .env.example .env
   ```
   Edit `DB_USER`, `DB_PASS`, and `JWT_SECRET` to taste.
4. From the repo root (to use workspaces):
   ```
   npm install
   ```

## Run

From `server/`:

```
npm run db:migrate   # create tables
npm run db:seed      # load demo data
npm run dev          # start API on :4000 with hot reload
```

Drop-and-recreate:

```
npm run db:reset
```

## Demo accounts

All passwords: `password123`

| Email | Role |
|---|---|
| admin@wsu.edu | admin |
| advisor@wsu.edu | staff |
| librarian@wsu.edu | staff |
| counselor@wsu.edu | staff |
| career@wsu.edu | staff |
| alex@wsu.edu | student |
| sam@wsu.edu | student |
| banned@wsu.edu | student (banned) |

## Export DB for submission

```
mysqldump --routines --no-tablespaces -u root -p sbs_dev > db/dump.sql
```

Restore on a grader's machine:

```
mysql -u root -p sbs_dev < db/dump.sql
```
