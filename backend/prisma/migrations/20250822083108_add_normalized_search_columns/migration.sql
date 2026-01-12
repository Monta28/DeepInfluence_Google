-- AlterTable
ALTER TABLE "experts" ADD COLUMN "nameNormalized" TEXT;
ALTER TABLE "experts" ADD COLUMN "specialtyNormalized" TEXT;

-- AlterTable
ALTER TABLE "formations" ADD COLUMN "descriptionNormalized" TEXT;
ALTER TABLE "formations" ADD COLUMN "instructorNormalized" TEXT;
ALTER TABLE "formations" ADD COLUMN "titleNormalized" TEXT;

-- AlterTable
ALTER TABLE "videos" ADD COLUMN "expertNormalized" TEXT;
ALTER TABLE "videos" ADD COLUMN "titleNormalized" TEXT;
