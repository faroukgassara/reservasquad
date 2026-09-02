/**
 * Prisma Migrate requires a direct Postgres connection.
 * Neon pooler hostnames include "-pooler" and cannot acquire advisory locks.
 */
export function resolveMigrationDatabaseUrl(env = process.env) {
    const direct = env.DIRECT_URL?.trim();
    if (direct) return direct;

    const databaseUrl = env.DATABASE_URL?.trim();
    if (!databaseUrl) {
        throw new Error('DATABASE_URL is not set');
    }

    if (databaseUrl.includes('-pooler')) {
        return databaseUrl.replace('-pooler', '');
    }

    return databaseUrl;
}
