<h1 align="center">Biblio Squad</h1>
<p align="center">
  <img src="frontend/src/assets/images/bibliosquad-logo.png" alt="Biblio Squad" width="280" />
</p>
<h3 align="center">Room reservation &amp; daily income backoffice</h3>

Admin-only web app to manage rooms, professors, reservations (calendar + paid status), daily income, and users.

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

Locales: **en** (default), **fr**, **ar**.

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

## Backoffice modules

Protected under `/[locale]/(private)/` (sidebar). Roles: **ADMIN** (full manage), **USER** (limited read). Professors are entities, not login roles.

| Area | Routes |
| :--- | :--- |
| Dashboard | `/dashboard` |
| Calendar | `/calendar` (day / week / month; weekly PDF export per room) |
| Reservations | `/reservations` |
| Rooms | `/rooms` |
| Professors | `/professors`, `/professors/[id]` |
| Daily Income | `/daily-income` (ADMIN) |
| Users | `/users` (ADMIN) |

Reservation price is computed from duration × room `pricePerHour`. Daily income tracks day totals with auto savings/benefits (20% each) plus charge/investment lines.

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
| **Ops** | Docker Compose (Adminer only) |

## Docs

- [frontend/README.md](frontend/README.md)
- [backend/README.md](backend/README.md)
- Cursor frontend conventions: [.cursor/rules/FRONTEND_ARCHITECTURE.mdc](.cursor/rules/FRONTEND_ARCHITECTURE.mdc)
