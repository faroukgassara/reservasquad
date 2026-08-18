-- Incremental pivot from Biblio Squad shop schema (init) to Reservasquad.
-- Do not recreate EStatus / ERole / User — they already exist after init.

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "EReservationStatus" AS ENUM ('CONFIRMED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EIncomeLineType" AS ENUM ('CHARGE', 'INVESTMENT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Professor" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "specialty" TEXT,
    "notes" TEXT,
    "status" "EStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Professor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "pricePerHour" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "imageUrl" TEXT,
    "status" "EStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Reservation" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "roomId" TEXT NOT NULL,
    "professorId" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "status" "EReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "DailyIncome" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalIncome" DECIMAL(10,2) NOT NULL,
    "savings" DECIMAL(10,2) NOT NULL,
    "benefits" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyIncome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "IncomeLine" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "EIncomeLineType" NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomeLine_pkey" PRIMARY KEY ("id")
);

-- Existing Room / Reservation rows (local installs) may predate these columns
ALTER TABLE "Room" ADD COLUMN IF NOT EXISTS "pricePerHour" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "price" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "isPaid" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Professor_email_key" ON "Professor"("email");
CREATE INDEX IF NOT EXISTS "Professor_status_idx" ON "Professor"("status");
CREATE INDEX IF NOT EXISTS "Professor_lastName_idx" ON "Professor"("lastName");
CREATE INDEX IF NOT EXISTS "Professor_deletedAt_idx" ON "Professor"("deletedAt");

CREATE INDEX IF NOT EXISTS "Room_status_idx" ON "Room"("status");
CREATE INDEX IF NOT EXISTS "Room_name_idx" ON "Room"("name");
CREATE INDEX IF NOT EXISTS "Room_deletedAt_idx" ON "Room"("deletedAt");

CREATE INDEX IF NOT EXISTS "Reservation_roomId_idx" ON "Reservation"("roomId");
CREATE INDEX IF NOT EXISTS "Reservation_professorId_idx" ON "Reservation"("professorId");
CREATE INDEX IF NOT EXISTS "Reservation_startAt_idx" ON "Reservation"("startAt");
CREATE INDEX IF NOT EXISTS "Reservation_endAt_idx" ON "Reservation"("endAt");
CREATE INDEX IF NOT EXISTS "Reservation_status_idx" ON "Reservation"("status");
CREATE INDEX IF NOT EXISTS "Reservation_isPaid_idx" ON "Reservation"("isPaid");
CREATE INDEX IF NOT EXISTS "Reservation_createdById_idx" ON "Reservation"("createdById");

CREATE INDEX IF NOT EXISTS "DailyIncome_date_idx" ON "DailyIncome"("date");
CREATE UNIQUE INDEX IF NOT EXISTS "DailyIncome_date_key" ON "DailyIncome"("date");
CREATE INDEX IF NOT EXISTS "IncomeLine_date_idx" ON "IncomeLine"("date");
CREATE INDEX IF NOT EXISTS "IncomeLine_type_idx" ON "IncomeLine"("type");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_professorId_fkey"
    FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
