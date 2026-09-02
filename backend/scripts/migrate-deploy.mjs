import { spawnSync } from 'node:child_process';
import { resolveMigrationDatabaseUrl } from './resolve-migration-database-url.mjs';

const migrationUrl = resolveMigrationDatabaseUrl();

try {
    const host = new URL(migrationUrl.replace(/^postgres(ql)?:\/\//, 'http://')).host;
    console.log(`Running prisma migrate deploy via ${host}`);
} catch {
    console.log('Running prisma migrate deploy');
}

const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
    stdio: 'inherit',
    env: {
        ...process.env,
        DATABASE_URL: migrationUrl,
    },
});

process.exit(result.status ?? 1);
