# Nexera Backend

NestJS API with Prisma and PostgreSQL.

## Prerequisites

- Node.js (LTS recommended)
- **PostgreSQL** (16+ recommended) reachable from your machine

First-time database setup and stack overview: [repository root README](../README.md).

## Prisma (ORM 7)

- Connection URL and migrations are configured in **`prisma.config.ts`** at the project root (not in `schema.prisma`).
- The client is generated into **`src/generated/prisma`** with provider `prisma-client`. Run **`npm run prisma:generate`** after schema changes (also runs automatically via **`postinstall`** after `npm install`).
- The app uses the **`pg`** driver via **`@prisma/adapter-pg`**; see `src/prisma/prisma.service.ts`.
- **`npx prisma migrate dev`** applies migrations but does **not** auto-run seed in v7; use **`npm run seed`** or **`npx prisma db seed`** when needed.


## Environment

```bash
cp .env.example .env
```

Edit `.env` so `DATABASE_URL` points at your Postgres instance (`localhost` for local dev). Optional: set `SMTP_HOST_ADDRESS` / `SMTP_PORT` if you use [Maildev](https://github.com/maildev/maildev) or another SMTP sink.

## Scripts

```bash
npm install

# Database (after .env is configured)
npm run prisma:migrate
npm run seed

# App
npm run start:dev     # watch mode (development)
npm run start         # once, without watch
npm run start:prod    # production (requires build)

# Prisma
npm run prisma:generate
npm run prisma:migrate   # deploy migrations
npm run prisma:setup     # migrate dev + generate (interactive)
npm run prisma:reset     # reset DB (destructive)

# Quality
npm run lint
npm run test
npm run test:e2e
npm run test:cov
```

Default API port: **4000** (override with `PORT` in `.env`).

## Further reading

- Full stack setup and default login: [../README.md](../README.md)
- [NestJS documentation](https://docs.nestjs.com)
- [Prisma documentation](https://www.prisma.io/docs)
