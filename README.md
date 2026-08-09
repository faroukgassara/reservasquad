<h1 align="center">Biblio Squad</h1>
<h3 align="center">Formation, coworking &amp; backoffice platform</h3>

## Prerequisites

- **Node.js** (LTS recommended)
- **PostgreSQL** (16+ recommended)
- **npm** (or compatible package manager)
- **Docker** (optional — for [Adminer](#adminer-db-ui) on port 8080)

## Quick start (local)

### 1. Database

Create a PostgreSQL database and set `DATABASE_URL` in `backend/.env` (see [backend/README.md](backend/README.md)).

Example:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DB_NAME?schema=public
```

Ensure PostgreSQL listens on `localhost:5432` (or adjust the URL).

### 2. Backend

```bash
cd backend
cp .env.example .env   # if you maintain an example file; otherwise create .env
npm install
npx prisma migrate deploy
npx prisma generate
npm run seed
npm run start:dev
```

API: [http://localhost:4000](http://localhost:4000)

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

Default locale: **en** (`/`, `/fr`, `/ar`).

## Default credentials (after seed)

Admin account is created by the seeder from `backend/.env`:

| Variable | Purpose |
| :--- | :--- |
| `ADMIN_EMAIL` | Login email |
| `ADMIN_PASSWORD` | Login password |
| `ADMIN_FIRSTNAME` / `ADMIN_LASTNAME` / `ADMIN_PHONE` | Profile fields |

| Service | URL | Notes |
| :--- | :--- | :--- |
| **Biblio Squad App** | [localhost:3000](http://localhost:3000) | Use `ADMIN_EMAIL` / `ADMIN_PASSWORD` |
| **PostgreSQL** | `localhost:5432` | Match `DATABASE_URL` |

Do **not** commit real passwords in docs or git.

## Adminer (DB UI)

```bash
docker compose up -d adminer
```

Open [http://localhost:8080](http://localhost:8080):

| Field | Value |
| :--- | :--- |
| System | PostgreSQL |
| Server | `host.docker.internal` |
| Username / Password / Database | Same as `DATABASE_URL` in `backend/.env` |

Stop: `docker compose stop adminer`

## Backoffice modules (ADMIN)

Protected under `/[locale]/(private)/` (sidebar):

| Area | Routes |
| :--- | :--- |
| Formations | `/formations`, categories, applications |
| Content | `/blogs`, `/faqs`, `/faq-categories`, `/testimonials` |
| Contact | `/contact-messages` |
| Coworking | `/coworking-rooms`, `/coworking-stats`, `/coworking-bookings` |
| Users | `/users` |
| **Ventes** | `/clients`, `/quotes`, `/invoices` (custom lines, TND, `DEV-` / `FAC-` numbering) |

## Ports

| Service | Port |
| :--- | :--- |
| Frontend | `3000` |
| Backend | `4000` |
| PostgreSQL | `5432` |
| Adminer | `8080` |

## Troubleshooting

- **Port in use:** Free the ports above or change them in `.env` / `.env.local`.
- **Database connection errors:** Confirm `DATABASE_URL` uses `localhost` (not a Docker hostname) for local Prisma / Nest.
- **Adminer cannot reach Postgres:** Use server `host.docker.internal`, not `localhost`.
- **Migrations:** From `backend/`, run `npx prisma migrate deploy` (prefer this over `db push`).
- **Reset database:** `npx prisma migrate reset` from `backend/` (destructive).

## Tech stack

| Layer | Stack |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind 4, TanStack Query/Form, NextAuth, next-intl |
| **Backend** | NestJS 11, Prisma 7, PostgreSQL, TypeScript |
| **Ops** | Docker Compose (Adminer), optional Nginx (see `deploy/`) |

## Docs

- [frontend/README.md](frontend/README.md)
- [backend/README.md](backend/README.md)
- Cursor frontend conventions: [.cursor/rules/FRONTEND_ARCHITECTURE.mdc](.cursor/rules/FRONTEND_ARCHITECTURE.mdc)
