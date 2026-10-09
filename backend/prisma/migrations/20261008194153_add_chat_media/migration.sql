-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "file_name" TEXT,
ADD COLUMN     "file_path" TEXT,
ADD COLUMN     "file_size" INTEGER,
ADD COLUMN     "message_type" TEXT NOT NULL DEFAULT 'text',
ADD COLUMN     "mime_type" TEXT,
ALTER COLUMN "message" DROP NOT NULL;
