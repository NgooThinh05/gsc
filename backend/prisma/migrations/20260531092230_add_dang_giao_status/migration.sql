/*
  Warnings:

  - The values [NhanVienThanhToan] on the enum `VaiTro` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `SoLuongToiDa` on the `ChiTietHopDong` table. All the data in the column will be lost.
  - The primary key for the `CoQuanChinhPhu` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `DienThoai` on the `CoQuanChinhPhu` table. All the data in the column will be lost.
  - You are about to drop the column `Email` on the `CoQuanChinhPhu` table. All the data in the column will be lost.
  - You are about to drop the column `HinhThucThanhToan` on the `HoaDonThanhToan` table. All the data in the column will be lost.
  - You are about to drop the column `MaTaiKhoan_NVTT` on the `HoaDonThanhToan` table. All the data in the column will be lost.
  - The primary key for the `NhanVienHopDong` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `ChucVu` on the `NhanVienHopDong` table. All the data in the column will be lost.
  - You are about to drop the column `ChungChi` on the `NhanVienHopDong` table. All the data in the column will be lost.
  - You are about to drop the column `HanMucDuyet` on the `NhanVienHopDong` table. All the data in the column will be lost.
  - The primary key for the `NhanVienKho` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `CaLam` on the `NhanVienKho` table. All the data in the column will be lost.
  - You are about to drop the column `KhuVucQuanLy` on the `NhanVienKho` table. All the data in the column will be lost.
  - The primary key for the `TaiKhoan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NhanVienMuaSamCoQuan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NhanVienThanhToan` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "TrangThaiDonHang" ADD VALUE 'DangGiao';

-- AlterEnum
BEGIN;
CREATE TYPE "VaiTro_new" AS ENUM ('Admin', 'NhanVienHopDong', 'NhanVienMuaSamCoQuan', 'NhanVienKho', 'QuanLy');
ALTER TABLE "TaiKhoan" ALTER COLUMN "VaiTro" TYPE "VaiTro_new" USING ("VaiTro"::text::"VaiTro_new");
ALTER TYPE "VaiTro" RENAME TO "VaiTro_old";
ALTER TYPE "VaiTro_new" RENAME TO "VaiTro";
DROP TYPE "VaiTro_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "DonDatHang" DROP CONSTRAINT "DonDatHang_MaTaiKhoan_NVMS_fkey";

-- DropForeignKey
ALTER TABLE "GiaoHang" DROP CONSTRAINT "GiaoHang_MaTaiKhoan_NVKho_fkey";

-- DropForeignKey
ALTER TABLE "HoaDonThanhToan" DROP CONSTRAINT "HoaDonThanhToan_MaTaiKhoan_NVTT_fkey";

-- DropForeignKey
ALTER TABLE "HopDong" DROP CONSTRAINT "HopDong_MaCoQuan_fkey";

-- DropForeignKey
ALTER TABLE "HopDong" DROP CONSTRAINT "HopDong_MaTaiKhoan_NVHD_fkey";

-- DropForeignKey
ALTER TABLE "NhanVienHopDong" DROP CONSTRAINT "NhanVienHopDong_MaTaiKhoan_fkey";

-- DropForeignKey
ALTER TABLE "NhanVienKho" DROP CONSTRAINT "NhanVienKho_MaTaiKhoan_fkey";

-- DropForeignKey
ALTER TABLE "NhanVienMuaSamCoQuan" DROP CONSTRAINT "NhanVienMuaSamCoQuan_MaCoQuan_fkey";

-- DropForeignKey
ALTER TABLE "NhanVienMuaSamCoQuan" DROP CONSTRAINT "NhanVienMuaSamCoQuan_MaTaiKhoan_fkey";

-- DropForeignKey
ALTER TABLE "NhanVienThanhToan" DROP CONSTRAINT "NhanVienThanhToan_MaTaiKhoan_fkey";

-- DropForeignKey
ALTER TABLE "ThongBao" DROP CONSTRAINT "ThongBao_MaTaiKhoan_fkey";

-- DropForeignKey
ALTER TABLE "ThuTuChoi" DROP CONSTRAINT "ThuTuChoi_MaTaiKhoan_NVHD_fkey";

-- DropIndex
DROP INDEX "HoaDonThanhToan_MaTaiKhoan_NVTT_idx";

-- AlterTable
ALTER TABLE "ChiTietHopDong" DROP COLUMN "SoLuongToiDa";

-- AlterTable
ALTER TABLE "CoQuanChinhPhu" DROP CONSTRAINT "CoQuanChinhPhu_pkey",
DROP COLUMN "DienThoai",
DROP COLUMN "Email",
ALTER COLUMN "MaCoQuan" DROP DEFAULT,
ALTER COLUMN "MaCoQuan" SET DATA TYPE TEXT,
ADD CONSTRAINT "CoQuanChinhPhu_pkey" PRIMARY KEY ("MaCoQuan");
DROP SEQUENCE "CoQuanChinhPhu_MaCoQuan_seq";

-- AlterTable
ALTER TABLE "DonDatHang" ALTER COLUMN "MaHopDong" DROP NOT NULL,
ALTER COLUMN "MaTaiKhoan_NVMS" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "GiaoHang" ALTER COLUMN "MaTaiKhoan_NVKho" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "HoaDonThanhToan" DROP COLUMN "HinhThucThanhToan",
DROP COLUMN "MaTaiKhoan_NVTT";

-- AlterTable
ALTER TABLE "HopDong" ADD COLUMN     "ChucVuNguoiKy" TEXT,
ADD COLUMN     "TenNguoiKy" TEXT,
ALTER COLUMN "MaTaiKhoan_NVHD" SET DATA TYPE TEXT,
ALTER COLUMN "MaCoQuan" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "NhanVienHopDong" DROP CONSTRAINT "NhanVienHopDong_pkey",
DROP COLUMN "ChucVu",
DROP COLUMN "ChungChi",
DROP COLUMN "HanMucDuyet",
ALTER COLUMN "MaTaiKhoan" SET DATA TYPE TEXT,
ADD CONSTRAINT "NhanVienHopDong_pkey" PRIMARY KEY ("MaTaiKhoan");

-- AlterTable
ALTER TABLE "NhanVienKho" DROP CONSTRAINT "NhanVienKho_pkey",
DROP COLUMN "CaLam",
DROP COLUMN "KhuVucQuanLy",
ALTER COLUMN "MaTaiKhoan" SET DATA TYPE TEXT,
ADD CONSTRAINT "NhanVienKho_pkey" PRIMARY KEY ("MaTaiKhoan");

-- AlterTable
ALTER TABLE "TaiKhoan" DROP CONSTRAINT "TaiKhoan_pkey",
ALTER COLUMN "MaTaiKhoan" DROP DEFAULT,
ALTER COLUMN "MaTaiKhoan" SET DATA TYPE TEXT,
ADD CONSTRAINT "TaiKhoan_pkey" PRIMARY KEY ("MaTaiKhoan");
DROP SEQUENCE "TaiKhoan_MaTaiKhoan_seq";

-- AlterTable
ALTER TABLE "ThongBao" ALTER COLUMN "MaTaiKhoan" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ThuTuChoi" ALTER COLUMN "MaTaiKhoan_NVHD" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "NhanVienMuaSamCoQuan";

-- DropTable
DROP TABLE "NhanVienThanhToan";

-- CreateTable
CREATE TABLE "TaiKhoanCoQuan" (
    "MaTaiKhoan" TEXT NOT NULL,
    "MaCoQuan" TEXT NOT NULL,

    CONSTRAINT "NhanVienMuaSamCoQuan_pkey" PRIMARY KEY ("MaTaiKhoan")
);

-- CreateTable
CREATE TABLE "QuanLy" (
    "MaTaiKhoan" TEXT NOT NULL,

    CONSTRAINT "MaTaiKhoan_Quanly" PRIMARY KEY ("MaTaiKhoan")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaiKhoanCoQuan_MaCoQuan_key" ON "TaiKhoanCoQuan"("MaCoQuan");

-- CreateIndex
CREATE INDEX "AuditLog_MaTaiKhoan_idx" ON "QuanLy"("MaTaiKhoan");

-- AddForeignKey
ALTER TABLE "NhanVienHopDong" ADD CONSTRAINT "NhanVienHopDong_MaTaiKhoan_fkey" FOREIGN KEY ("MaTaiKhoan") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaiKhoanCoQuan" ADD CONSTRAINT "NhanVienMuaSamCoQuan_MaCoQuan_fkey" FOREIGN KEY ("MaCoQuan") REFERENCES "CoQuanChinhPhu"("MaCoQuan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaiKhoanCoQuan" ADD CONSTRAINT "NhanVienMuaSamCoQuan_MaTaiKhoan_fkey" FOREIGN KEY ("MaTaiKhoan") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NhanVienKho" ADD CONSTRAINT "NhanVienKho_MaTaiKhoan_fkey" FOREIGN KEY ("MaTaiKhoan") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuanLy" ADD CONSTRAINT "Quanly" FOREIGN KEY ("MaTaiKhoan") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "HopDong" ADD CONSTRAINT "HopDong_MaCoQuan_fkey" FOREIGN KEY ("MaCoQuan") REFERENCES "CoQuanChinhPhu"("MaCoQuan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HopDong" ADD CONSTRAINT "HopDong_MaTaiKhoan_NVHD_fkey" FOREIGN KEY ("MaTaiKhoan_NVHD") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonDatHang" ADD CONSTRAINT "DonDatHang_MaTaiKhoan_NVMS_fkey" FOREIGN KEY ("MaTaiKhoan_NVMS") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiaoHang" ADD CONSTRAINT "GiaoHang_MaTaiKhoan_NVKho_fkey" FOREIGN KEY ("MaTaiKhoan_NVKho") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThuTuChoi" ADD CONSTRAINT "ThuTuChoi_MaTaiKhoan_NVHD_fkey" FOREIGN KEY ("MaTaiKhoan_NVHD") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThongBao" ADD CONSTRAINT "ThongBao_MaTaiKhoan_fkey" FOREIGN KEY ("MaTaiKhoan") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE CASCADE ON UPDATE CASCADE;
