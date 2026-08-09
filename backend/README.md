# Biblio Squad Backend

NestJS **11** API with **Prisma 7** and **PostgreSQL**.

## Prerequisites

- Node.js (LTS recommended)
- PostgreSQL reachable from your machine
- Stack overview: [repository root README](../README.md)

## Environment

Create `backend/.env` (never commit secrets). Important keys:

| Variable | Purpose |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` / `HOST` | HTTP listen (default `4000` / `0.0.0.0`) |
| `FRONT_URL` | Frontend origin (CORS / links) |
| `JWT_*` | Access, refresh, and reset-password secrets & TTLs |
| `SMTP_*` / `MAIL_SECURE` | Transactional email |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / … | Seeded super-admin |
| `UPLOAD_DIR` | Persistent uploads root (production) |
| `ENVIRONMENT` | e.g. `development` |

Typed loading: `src/common/env/env.ts`.

## Prisma (ORM 7)

- Connection / migrate config: **`prisma.config.ts`** (not only `schema.prisma`).
- Client output: **`src/generated/prisma`** (`npm run prisma:generate`; also `postinstall`).
- Driver: **`pg`** via **`@prisma/adapter-pg`** (`src/prisma/prisma.service.ts`).
- Prefer **`npx prisma migrate deploy`** (or `npm run prisma:migrate`) over `db push` so history stays consistent.
- Seed does **not** always auto-run after migrate in v7 — use **`npm run seed`**.

## Scripts

```bash
npm install

# Database
npm run prisma:migrate    # migrate deploy + generate
npm run seed              # local seeder (ts-node)
npm run seed:prod         # after build

# App
npm run start:dev         # watch
npm run start             # dist/main (needs build)
npm run start:prod
npm run build

# Prisma helpers
npm run prisma:generate
npm run prisma:setup      # migrate dev + generate (interactive)
npm run prisma:reset      # destructive

# Quality
npm run lint
npm run test
npm run test:e2e
```

API default: **http://localhost:4000**

## Main modules

Under `src/component/` (non-exhaustive):

| Area | Notes |
| :--- | :--- |
| `auth` | Login, refresh, reset password; inactive users blocked |
| `user` | Backoffice users; ADMIN cannot be deactivated/deleted |
| `formation` / applications / categories | Catalog & candidatures |
| `blog`, `faq`, `testimonial`, `contactMessage` | Content / inbox |
| `coworkingRoom` / bookings / stats | Coworking |
| **`sales`** | Customers, quotes (`DEV-YYYY-####`), invoices (`FAC-YYYY-####`); custom lines + per-line tax; admin-only `/backoffice/customer|quote|invoice` |

## Production uploads

```env
UPLOAD_DIR=/var/www/bibliosquad/uploads
```

Files land in `{UPLOAD_DIR}/{type}/` (e.g. `formations/`, `blogs/`) and are served as `/{type}/{file}`. Nginx example: [../deploy/nginx-bibliosquad.example.conf](../deploy/nginx-bibliosquad.example.conf).

## Adminer

DB UI via Docker on port **8080** — see [../README.md](../README.md#adminer-db-ui) and root `docker-compose.yml`.

## Further reading

- [../README.md](../README.md)
- [../frontend/README.md](../frontend/README.md)
- [NestJS](https://docs.nestjs.com) · [Prisma](https://www.prisma.io/docs)
