# StudentBookingServices

A full-stack web application that allows university students to browse campus services, book appointments, and manage their schedules. Staff providers manage their availability and approve/reject requests; admins oversee users, services, and reporting.

Built for CPTS 489 – Web Application Development, Washington State University.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Commands](#database-commands)
- [Running Tests](#running-tests)
- [API Overview](#api-overview)
- [System Architecture](#system-architecture)
- [User Roles](#user-roles)
- [Demo Accounts](#demo-accounts)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, React Router v6, TanStack Query, React Hook Form, Zod, Bootstrap 5, Axios |
| **Backend** | Node.js, Express 4, TypeScript, Sequelize 6 ORM |
| **Database** | MySQL 8 |
| **Auth** | JWT (Bearer token) + bcryptjs |
| **Shared** | Zod schemas in an npm workspace consumed by both client and server |
| **Testing** | Jest + Supertest (server), Vitest + Testing Library + MSW (client) |
| **Build** | npm workspaces monorepo |

---

## Project Structure

```
StudentBookingServices/
├── client/          # React SPA (Vite)
├── server/          # Express REST API
│   ├── src/
│   │   ├── controllers/   # Thin request handlers
│   │   ├── services/      # Business logic (auth, booking conflict detection)
│   │   ├── models/        # Sequelize models
│   │   ├── routes/        # Express routers
│   │   ├── middleware/    # Auth, role checks, validation, error handling
│   │   ├── dto/           # Response serialization
│   │   └── utils/         # JWT, password, date helpers
│   └── db/
│       ├── migrations/    # Sequelize CLI migrations
│       └── seeders/       # Demo data seeder
└── shared/          # Zod schemas and TypeScript types (used by client + server)
```

---

## Prerequisites

- **Node.js** 20 or higher
- **npm** 10 or higher (comes with Node 20)
- **MySQL 8** running locally (or via Docker)

---

## Getting Started

### 1. Install dependencies

From the project root, install all workspace packages at once:

```bash
npm install
```

### 2. Configure environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env` with your MySQL credentials (see [Environment Variables](#environment-variables) below).

### 3. Set up the database

```bash
cd server
npm run db:reset      # Creates tables and loads demo data
```

### 4. Start the development servers

Open two terminals:

```bash
# Terminal 1 – API server (http://localhost:4000)
cd server
npm run dev

# Terminal 2 – Frontend (http://localhost:5173)
cd client
npm run dev
```

The Vite dev server proxies all `/api/*` requests to `localhost:4000`, so no CORS configuration is needed during development.

### 5. Build for production

```bash
# From the project root
npm run build

# Start the compiled server
node server/dist/index.js
```

Serve the `client/dist/` directory from a static file host or configure Express to serve it.

---

## Environment Variables

### `server/.env`

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Express server port |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_NAME` | `student_booking` | Database name |
| `DB_USER` | `root` | MySQL user |
| `DB_PASS` | _(empty)_ | MySQL password |
| `JWT_SECRET` | _(required)_ | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | `7d` | Token lifespan |
| `NODE_ENV` | `development` | `development` / `production` / `test` |

### `client/.env`

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `/api` | API base path (proxied in dev) |

---

## Database Commands

All commands are run from the `server/` directory.

| Command | Description |
|---------|-------------|
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Insert demo data |
| `npm run db:reset` | Drop all tables, re-migrate, re-seed |

---

## Running Tests

```bash
# Run all tests (server + client)
npm run test

# Server tests only (Jest + Supertest)
npm run test:server

# Client tests only (Vitest)
npm run test:client
```

Server tests require a running MySQL instance. The test suite uses a separate test database configured via `DB_NAME_TEST` in `server/.env`.

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

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for the full table of all 32 endpoints.

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

The `shared/` workspace publishes Zod schemas and their inferred TypeScript types. Both the server validation middleware and client form validation import from this package, ensuring the validation rules are never duplicated or out of sync.

### Database (MySQL 8 – 7 tables)

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
| **Student** | Browse services, view availability, create/cancel bookings, receive notifications |
| **Staff (Provider)** | Manage their own availability, approve or reject student bookings |
| **Admin** | Full access — manage all users, services, and view KPI reports |

---

## Demo Accounts

After running `npm run db:reset`, the following accounts are available:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@university.edu` | `password123` |
| Staff | `staff1@university.edu` | `password123` |
| Student | `student1@university.edu` | `password123` |

Additional staff and student accounts follow the same `staff2–4` / `student2–6` pattern.
