-- Migration SQL: Add new fields and tables
-- Run with: psql -d gsc_procurement -U postgres

-- ==========================================
-- 1. Create new Enums
-- ==========================================
DO $$ BEGIN
  CREATE TYPE "TrangThaiHangHoa" AS ENUM ('CoDuong', 'HetHang');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- 2. Alter existing tables - Add columns
-- ==========================================

-- CoQuanChinhPhu
ALTER TABLE "CoQuanChinhPhu" ADD COLUMN IF NOT EXISTS "DienThoai" TEXT;
ALTER TABLE "CoQuanChinhPhu" ADD COLUMN IF NOT EXISTS "Email" TEXT;
ALTER TABLE "CoQuanChinhPhu" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "CoQuanChinhPhu" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- HopDong
ALTER TABLE "HopDong" ADD COLUMN IF NOT EXISTS "DieuKhoan" TEXT;

-- DonDatHang
ALTER TABLE "DonDatHang" ADD COLUMN IF NOT EXISTS "LuuY" TEXT;

-- ChiTietDonHang
ALTER TABLE "ChiTietDonHang" ADD COLUMN IF NOT EXISTS "DonGia" DECIMAL(18,2) NOT NULL DEFAULT 0;
ALTER TABLE "ChiTietDonHang" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- HangHoa
ALTER TABLE "HangHoa" ADD COLUMN IF NOT EXISTS "ViTriKho" TEXT;
ALTER TABLE "HangHoa" ADD COLUMN IF NOT EXISTS "MoTa" TEXT;
ALTER TABLE "HangHoa" ADD COLUMN IF NOT EXISTS "TrangThai" "TrangThaiHangHoa" NOT NULL DEFAULT 'CoDuong';
ALTER TABLE "HangHoa" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "HangHoa" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- GiaoHang
ALTER TABLE "GiaoHang" ADD COLUMN IF NOT EXISTS "GhiChu" TEXT;
ALTER TABLE "GiaoHang" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "GiaoHang" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- HoaDonThanhToan
ALTER TABLE "HoaDonThanhToan" ADD COLUMN IF NOT EXISTS "HinhThucThanhToan" TEXT;
ALTER TABLE "HoaDonThanhToan" ADD COLUMN IF NOT EXISTS "GhiChu" TEXT;
ALTER TABLE "HoaDonThanhToan" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "HoaDonThanhToan" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ChiTietHopDong
ALTER TABLE "ChiTietHopDong" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ==========================================
-- 3. Create new tables
-- ==========================================

-- ThuTuChoi (Thư từ chối đơn hàng)
CREATE TABLE IF NOT EXISTS "ThuTuChoi" (
  "MaThuTuChoi" SERIAL NOT NULL,
  "LiDo" TEXT NOT NULL,
  "NgayGui" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "MaDonHang" INTEGER NOT NULL,
  "MaTaiKhoan_NVHD" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ThuTuChoi_pkey" PRIMARY KEY ("MaThuTuChoi")
);

-- AuditLog
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "MaLog" SERIAL NOT NULL,
  "HanhDong" TEXT NOT NULL,
  "DoiTuong" TEXT NOT NULL,
  "IdDoiTuong" INTEGER NOT NULL,
  "MaTaiKhoan" INTEGER NOT NULL,
  "ChiTiet" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("MaLog")
);

-- ==========================================
-- 4. Create indexes
-- ==========================================
CREATE INDEX IF NOT EXISTS "ThuTuChoi_MaDonHang_idx" ON "ThuTuChoi"("MaDonHang");
CREATE INDEX IF NOT EXISTS "AuditLog_IdDoiTuong_idx" ON "AuditLog"("IdDoiTuong");
CREATE INDEX IF NOT EXISTS "AuditLog_MaTaiKhoan_idx" ON "AuditLog"("MaTaiKhoan");

-- ==========================================
-- 5. Add Foreign Keys
-- ==========================================
DO $$ BEGIN
  ALTER TABLE "ThuTuChoi" ADD CONSTRAINT "ThuTuChoi_MaDonHang_fkey" FOREIGN KEY ("MaDonHang") REFERENCES "DonDatHang"("MaDonHang") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ThuTuChoi" ADD CONSTRAINT "ThuTuChoi_MaTaiKhoan_NVHD_fkey" FOREIGN KEY ("MaTaiKhoan_NVHD") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
