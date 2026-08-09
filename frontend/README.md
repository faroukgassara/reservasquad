# Biblio Squad Frontend

Next.js **15** (App Router) + React **19** + TypeScript app for the Biblio Squad marketing site and admin backoffice.

## Prerequisites

- Node.js (LTS recommended)
- Running **Biblio Squad backend** (default [http://localhost:4000](http://localhost:4000)) — see [../README.md](../README.md) and [../backend/README.md](../backend/README.md)

## Environment

Typical variables (`.env` / `.env.local`):

| Variable | Purpose |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Backend base URL used by **server** API route proxies (e.g. `http://127.0.0.1:4000`) |
| `NEXT_PUBLIC_MEDIA_URL` | Optional public URL for uploads. Prefer unset in production (same-origin paths). Locally you may set `http://localhost:4000` |
| `NEXT_PUBLIC_FRONT_URL` | Public frontend URL |
| `NEXTAUTH_URL` | Same origin as the frontend (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | NextAuth secret (strong value in production) |

Browser calls go to Next.js `/api/*` proxies; those forward the `Authorization` header to Nest (`/backoffice/...`). Do **not** call `getSession()` with `withToken: true` inside Route Handlers — forward `req.headers.get('authorization')` instead.

### VPS (production) checklist for image uploads

1. **Backend** — persistent uploads:
   ```env
   UPLOAD_DIR=/var/www/bibliosquad/uploads
   ```
   `mkdir -p /var/www/bibliosquad/uploads && chown -R www-data:www-data /var/www/bibliosquad/uploads`

2. **Frontend**:
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:4000
   NEXTAUTH_URL=https://bibliosquad.tn
   ```
   Then `npm run build && pm2 restart frontend`

3. **Nginx** — proxy upload paths; see [../deploy/nginx-bibliosquad.example.conf](../deploy/nginx-bibliosquad.example.conf)

## Scripts

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start    # production (after build)
npm run lint
```

## Structure (high level)

```
frontend/
├── locales/          # fr, en, ar (next-intl JSON)
├── src/
│   ├── app/[locale]/ # App Router: (private) backoffice + public pages
│   ├── app/api/      # Next.js proxies → Nest API
│   ├── components/   # Primitives, Organisms, Templates, Layouts, Modals
│   ├── common/       # Api, validation helpers
│   ├── contexts/     # Modal, Toast, etc.
│   ├── hooks/
│   ├── i18n/
│   ├── lib/          # *-api.ts clients, routes
│   └── theme/
└── package.json
```

Architecture conventions for agents: [../.cursor/rules/FRONTEND_ARCHITECTURE.mdc](../.cursor/rules/FRONTEND_ARCHITECTURE.mdc)

## Locales

- **fr** (default), **en**, **ar**
- Config: `src/i18n/routing.ts` (`localePrefix: 'as-needed'`)

## Backoffice (ADMIN)

Notable private routes:

| Module | Paths |
| :--- | :--- |
| Formations / blog / FAQ / testimonials / users | as in sidebar |
| Coworking | `/coworking-rooms`, `/coworking-stats`, `/coworking-bookings` |
| Ventes | `/clients`, `/quotes`, `/quotes/new`, `/quotes/[id]`, `/invoices`, `/invoices/[id]` |

Sales UI: custom document lines, per-line tax, amounts in **TND**, convert quote → invoice.

## Documentation

- Full stack / Adminer / credentials: [../README.md](../README.md)
- Backend: [../backend/README.md](../backend/README.md)
- [Next.js docs](https://nextjs.org/docs)
- [next-intl](https://next-intl.dev/)
