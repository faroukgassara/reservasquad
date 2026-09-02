import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { resolveMigrationDatabaseUrl } from './scripts/resolve-migration-database-url.mjs';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: resolveMigrationDatabaseUrl(),
  },
});
