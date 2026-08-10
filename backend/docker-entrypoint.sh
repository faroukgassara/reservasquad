#!/bin/sh
set -e

# Keep backend/.env as-is for local npm; in Compose rewrite DB host for the container.
if [ -n "$DOCKER_DB_HOST" ] && [ -n "$DATABASE_URL" ]; then
  DATABASE_URL=$(printf '%s' "$DATABASE_URL" | sed "s/@localhost:/@${DOCKER_DB_HOST}:/g; s/@127.0.0.1:/@${DOCKER_DB_HOST}:/g")
  export DATABASE_URL
  echo "Using DATABASE_URL host: ${DOCKER_DB_HOST}"
fi

echo "Applying database schema..."
if npx prisma migrate deploy; then
  echo "Migrations applied."
else
  echo "migrate deploy failed - falling back to prisma db push"
  npx prisma db push --accept-data-loss
fi

echo "Running seeders..."
npm run seed:prod || echo "Seed skipped or already applied"

echo "Starting API..."
exec node dist/main.js
