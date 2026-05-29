-- CreateEnum
CREATE TYPE "VaiTro" AS ENUM ('Admin', 'NhanVienHopDong', 'NhanVienMuaSamCoQuan', 'NhanVienThanhToan', 'NhanVienKho', 'QuanLy');

-- CreateEnum
CREATE TYPE "TrangThaiTaiKhoan" AS ENUM ('HoatDong', 'Khoa');

-- CreateEnum
CREATE TYPE "TrangThaiHopDong" AS ENUM ('HieuLuc', 'HetHan', 'TamDung');

-- CreateEnum
CREATE TYPE "TrangThaiDonHang" AS ENUM ('ChoDuyet', 'DaDuyet', 'SanSangGiao', 'GiaoMotPhan', 'DaGiao', 'Huy');

-- CreateEnum
CREATE TYPE "TrangThaiGiaoHang" AS ENUM ('DangDongGoi', 'DangGiao', 'DaGiao', 'ThatBai');

-- CreateEnum
CREATE TYPE "TrangThaiHoaDon" AS ENUM ('ChoThanhToan', 'DaThanhToan', 'QuaHan', 'Huy');

-- CreateEnum
CREATE TYPE "TrangThaiHangHoa" AS ENUM ('CoDuong', 'HetHang');

-- CreateTable
CREATE TABLE "TaiKhoan" (
    "MaTaiKhoan" SERIAL NOT NULL,
    "TenNguoiDung" TEXT NOT NULL,
    "SDT" TEXT,
    "Email" TEXT NOT NULL,
    "MatKhau" TEXT NOT NULL,
    "VaiTro" "VaiTro" NOT NULL,
    "TrangThai" "TrangThaiTaiKhoan" NOT NULL DEFAULT 'HoatDong',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaiKhoan_pkey" PRIMARY KEY ("MaTaiKhoan")
);

-- CreateTable
CREATE TABLE "NhanVienHopDong" (
    "MaTaiKhoan" INTEGER NOT NULL,
    "ChucVu" TEXT NOT NULL,
    "ChungChi" TEXT,
    "HanMucDuyet" DECIMAL(18,2),

    CONSTRAINT "NhanVienHopDong_pkey" PRIMARY KEY ("MaTaiKhoan")
);

-- CreateTable
CREATE TABLE "NhanVienMuaSamCoQuan" (
    "MaTaiKhoan" INTEGER NOT NULL,
    "MaCoQuan" INTEGER NOT NULL,
    "BoPhanCongTac" TEXT NOT NULL,

    CONSTRAINT "NhanVienMuaSamCoQuan_pkey" PRIMARY KEY ("MaTaiKhoan")
);

-- CreateTable
CREATE TABLE "NhanVienThanhToan" (
    "MaTaiKhoan" INTEGER NOT NULL,
    "MaSoKeToan" TEXT NOT NULL,
    "HanMucChiTra" DECIMAL(18,2),

    CONSTRAINT "NhanVienThanhToan_pkey" PRIMARY KEY ("MaTaiKhoan")
);

-- CreateTable
CREATE TABLE "NhanVienKho" (
    "MaTaiKhoan" INTEGER NOT NULL,
    "KhuVucQuanLy" TEXT NOT NULL,
    "CaLam" TEXT NOT NULL,

    CONSTRAINT "NhanVienKho_pkey" PRIMARY KEY ("MaTaiKhoan")
);

-- CreateTable
CREATE TABLE "CoQuanChinhPhu" (
    "MaCoQuan" SERIAL NOT NULL,
    "Ten" TEXT NOT NULL,
    "DiaChi" TEXT,
    "DienThoai" TEXT,
    "Email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoQuanChinhPhu_pkey" PRIMARY KEY ("MaCoQuan")
);

-- CreateTable
CREATE TABLE "HopDong" (
    "MaHopDong" SERIAL NOT NULL,
    "NgayKy" TIMESTAMP(3) NOT NULL,
    "NgayHetHan" TIMESTAMP(3) NOT NULL,
    "TrangThai" "TrangThaiHopDong" NOT NULL DEFAULT 'HieuLuc',
    "DieuKhoan" TEXT,
    "MaTaiKhoan_NVHD" INTEGER NOT NULL,
    "MaCoQuan" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HopDong_pkey" PRIMARY KEY ("MaHopDong")
);

-- CreateTable
CREATE TABLE "ChiTietHopDong" (
    "MaHopDong" INTEGER NOT NULL,
    "MaHangHoa" INTEGER NOT NULL,
    "SoLuongToiDa" INTEGER NOT NULL,
    "SoTienToiDa" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChiTietHopDong_pkey" PRIMARY KEY ("MaHopDong","MaHangHoa")
);

-- CreateTable
CREATE TABLE "DonDatHang" (
    "MaDonHang" SERIAL NOT NULL,
    "NgayDat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "TrangThai" "TrangThaiDonHang" NOT NULL DEFAULT 'ChoDuyet',
    "TongTien" DECIMAL(18,2) NOT NULL,
    "LuuY" TEXT,
    "MaHopDong" INTEGER NOT NULL,
    "MaTaiKhoan_NVMS" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonDatHang_pkey" PRIMARY KEY ("MaDonHang")
);

-- CreateTable
CREATE TABLE "ChiTietDonHang" (
    "MaDonHang" INTEGER NOT NULL,
    "MaHangHoa" INTEGER NOT NULL,
    "SoLuongDat" INTEGER NOT NULL,
    "SoLuongGiao" INTEGER NOT NULL DEFAULT 0,
    "DonGia" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChiTietDonHang_pkey" PRIMARY KEY ("MaDonHang","MaHangHoa")
);

-- CreateTable
CREATE TABLE "HangHoa" (
    "MaHangHoa" SERIAL NOT NULL,
    "Ten" TEXT NOT NULL,
    "Gia" DECIMAL(18,2) NOT NULL,
    "SoLuongTrongKho" INTEGER NOT NULL DEFAULT 0,
    "ViTriKho" TEXT,
    "MoTa" TEXT,
    "TrangThai" "TrangThaiHangHoa" NOT NULL DEFAULT 'CoDuong',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HangHoa_pkey" PRIMARY KEY ("MaHangHoa")
);

-- CreateTable
CREATE TABLE "GiaoHang" (
    "MaGiaoHang" SERIAL NOT NULL,
    "NgayGiao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "DonViVanChuyen" TEXT,
    "TrangThai" "TrangThaiGiaoHang" NOT NULL DEFAULT 'DangDongGoi',
    "GhiChu" TEXT,
    "MaDonHang" INTEGER NOT NULL,
    "MaTaiKhoan_NVKho" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiaoHang_pkey" PRIMARY KEY ("MaGiaoHang")
);

-- CreateTable
CREATE TABLE "HoaDonThanhToan" (
    "MaHoaDon" SERIAL NOT NULL,
    "NgayLap" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "HinhThucThanhToan" TEXT,
    "TongTien" DECIMAL(18,2) NOT NULL,
    "TrangThai" "TrangThaiHoaDon" NOT NULL DEFAULT 'ChoThanhToan',
    "GhiChu" TEXT,
    "MaDonHang" INTEGER NOT NULL,
    "MaTaiKhoan_NVTT" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HoaDonThanhToan_pkey" PRIMARY KEY ("MaHoaDon")
);

-- CreateTable
CREATE TABLE "ThuTuChoi" (
    "MaThuTuChoi" SERIAL NOT NULL,
    "LiDo" TEXT NOT NULL,
    "NgayGui" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "MaDonHang" INTEGER NOT NULL,
    "MaTaiKhoan_NVHD" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThuTuChoi_pkey" PRIMARY KEY ("MaThuTuChoi")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "MaLog" SERIAL NOT NULL,
    "HanhDong" TEXT NOT NULL,
    "DoiTuong" TEXT NOT NULL,
    "IdDoiTuong" INTEGER NOT NULL,
    "MaTaiKhoan" INTEGER NOT NULL,
    "ChiTiet" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("MaLog")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaiKhoan_TenNguoiDung_key" ON "TaiKhoan"("TenNguoiDung");

-- CreateIndex
CREATE UNIQUE INDEX "TaiKhoan_SDT_key" ON "TaiKhoan"("SDT");

-- CreateIndex
CREATE UNIQUE INDEX "TaiKhoan_Email_key" ON "TaiKhoan"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "NhanVienThanhToan_MaSoKeToan_key" ON "NhanVienThanhToan"("MaSoKeToan");

-- CreateIndex
CREATE INDEX "HopDong_MaTaiKhoan_NVHD_idx" ON "HopDong"("MaTaiKhoan_NVHD");

-- CreateIndex
CREATE INDEX "HopDong_MaCoQuan_idx" ON "HopDong"("MaCoQuan");

-- CreateIndex
CREATE INDEX "DonDatHang_MaHopDong_idx" ON "DonDatHang"("MaHopDong");

-- CreateIndex
CREATE INDEX "DonDatHang_MaTaiKhoan_NVMS_idx" ON "DonDatHang"("MaTaiKhoan_NVMS");

-- CreateIndex
CREATE INDEX "GiaoHang_MaDonHang_idx" ON "GiaoHang"("MaDonHang");

-- CreateIndex
CREATE INDEX "GiaoHang_MaTaiKhoan_NVKho_idx" ON "GiaoHang"("MaTaiKhoan_NVKho");

-- CreateIndex
CREATE INDEX "HoaDonThanhToan_MaDonHang_idx" ON "HoaDonThanhToan"("MaDonHang");

-- CreateIndex
CREATE INDEX "HoaDonThanhToan_MaTaiKhoan_NVTT_idx" ON "HoaDonThanhToan"("MaTaiKhoan_NVTT");

-- CreateIndex
CREATE INDEX "ThuTuChoi_MaDonHang_idx" ON "ThuTuChoi"("MaDonHang");

-- CreateIndex
CREATE INDEX "AuditLog_IdDoiTuong_idx" ON "AuditLog"("IdDoiTuong");

-- CreateIndex
CREATE INDEX "AuditLog_MaTaiKhoan_idx" ON "AuditLog"("MaTaiKhoan");

-- AddForeignKey
ALTER TABLE "NhanVienHopDong" ADD CONSTRAINT "NhanVienHopDong_MaTaiKhoan_fkey" FOREIGN KEY ("MaTaiKhoan") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NhanVienMuaSamCoQuan" ADD CONSTRAINT "NhanVienMuaSamCoQuan_MaTaiKhoan_fkey" FOREIGN KEY ("MaTaiKhoan") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NhanVienMuaSamCoQuan" ADD CONSTRAINT "NhanVienMuaSamCoQuan_MaCoQuan_fkey" FOREIGN KEY ("MaCoQuan") REFERENCES "CoQuanChinhPhu"("MaCoQuan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NhanVienThanhToan" ADD CONSTRAINT "NhanVienThanhToan_MaTaiKhoan_fkey" FOREIGN KEY ("MaTaiKhoan") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NhanVienKho" ADD CONSTRAINT "NhanVienKho_MaTaiKhoan_fkey" FOREIGN KEY ("MaTaiKhoan") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HopDong" ADD CONSTRAINT "HopDong_MaTaiKhoan_NVHD_fkey" FOREIGN KEY ("MaTaiKhoan_NVHD") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HopDong" ADD CONSTRAINT "HopDong_MaCoQuan_fkey" FOREIGN KEY ("MaCoQuan") REFERENCES "CoQuanChinhPhu"("MaCoQuan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChiTietHopDong" ADD CONSTRAINT "ChiTietHopDong_MaHopDong_fkey" FOREIGN KEY ("MaHopDong") REFERENCES "HopDong"("MaHopDong") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChiTietHopDong" ADD CONSTRAINT "ChiTietHopDong_MaHangHoa_fkey" FOREIGN KEY ("MaHangHoa") REFERENCES "HangHoa"("MaHangHoa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonDatHang" ADD CONSTRAINT "DonDatHang_MaHopDong_fkey" FOREIGN KEY ("MaHopDong") REFERENCES "HopDong"("MaHopDong") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonDatHang" ADD CONSTRAINT "DonDatHang_MaTaiKhoan_NVMS_fkey" FOREIGN KEY ("MaTaiKhoan_NVMS") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChiTietDonHang" ADD CONSTRAINT "ChiTietDonHang_MaDonHang_fkey" FOREIGN KEY ("MaDonHang") REFERENCES "DonDatHang"("MaDonHang") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChiTietDonHang" ADD CONSTRAINT "ChiTietDonHang_MaHangHoa_fkey" FOREIGN KEY ("MaHangHoa") REFERENCES "HangHoa"("MaHangHoa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiaoHang" ADD CONSTRAINT "GiaoHang_MaDonHang_fkey" FOREIGN KEY ("MaDonHang") REFERENCES "DonDatHang"("MaDonHang") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiaoHang" ADD CONSTRAINT "GiaoHang_MaTaiKhoan_NVKho_fkey" FOREIGN KEY ("MaTaiKhoan_NVKho") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoaDonThanhToan" ADD CONSTRAINT "HoaDonThanhToan_MaDonHang_fkey" FOREIGN KEY ("MaDonHang") REFERENCES "DonDatHang"("MaDonHang") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoaDonThanhToan" ADD CONSTRAINT "HoaDonThanhToan_MaTaiKhoan_NVTT_fkey" FOREIGN KEY ("MaTaiKhoan_NVTT") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThuTuChoi" ADD CONSTRAINT "ThuTuChoi_MaDonHang_fkey" FOREIGN KEY ("MaDonHang") REFERENCES "DonDatHang"("MaDonHang") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThuTuChoi" ADD CONSTRAINT "ThuTuChoi_MaTaiKhoan_NVHD_fkey" FOREIGN KEY ("MaTaiKhoan_NVHD") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE RESTRICT ON UPDATE CASCADE;

