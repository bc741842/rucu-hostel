/*
  Warnings:

  - A unique constraint covering the columns `[qr_code]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "bookings_qr_code_key" ON "bookings"("qr_code");
