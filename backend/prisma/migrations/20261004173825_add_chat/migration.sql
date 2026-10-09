/*
  Warnings:

  - You are about to drop the `ticket_replies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tickets` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ticket_replies" DROP CONSTRAINT "ticket_replies_author_student_id_fkey";

-- DropForeignKey
ALTER TABLE "ticket_replies" DROP CONSTRAINT "ticket_replies_author_user_id_fkey";

-- DropForeignKey
ALTER TABLE "ticket_replies" DROP CONSTRAINT "ticket_replies_ticket_id_fkey";

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_student_id_fkey";

-- DropTable
DROP TABLE "ticket_replies";

-- DropTable
DROP TABLE "tickets";

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "hostel_id" TEXT,
    "student_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_hostel_id_fkey" FOREIGN KEY ("hostel_id") REFERENCES "hostels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
