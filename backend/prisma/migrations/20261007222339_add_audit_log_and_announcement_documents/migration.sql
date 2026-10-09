/*
  Warnings:

  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "document_title" TEXT,
ADD COLUMN     "file_name" TEXT,
ADD COLUMN     "file_path" TEXT,
ADD COLUMN     "file_size" INTEGER;

-- DropTable
DROP TABLE "audit_logs";
