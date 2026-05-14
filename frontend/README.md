# Nexera Frontend

Next.js application (App Router, TypeScript) for the Nexera product.

## Prerequisites

- Node.js (LTS recommended)
- A running **Nexera backend** on [http://localhost:4000](http://localhost:4000) by default (see the repository root [README](../README.md)).

## Environment

Copy the example file and adjust if your API or app URL changes:

```bash
cp .env.example .env.local
```

| Variable | Purpose |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Backend base URL (server-side calls) |
| `NEXT_PUBLIC_CLIENT_API_URL` | Backend base URL (browser) |
| `NEXT_PUBLIC_FRONT_URL` | This app’s public URL |
| `NEXTAUTH_URL` | Same origin as the frontend (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Secret for NextAuth (use a strong value in production) |

## Scripts

```bash
npm install
npm run dev      # development server — http://localhost:3000
npm run build    # production build
npm run start    # production server (after build)
npm run lint     # ESLint
```

## Project notes

- Source lives under `src/` (e.g. `src/app`, `src/components`).
- Locales: `locales/en` and `locales/fr`; routing uses [next-intl](https://next-intl-docs.vercel.app/).

## Documentation

- Full stack setup, database, and credentials: [../README.md](../README.md)
- [Next.js documentation](https://nextjs.org/docs)
