import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/** Placeholder only for `prisma generate` when DATABASE_URL is unset (e.g. CI build). */
const datasourceUrl =
  process.env.DATABASE_URL ?? 'postgresql://postgres:dqSixgAaOEHShFJzAJJmvmspYTBBIFoR@turntable.proxy.rlwy.net:41369/railway';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: datasourceUrl,
  },
});
