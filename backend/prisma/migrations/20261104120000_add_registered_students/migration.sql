-- CreateTable
CREATE TABLE "registered_students" (
    "id" TEXT NOT NULL,
    "reg_key" TEXT NOT NULL,
    "reg_no" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "gender" TEXT,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registered_students_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registered_students_reg_key_key" ON "registered_students"("reg_key");
