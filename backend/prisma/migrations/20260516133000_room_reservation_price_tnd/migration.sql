-- CreateEnum
CREATE TYPE "ReservationPriceMode" AS ENUM ('ROOM_HOURLY', 'PER_PARTICIPANT', 'MANUAL');

-- AlterTable Room: hourly rate in TND
ALTER TABLE "Room" ADD COLUMN "pricePerHour" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable Reservation: persisted total & mode for existing bookings
ALTER TABLE "Reservation" ADD COLUMN "price" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Reservation"
ADD COLUMN "priceMode" "ReservationPriceMode" NOT NULL DEFAULT 'MANUAL';
