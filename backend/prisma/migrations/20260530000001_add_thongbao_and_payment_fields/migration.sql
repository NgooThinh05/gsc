-- AlterTable: thêm thông tin thanh toán cho hóa đơn
ALTER TABLE "HoaDonThanhToan" ADD COLUMN "PhuongThuc" TEXT;
ALTER TABLE "HoaDonThanhToan" ADD COLUMN "MaGiaoDich" TEXT;
ALTER TABLE "HoaDonThanhToan" ADD COLUMN "NgayThanhToan" TIMESTAMP(3);

-- CreateTable: thông báo gửi tới tài khoản
CREATE TABLE "ThongBao" (
    "MaThongBao" SERIAL NOT NULL,
    "NoiDung" TEXT NOT NULL,
    "Loai" TEXT,
    "DaDoc" BOOLEAN NOT NULL DEFAULT false,
    "MaTaiKhoan" INTEGER NOT NULL,
    "MaDonHang" INTEGER,
    "MaHoaDon" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThongBao_pkey" PRIMARY KEY ("MaThongBao")
);

-- CreateIndex
CREATE INDEX "ThongBao_MaTaiKhoan_idx" ON "ThongBao"("MaTaiKhoan");

-- AddForeignKey
ALTER TABLE "ThongBao" ADD CONSTRAINT "ThongBao_MaTaiKhoan_fkey" FOREIGN KEY ("MaTaiKhoan") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE CASCADE ON UPDATE CASCADE;
