-- CreateTable
CREATE TABLE "hostel_ratings" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "hostel_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hostel_ratings_student_id_hostel_id_academic_year_id_key" ON "hostel_ratings"("student_id", "hostel_id", "academic_year_id");

-- AddForeignKey
ALTER TABLE "hostel_ratings" ADD CONSTRAINT "hostel_ratings_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_ratings" ADD CONSTRAINT "hostel_ratings_hostel_id_fkey" FOREIGN KEY ("hostel_id") REFERENCES "hostels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_ratings" ADD CONSTRAINT "hostel_ratings_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
