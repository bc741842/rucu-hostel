-- A student may hold only one active booking per academic year, enforced by
-- the database so two simultaneous requests can't both succeed.
CREATE UNIQUE INDEX "unique_active_booking_per_student"
ON "bookings" ("student_id", "academic_year_id")
WHERE "status" IN ('Pending', 'Paid', 'Confirmed', 'CheckedIn');
