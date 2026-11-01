-- Register-session income is dated on the session's closing day (Tunisia time), not its opening day.
UPDATE "DailyIncome" AS di
SET "date" = (ps."closedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Tunis')::date,
    "updatedAt" = CURRENT_TIMESTAMP
FROM "PosSession" AS ps
WHERE di."posSessionId" = ps."id"
  AND ps."closedAt" IS NOT NULL
  AND di."date" <> (ps."closedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Tunis')::date;
