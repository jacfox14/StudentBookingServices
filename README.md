# StudentBookingServices

A full-stack web application that allows university students to browse campus services, book appointments, and manage their schedules. Staff providers manage their availability and approve or reject requests; admins oversee users, services, and reporting.

Built for **CPTS 489 – Web Application Development**, Washington State University.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Option A: Run with Docker](#option-a-run-with-docker)
- [Option B: Run Locally Without Docker](#option-b-run-locally-without-docker)
- [Environment Variables](#environment-variables)
- [Database Restore](#database-restore)
- [Demo Accounts](#demo-accounts)
- [Running Tests](#running-tests)
- [API Overview](#api-overview)
- [System Architecture](#system-architecture)
- [User Roles](#user-roles)
- [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, React Router v6, TanStack Query, React Hook Form, Zod, Bootstrap 5, Axios |
| **Backend** | Node.js 20, Express 4, TypeScript, Sequelize 6 ORM |
| **Database** | MySQL 8 |
| **Auth** | JWT (Bearer token) + bcryptjs |
| **Shared** | Zod schemas in an npm workspace consumed by both client and server |
| **Testing** | Jest + Supertest (server), Vitest + Testing Library + MSW (client) |
| **Build / DevOps** | npm workspaces monorepo, Docker + docker compose |

---

## Project Structure

```
StudentBookingServices/
├── client/                     # React SPA (Vite) + Dockerfile (nginx)
├── server/                     # Express REST API + Dockerfile
│   ├── src/
│   │   ├── controllers/        # Thin request handlers
│   │   ├── services/           # Business logic (auth, booking conflict detection)
│   │   ├── models/             # Sequelize models
│   │   ├── routes/             # Express routers
│   │   ├── middleware/         # Auth, role checks, validation, error handling
│   │   ├── dto/                # Response serialization
│   │   └── utils/              # JWT, password, date helpers
│   ├── db/
│   │   ├── migrations/         # Sequelize CLI migrations (schema)
│   │   └── seeders/            # Demo data seeder (users, services, bookings)
│   └── docker-entrypoint.sh    # Waits for MySQL, runs migrations + seeds, starts API
├── shared/                     # Zod schemas + TS types shared by client & server
├── docker-compose.yml          # MySQL + backend + frontend (one-command bring-up)
└── .env.example                # Root env template (used by docker compose)
```

---

## Quick Start

If you just want to run the app, the fastest path is Docker:

```bash
git clone <repo-url> StudentBookingServices
cd StudentBookingServices
cp .env.example .env
# edit .env: set JWT_SECRET to any string at least 16 characters long
docker compose up --build
```

Then open <http://localhost:3000> and log in with one of the [demo accounts](#demo-accounts).

For a full explanation of both run paths, see the two sections below.

---

## Option A: Run with Docker

Recommended. Starts MySQL 8, the API, and the nginx-served frontend in one command. No local Node or MySQL install required — only Docker.

### Prerequisites

- **Docker Desktop 4.x+** (or Docker Engine 24+ with the `compose` plugin on Linux)

### Steps

**1. Configure environment variables**

The root-level `.env.example` is consumed by `docker-compose.yml`. Copy it and fill in a JWT secret:

```bash
cp .env.example .env
```

Open `.env` and set `JWT_SECRET` to any random string at least 16 characters long. The other defaults (`DB_NAME=sbs_dev`, `DB_USER=sbs`, etc.) are fine for local use.

**2. Build and start all services**

```bash
docker compose up --build
```

This launches three containers:

| Service | Port (host) | Description |
|---------|-------------|-------------|
| `db` | _internal only_ | MySQL 8 with a persistent `db_data` volume |
| `backend` | `4000` | Express API (Node 20) |
| `frontend` | `3000` | nginx serving the built React SPA |

The backend container automatically waits for MySQL, runs all Sequelize migrations, and runs the demo-data seeder on first boot (see `server/docker-entrypoint.sh`). No separate restore step is needed.

**3. Open the application**

Browse to <http://localhost:3000>. The nginx frontend proxies `/api/*` calls to the backend container.

**4. Stop the stack**

```bash
docker compose down            # stop and remove containers (data preserved)
docker compose down -v         # also delete the MySQL volume (start fresh next time)
```

### Re-seeding inside Docker

The seeder is idempotent (Sequelize `seederStorage: 'sequelize'`), so it will not duplicate rows on restart. To wipe and re-seed:

```bash
docker compose down -v         # drops the MySQL volume
docker compose up --build      # migrations + seeds run again on first boot
```

---

## Option B: Run Locally Without Docker

Use this if you prefer running the API and Vite dev server directly on your machine — for example, to use hot module reload, attach a debugger, or work offline.

### Prerequisites

- **Node.js 20+** and **npm 10+**
- **MySQL 8** running locally (any install method — Homebrew, apt, MySQL installer, or a standalone Docker container)

### Steps

**1. Install dependencies**

From the project root, install all workspace packages at once:

```bash
npm install
```

This installs dependencies for `shared/`, `server/`, and `client/` together via npm workspaces.

**2. Configure environment variables**

The local (non-Docker) workflow uses **per-package** env files, not the root `.env`:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env` and set:

- `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT` — credentials for your local MySQL
- `DB_NAME` — for example, `sbs_dev` (the database itself is created in step 3)
- `JWT_SECRET` — any random string at least 16 characters long

The default `client/.env` can be used as-is — Vite proxies `/api/*` to `http://localhost:4000` automatically.

**3. Create the database and load demo data**

Create an empty database in MySQL, then run the migrations and seeders:

```bash
# Create the empty schema (one-time, from any MySQL client)
mysql -u root -p -e "CREATE DATABASE sbs_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Apply schema and demo data
cd server
npm run db:migrate
npm run db:seed
```

Or, after the database exists, run everything in one command:

```bash
cd server
npm run db:reset      # undo seeds + migrations, re-migrate, re-seed
```

See [Database Restore](#database-restore) for more details and the `mysqldump` option.

**4. Start the dev servers**

Open two terminals:

```bash
# Terminal 1 — API server (http://localhost:4000)
cd server
npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd client
npm run dev
```

The Vite dev server proxies all `/api/*` requests to `localhost:4000`, so no CORS configuration is needed during development.

**5. Build for production (optional)**

```bash
# From the project root
npm run build

# Then run the compiled API
cd server
npm start
```

The compiled client lives at `client/dist/` and can be served by any static host (nginx, Cloudflare Pages, etc.) or by Express directly.

---

## Environment Variables

### Root `.env` (used by `docker compose`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_NAME` | `sbs_dev` | MySQL database name |
| `DB_USER` | `sbs` | MySQL non-root user |
| `DB_PASS` | `changeme` | Password for `DB_USER` |
| `DB_ROOT_PASS` | `changemeroot` | Password for the MySQL `root` user |
| `JWT_SECRET` | _(required)_ | Secret used to sign JWTs. **Must be at least 16 characters.** |
| `JWT_TTL` | `12h` | Token lifespan |
| `BCRYPT_ROUNDS` | `12` | bcrypt cost factor for password hashing |
| `CLIENT_ORIGIN` | `http://localhost:3000` | CORS origin the backend will accept |

### `server/.env` (used by `npm run dev` / `npm start`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Express server port |
| `NODE_ENV` | `development` | `development` / `production` / `test` |
| `DB_HOST` | `127.0.0.1` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_NAME` | `sbs_dev` | Database name |
| `DB_USER` | `root` | MySQL user |
| `DB_PASS` | `dev` | MySQL password |
| `DB_NAME_TEST` | `sbs_test` | Database used by the Jest test suite |
| `JWT_SECRET` | _(required)_ | Secret used to sign JWTs (≥ 16 chars) |
| `JWT_TTL` | `12h` | Token lifespan |
| `BCRYPT_ROUNDS` | `12` | bcrypt cost factor |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS origin the backend will accept |

### `client/.env`

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `/api` | API base path (proxied to backend in dev) |
| `VITE_USE_MSW` | `false` | Set to `true` to use MSW mocks for offline UI work |

---

## Database Restore

The schema and demo data live as Sequelize migrations and seeders under `server/db/`, so the canonical restore path is:

```bash
cd server
npm run db:migrate    # creates all tables
npm run db:seed       # loads demo users, services, availability, and bookings
```

`npm run db:reset` does both in one shot (and undoes any prior seeds first).

### Importing a SQL dump

If you would rather restore from a `mysqldump` file, the project includes one at `server/db/dump.sql` (when present in the submitted ZIP):

```bash
# Create the database, then pipe the dump into it
mysql -u root -p -e "CREATE DATABASE sbs_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p sbs_dev < server/db/dump.sql
```

To regenerate the dump from a freshly seeded local database:

```bash
mysqldump -u root -p --databases sbs_dev > server/db/dump.sql
```

---

## Demo Accounts

After running migrations + seeds (either via Docker auto-boot, `npm run db:reset`, or importing the SQL dump), the following accounts are available. **Password for every account is `password123`.**

| Role | Email |
|------|-------|
| **Admin** | `admin@wsu.edu` |
| **Staff** (Academic Advisor) | `advisor@wsu.edu` |
| **Staff** (Librarian) | `librarian@wsu.edu` |
| **Staff** (Counselor) | `counselor@wsu.edu` |
| **Staff** (Career Services) | `career@wsu.edu` |
| **Student** | `alex@wsu.edu` |

Additional student accounts seeded for testing follow the same pattern (see `server/db/seeders/20260421000001-demo-data.cjs`).

---

## Running Tests

```bash
# Run all tests (server + client)
npm run test

# Server tests only (Jest + Supertest, hits a live MySQL test DB)
npm run test:server

# Client tests only (Vitest + Testing Library + MSW)
npm run test:client
```

Server tests require a running MySQL instance. The test suite uses a separate database configured via `DB_NAME_TEST` (default `sbs_test`) in `server/.env`.

---

## API Overview

The API is versioned under `/api` and returns JSON. All protected routes require an `Authorization: Bearer <token>` header.

Error responses follow a consistent shape:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Human-readable description",
  "fieldErrors": { "email": "Invalid email address" }
}
```

### Route Groups

| Group | Prefix | Description |
|-------|--------|-------------|
| Auth | `/api/auth` | Register, login, password reset |
| Users | `/api/users` | Profile read/update |
| Services | `/api/services` | Browse services, check availability |
| Bookings | `/api/bookings` | Create, view, reschedule, cancel, approve/reject |
| Provider | `/api/provider` | Manage availability slots and incoming requests |
| Notifications | `/api/notifications` | In-app alert feed |
| Admin | `/api/admin` | User management, service CRUD, KPI reports |

The full route table (HTTP method, path, description, auth/role required) is in **Section 2 of the project report**.

---

## System Architecture

The application follows a **three-tier architecture** within an npm workspaces monorepo.

### Backend (Express)

Requests flow through a layered pipeline:

```
Request → Middleware (auth, role, validation) → Controller → Service → Model → Database
```

- **Controllers** are thin; they extract request data and delegate to services.
- **Services** hold all business logic (e.g. `BookingService` detects scheduling conflicts using a `SERIALIZABLE` database transaction).
- **Models** are plain Sequelize definitions with no business logic.
- **Middleware** handles cross-cutting concerns: JWT verification (`requireAuth`), role gating (`requireRole`), Zod validation (`validate`), and centralised error formatting (`errorHandler`).

### Frontend (React SPA)

- **React Router v6** handles client-side navigation with a `ProtectedRoute` wrapper that redirects unauthenticated or unauthorised users.
- **TanStack Query** manages all server state (fetching, caching, background refetching, and cache invalidation after mutations).
- **React Hook Form + Zod** handles form state and validation, sharing the same schemas as the backend via the `shared` package.
- **AuthContext** stores the current user, JWT token, and role in React context; the Axios interceptor attaches the token to every request automatically.

### Shared Package

The `shared/` workspace publishes Zod schemas and their inferred TypeScript types. Both the server validation middleware and the client's form validation import from this package, ensuring the validation rules are never duplicated or out of sync.

### Database (MySQL 8 — 7 tables)

| Table | Purpose |
|-------|---------|
| `users` | Accounts with role (`student`, `staff`, `admin`), `is_banned` soft-delete flag |
| `service_categories` | Lookup table (Advising, Library, Counselling, etc.) |
| `services` | Provider-owned bookable services with duration and location |
| `availability_blocks` | Provider time slots linked to a service |
| `bookings` | Appointments linking a student to a service slot; status ENUM tracks lifecycle |
| `notifications` | In-app alerts delivered to users |
| `audit_log` | Immutable record of privileged admin actions |

---

## User Roles

| Role | Capabilities |
|------|-------------|
| **Student** | Browse services, view availability, create / reschedule / cancel bookings, receive notifications |
| **Staff (Provider)** | Manage their own availability, approve or reject student bookings |
| **Admin** | Full access — manage all users, services, and view KPI reports |

---

## Troubleshooting

**`docker compose up` fails with `JWT_SECRET must be at least 16 characters`**
Edit the root `.env` and set `JWT_SECRET` to a longer random string, then re-run `docker compose up`.

**Port 3306 / 4000 / 3000 already in use**
Stop whatever is using the port (a local MySQL service, another dev server, etc.) or change the host-side port in `docker-compose.yml`.

**Local `npm run db:migrate` errors with `ER_ACCESS_DENIED`**
The credentials in `server/.env` don't match your local MySQL. Confirm with `mysql -u <DB_USER> -p` and update `DB_USER` / `DB_PASS` accordingly.

**`npm install` fails on a fresh clone**
Make sure you are on Node 20+ (`node --version`). The repo uses npm workspaces, which requires npm 10+.

**Frontend loads but every API call returns 401**
The JWT in localStorage may have expired. Log out and log back in, or clear `localStorage` in the browser devtools.

---

## Team

This project was developed for CPTS 489 – Web Application Development at Washington State University. See the project report (PDF) for team member names and individual contributions.
