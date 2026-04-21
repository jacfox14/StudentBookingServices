# SBS Client

React + TypeScript + Vite frontend for Student Booking Services.

## Quick start

```bash
# from the repo root (workspaces)
npm install

# run the client (port 5173) — uses MSW mocks by default
npm --workspace @sbs/client run dev
```

Visit http://localhost:5173.

## Demo accounts (via MSW mocks)

Password for all: `password123`

| Email              | Role    |
|--------------------|---------|
| alex@wsu.edu       | student |
| advisor@wsu.edu    | staff   |
| admin@wsu.edu      | admin   |

## Switching off mocks (to the real Express API)

```bash
# edit client/.env
VITE_USE_MSW=false
```

Then ensure the Express API is running on http://localhost:4000. Vite's dev
proxy forwards `/api/*` to that origin.

## Scripts

- `dev` — Vite dev server
- `build` — type-check + production build
- `test` — Vitest
- `preview` — preview the production build

## Directory guide

- `src/api/` — axios client and typed endpoint wrappers
- `src/components/` — `ui/`, `forms/`, `layout/`
- `src/pages/` — route-level views grouped by role
- `src/context/` — AuthContext + ToastContext
- `src/routes/` — ProtectedRoute, RoleRoute, AppRoutes
- `src/mocks/` — MSW handlers and fixtures
- `src/styles/legacy.css` — WSU crimson styles (copied from mockups)

Shared Zod schemas (used by both client and server) live in `../shared/`.
