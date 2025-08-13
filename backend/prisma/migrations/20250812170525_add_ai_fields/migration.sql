-- AlterTable
ALTER TABLE "File" ADD COLUMN     "category" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "textExtract" TEXT;
