CREATE UNIQUE INDEX "unique_active_booking"
ON "bookings" ("bed_id", "academic_year_id")
WHERE "status" IN ('Pending', 'Paid', 'Confirmed', 'CheckedIn');