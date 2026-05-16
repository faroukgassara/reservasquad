-- AlterTable Reservation: payment flag (admin-managed)
ALTER TABLE "Reservation" ADD COLUMN "paid" BOOLEAN NOT NULL DEFAULT false;
