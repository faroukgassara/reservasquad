-- AlterTable (teachers booked without login: password optional)
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- Reservations must keep FK to teachers; forbid deleting a teacher referenced by bookings
ALTER TABLE "Reservation" DROP CONSTRAINT IF EXISTS "Reservation_userId_fkey";
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
