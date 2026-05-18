import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * `prisma generate` does not open a DB connection; migrate/seed do.
 * Railway must set DATABASE_URL on the backend service (reference from Postgres).
 */
function resolveDatasourceUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    return url;
  }

  const isGenerateOnly = process.argv.some((arg) => arg.includes('generate'));
  if (isGenerateOnly) {
    return 'postgresql://prisma:prisma@127.0.0.1:5432/prisma?schema=public';
  }

  throw new Error(
    'DATABASE_URL is not set. On Railway: open your backend service → Variables → ' +
      'add DATABASE_URL referencing your Postgres service (e.g. ${{Postgres.DATABASE_URL}}).',
  );
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: resolveDatasourceUrl(),
  },
});
