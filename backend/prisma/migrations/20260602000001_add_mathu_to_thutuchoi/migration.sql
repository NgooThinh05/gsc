-- AlterTable: thêm cột MaThu vào ThuTuChoi
ALTER TABLE "ThuTuChoi" ADD COLUMN "MaThu" TEXT;

-- CreateIndex: unique constraint
CREATE UNIQUE INDEX "ThuTuChoi_MaThu_key" ON "ThuTuChoi"("MaThu");
