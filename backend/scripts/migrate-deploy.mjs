import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolveMigrationDatabaseUrl } from './resolve-migration-database-url.mjs';

// Render only waits ~15 min for the port, so a stuck migration must fail fast instead of silently timing out.
const TIMEOUT_MS = Number(process.env.MIGRATE_TIMEOUT_MS) || 5 * 60 * 1000;

const migrationUrl = resolveMigrationDatabaseUrl();
const prismaCli = createRequire(import.meta.url).resolve('prisma/build/index.js');

try {
    const host = new URL(migrationUrl.replace(/^postgres(ql)?:\/\//, 'http://')).host;
    console.log(`Running prisma migrate deploy via ${host}`);
} catch {
    console.log('Running prisma migrate deploy');
}

const result = spawnSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    stdio: 'inherit',
    timeout: TIMEOUT_MS,
    killSignal: 'SIGKILL',
    env: {
        ...process.env,
        DATABASE_URL: migrationUrl,
    },
});

if (result.error?.code === 'ETIMEDOUT' || result.signal) {
    console.error(
        `prisma migrate deploy did not finish within ${TIMEOUT_MS / 1000}s (signal: ${result.signal ?? 'none'}). ` +
            'Check that the database is reachable and that no other session holds locks on it.',
    );
} else if (result.error) {
    console.error('prisma migrate deploy could not start:', result.error.message);
}

process.exit(result.status ?? 1);
