// ============================================
// GSC PROCUREMENT SYSTEM - SEED DATA
// Dữ liệu mẫu để test các chức năng
// Chạy: npx prisma db seed
// ============================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = '123456';

// Helper: ngày trong quá khứ / tương lai
const now = new Date();
const futureDate = (days) => { const d = new Date(now); d.setDate(d.getDate() + days); return d; };
const pastDate = (days) => { const d = new Date(now); d.setDate(d.getDate() - days); return d; };

async function main() {
  console.log('🌱 Bắt đầu seed data...\n');
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // ===========================================================
  // 1. TÀI KHOẢN (TaiKhoan)
  // ===========================================================
  console.log('📦 Tạo tài khoản...');
  const tkData = [
    { TenNguoiDung: 'admin',             SDT: '0901000001', Email: 'admin@gsc.com',        VaiTro: 'Admin',                 TrangThai: 'HoatDong' },
    { TenNguoiDung: 'nvhopdong1',        SDT: '0901000002', Email: 'nvhopdong1@gsc.com',   VaiTro: 'NhanVienHopDong',       TrangThai: 'HoatDong' },
    { TenNguoiDung: 'nvhopdong2',        SDT: '0901000003', Email: 'nvhopdong2@gsc.com',   VaiTro: 'NhanVienHopDong',       TrangThai: 'HoatDong' },
    { TenNguoiDung: 'nvmuasam1',         SDT: '0901000004', Email: 'nvmuasam1@gsc.com',    VaiTro: 'NhanVienMuaSamCoQuan',  TrangThai: 'HoatDong' },
    { TenNguoiDung: 'nvmuasam2',         SDT: '0901000005', Email: 'nvmuasam2@gsc.com',    VaiTro: 'NhanVienMuaSamCoQuan',  TrangThai: 'HoatDong' },
    { TenNguoiDung: 'nvkho1',            SDT: '0901000006', Email: 'nvkho1@gsc.com',       VaiTro: 'NhanVienKho',           TrangThai: 'HoatDong' },
    { TenNguoiDung: 'nvkho2',            SDT: '0901000007', Email: 'nvkho2@gsc.com',       VaiTro: 'NhanVienKho',           TrangThai: 'HoatDong' },
    { TenNguoiDung: 'nvkho3',            SDT: '0901000011', Email: 'nvkho3@gsc.com',       VaiTro: 'NhanVienKho',           TrangThai: 'Khoa'     },
    { TenNguoiDung: 'nvthanhtoan1',      SDT: '0901000008', Email: 'nvthanhtoan1@gsc.com', VaiTro: 'NhanVienThanhToan',     TrangThai: 'HoatDong' },
    { TenNguoiDung: 'nvthanhtoan2',      SDT: '0901000009', Email: 'nvthanhtoan2@gsc.com', VaiTro: 'NhanVienThanhToan',     TrangThai: 'HoatDong' },
    { TenNguoiDung: 'quanly1',           SDT: '0901000010', Email: 'quanly1@gsc.com',      VaiTro: 'QuanLy',                TrangThai: 'HoatDong' },
  ];

  const tkMap = {};
  for (const tk of tkData) {
    const created = await prisma.taiKhoan.upsert({
      where: { Email: tk.Email },
      update: { TenNguoiDung: tk.TenNguoiDung, SDT: tk.SDT, VaiTro: tk.VaiTro, TrangThai: tk.TrangThai },
      create: { ...tk, MatKhau: hashedPassword },
    });
    tkMap[tk.TenNguoiDung] = created.MaTaiKhoan;
    console.log(`  ✅ ${tk.TenNguoiDung} (ID: ${created.MaTaiKhoan})`);
  }

  // Reset serial để các bản ghi mới bắt đầu từ số tiếp theo
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"TaiKhoan"', 'MaTaiKhoan'), (SELECT COALESCE(MAX("MaTaiKhoan"), 11) FROM "TaiKhoan"), true)`;

  // ===========================================================
  // 2. CƠ QUAN CHÍNH PHỦ
  // ===========================================================
  console.log('\n📦 Tạo cơ quan chính phủ...');
  const cqData = [
    { Ten: 'Bộ Kế hoạch và Đầu tư',             DiaChi: '6B Hoàng Diệu, Ba Đình, Hà Nội',           DienThoai: '02438030261', Email: 'info@mpi.gov.vn' },
    { Ten: 'Bộ Tài chính',                       DiaChi: '28 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội',     DienThoai: '02422208028', Email: 'info@mof.gov.vn' },
    { Ten: 'UBND Thành phố Hồ Chí Minh',         DiaChi: '86 Lê Thánh Tôn, Q.1, TP.HCM',             DienThoai: '02838297788', Email: 'info@tphcm.gov.vn' },
    { Ten: 'Sở Công Thương Hà Nội',             DiaChi: '21 Phùng Hưng, Hà Đông, Hà Nội',          DienThoai: '02438253672', Email: 'info@soct.hanoi.gov.vn' },
    { Ten: 'Sở Giáo dục và Đào tạo Đà Nẵng',    DiaChi: '37 Lê Duẩn, Hải Châu, Đà Nẵng',           DienThoai: '02363888488', Email: 'info@sonn.danang.gov.vn' },
  ];
  const cqMap = {};
  for (const cq of cqData) {
    const existing = await prisma.coQuanChinhPhu.findFirst({ where: { Ten: cq.Ten } });
    if (existing) {
      cqMap[cq.Ten] = existing.MaCoQuan;
      console.log(`  🔹 ${cq.Ten} (đã tồn tại)`);
    } else {
      const created = await prisma.coQuanChinhPhu.create({ data: cq });
      cqMap[cq.Ten] = created.MaCoQuan;
      console.log(`  ✅ ${cq.Ten}`);
    }
  }
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"CoQuanChinhPhu"', 'MaCoQuan'), (SELECT COALESCE(MAX("MaCoQuan"), 5) FROM "CoQuanChinhPhu"), true)`;

  // ===========================================================
  // 3. SUBTYPE TÀI KHOẢN
  // ===========================================================
  console.log('\n📦 Tạo thông tin chi tiết nhân viên...');

  // NV Hợp đồng
  const upsertNVHD = async (username, data) => {
    await prisma.nhanVienHopDong.upsert({
      where: { MaTaiKhoan: tkMap[username] },
      update: data,
      create: { MaTaiKhoan: tkMap[username], ...data },
    });
  };
  await upsertNVHD('nvhopdong1', { ChucVu: 'Chuyên viên hợp đồng',        ChungChi: 'Cử nhân Luật',              HanMucDuyet: 500000000 });
  await upsertNVHD('nvhopdong2', { ChucVu: 'Trưởng phòng hợp đồng',       ChungChi: 'Thạc sĩ QTKD',              HanMucDuyet: 2000000000 });

  // NV Mua sắm
  const upsertNVMS = async (username, data) => {
    await prisma.nhanVienMuaSamCoQuan.upsert({
      where: { MaTaiKhoan: tkMap[username] },
      update: data,
      create: { MaTaiKhoan: tkMap[username], ...data },
    });
  };
  await upsertNVMS('nvmuasam1', { MaCoQuan: cqMap['Bộ Kế hoạch và Đầu tư'],             BoPhanCongTac: 'Phòng Vật tư' });
  await upsertNVMS('nvmuasam2', { MaCoQuan: cqMap['UBND Thành phố Hồ Chí Minh'],       BoPhanCongTac: 'Ban QLDA' });

  // NV Kho
  const upsertNVK = async (username, data) => {
    await prisma.nhanVienKho.upsert({
      where: { MaTaiKhoan: tkMap[username] },
      update: data,
      create: { MaTaiKhoan: tkMap[username], ...data },
    });
  };
  await upsertNVK('nvkho1', { KhuVucQuanLy: 'Kho Hà Nội',   CaLam: 'Sáng' });
  await upsertNVK('nvkho2', { KhuVucQuanLy: 'Kho TP.HCM',   CaLam: 'Chiều' });
  await upsertNVK('nvkho3', { KhuVucQuanLy: 'Kho Đà Nẵng',  CaLam: 'Sáng' });

  // NV Thanh toán
  const upsertNVTT = async (username, data) => {
    await prisma.nhanVienThanhToan.upsert({
      where: { MaTaiKhoan: tkMap[username] },
      update: data,
      create: { MaTaiKhoan: tkMap[username], ...data },
    });
  };
  await upsertNVTT('nvthanhtoan1', { MaSoKeToan: 'KT-2024-001', HanMucChiTra: 500000000 });
  await upsertNVTT('nvthanhtoan2', { MaSoKeToan: 'KT-2024-002', HanMucChiTra: 1000000000 });

  console.log('  ✅ Tất cả chi tiết nhân viên');

  // ===========================================================
  // 4. HÀNG HÓA
  // ===========================================================
  console.log('\n📦 Tạo hàng hóa...');
  const hhData = [
    { Ten: 'Máy tính xách tay Dell Latitude 3540',    Gia: 15990000, SoLuongTrongKho: 50,  ViTriKho: 'A1-01', MoTa: 'Core i5, 16GB, 512GB SSD' },
    { Ten: 'Máy tính để bàn HP ProDesk 400',           Gia: 12500000, SoLuongTrongKho: 30,  ViTriKho: 'A1-02', MoTa: 'Core i5, 8GB, 256GB SSD' },
    { Ten: 'Màn hình Dell 24 inch P2425H',             Gia: 4500000,  SoLuongTrongKho: 100, ViTriKho: 'A2-01', MoTa: 'IPS, 1920x1080, USB-C' },
    { Ten: 'Máy in Canon LBP226dw',                    Gia: 8500000,  SoLuongTrongKho: 15,  ViTriKho: 'A2-02', MoTa: 'A4, Laser trắng đen, WiFi' },
    { Ten: 'Bàn làm việc 160x80cm',                    Gia: 3200000,  SoLuongTrongKho: 40,  ViTriKho: 'B1-01', MoTa: 'Gỗ công nghiệp, chân sắt' },
    { Ten: 'Ghế văn phòng cao cấp',                    Gia: 5500000,  SoLuongTrongKho: 60,  ViTriKho: 'B1-02', MoTa: 'Lưới, tựa đầu, chỉnh tay vịn' },
    { Ten: 'Điều hòa Daikin 12000BTU',                 Gia: 12500000, SoLuongTrongKho: 20,  ViTriKho: 'B2-01', MoTa: 'Inverter, 1 chiều lạnh' },
    { Ten: 'Máy chiếu Epson EB-X50',                   Gia: 18000000, SoLuongTrongKho: 8,   ViTriKho: 'A3-01', MoTa: 'XGA, 3600 ANSI Lumens' },
    { Ten: 'USB 3.0 64GB SanDisk',                     Gia: 250000,   SoLuongTrongKho: 500, ViTriKho: 'C1-01', MoTa: '64GB, đọc 150MB/s' },
    { Ten: 'Bút bi Thiên Long TL-027',                 Gia: 5000,     SoLuongTrongKho: 0,   ViTriKho: 'C1-02', MoTa: 'Mực xanh, 0.7mm', TrangThai: 'HetHang' },
  ];

  const hhMap = {};
  for (const hh of hhData) {
    const existing = await prisma.hangHoa.findFirst({ where: { Ten: hh.Ten } });
    if (existing) {
      await prisma.hangHoa.update({ where: { MaHangHoa: existing.MaHangHoa }, data: hh });
      hhMap[hh.Ten] = existing.MaHangHoa;
      console.log(`  🔹 ${hh.Ten} (cập nhật)`);
    } else {
      const created = await prisma.hangHoa.create({ data: hh });
      hhMap[hh.Ten] = created.MaHangHoa;
      console.log(`  ✅ ${hh.Ten} (SL: ${hh.SoLuongTrongKho})`);
    }
  }
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"HangHoa"', 'MaHangHoa'), (SELECT COALESCE(MAX("MaHangHoa"), 10) FROM "HangHoa"), true)`;

  // ===========================================================
  // 5. HỢP ĐỒNG
  // ===========================================================
  console.log('\n📦 Tạo hợp đồng...');
  const hdData = [
    { NgayKy: pastDate(30),  NgayHetHan: futureDate(335), TrangThai: 'HieuLuc', DieuKhoan: 'Thanh toán trong 60 ngày kể từ khi giao hàng.',                          MaTaiKhoan_NVHD: tkMap['nvhopdong1'], MaCoQuan: cqMap['Bộ Kế hoạch và Đầu tư'] },
    { NgayKy: pastDate(15),  NgayHetHan: futureDate(350), TrangThai: 'HieuLuc', DieuKhoan: 'Bảo hành 24 tháng. Thanh toán theo tiến độ.',                            MaTaiKhoan_NVHD: tkMap['nvhopdong1'], MaCoQuan: cqMap['UBND Thành phố Hồ Chí Minh'] },
    { NgayKy: pastDate(60),  NgayHetHan: futureDate(305), TrangThai: 'HieuLuc', DieuKhoan: 'Giao hàng làm 3 đợt. Thanh toán sau mỗi đợt.',                           MaTaiKhoan_NVHD: tkMap['nvhopdong2'], MaCoQuan: cqMap['Bộ Tài chính'] },
    { NgayKy: pastDate(400), NgayHetHan: pastDate(35),    TrangThai: 'HetHan',  DieuKhoan: 'Hợp đồng đã kết thúc.',                                                  MaTaiKhoan_NVHD: tkMap['nvhopdong2'], MaCoQuan: cqMap['Sở Công Thương Hà Nội'] },
    { NgayKy: pastDate(10),  NgayHetHan: futureDate(355), TrangThai: 'TamDung', DieuKhoan: 'Tạm dừng do chờ phê duyệt ngân sách.',                                   MaTaiKhoan_NVHD: tkMap['nvhopdong1'], MaCoQuan: cqMap['Sở Giáo dục và Đào tạo Đà Nẵng'] },
  ];

  for (const hd of hdData) {
    const created = await prisma.hopDong.create({ data: hd });
    console.log(`  ✅ Hợp đồng ID: ${created.MaHopDong} - ${created.TrangThai}`);
  }

  // ===========================================================
  // 6. CHI TIẾT HỢP ĐỒNG
  // ===========================================================
  console.log('\n📦 Tạo chi tiết hợp đồng...');

  // HD 1: laptop, màn hình, ghế
  await prisma.chiTietHopDong.upsert({
    where: { MaHopDong_MaHangHoa: { MaHopDong: 1, MaHangHoa: hhMap['Máy tính xách tay Dell Latitude 3540'] } },
    update: { SoLuongToiDa: 20, SoTienToiDa: 20 * 15990000 },
    create: { MaHopDong: 1, MaHangHoa: hhMap['Máy tính xách tay Dell Latitude 3540'], SoLuongToiDa: 20, SoTienToiDa: 20 * 15990000 },
  });
  await prisma.chiTietHopDong.upsert({
    where: { MaHopDong_MaHangHoa: { MaHopDong: 1, MaHangHoa: hhMap['Màn hình Dell 24 inch P2425H'] } },
    update: { SoLuongToiDa: 20, SoTienToiDa: 20 * 4500000 },
    create: { MaHopDong: 1, MaHangHoa: hhMap['Màn hình Dell 24 inch P2425H'], SoLuongToiDa: 20, SoTienToiDa: 20 * 4500000 },
  });
  await prisma.chiTietHopDong.upsert({
    where: { MaHopDong_MaHangHoa: { MaHopDong: 1, MaHangHoa: hhMap['Ghế văn phòng cao cấp'] } },
    update: { SoLuongToiDa: 15, SoTienToiDa: 15 * 5500000 },
    create: { MaHopDong: 1, MaHangHoa: hhMap['Ghế văn phòng cao cấp'], SoLuongToiDa: 15, SoTienToiDa: 15 * 5500000 },
  });

  // HD 2: máy tính bàn, điều hòa, bàn
  await prisma.chiTietHopDong.upsert({
    where: { MaHopDong_MaHangHoa: { MaHopDong: 2, MaHangHoa: hhMap['Máy tính để bàn HP ProDesk 400'] } },
    update: { SoLuongToiDa: 10, SoTienToiDa: 10 * 12500000 },
    create: { MaHopDong: 2, MaHangHoa: hhMap['Máy tính để bàn HP ProDesk 400'], SoLuongToiDa: 10, SoTienToiDa: 10 * 12500000 },
  });
  await prisma.chiTietHopDong.upsert({
    where: { MaHopDong_MaHangHoa: { MaHopDong: 2, MaHangHoa: hhMap['Điều hòa Daikin 12000BTU'] } },
    update: { SoLuongToiDa: 5, SoTienToiDa: 5 * 12500000 },
    create: { MaHopDong: 2, MaHangHoa: hhMap['Điều hòa Daikin 12000BTU'], SoLuongToiDa: 5, SoTienToiDa: 5 * 12500000 },
  });
  await prisma.chiTietHopDong.upsert({
    where: { MaHopDong_MaHangHoa: { MaHopDong: 2, MaHangHoa: hhMap['Bàn làm việc 160x80cm'] } },
    update: { SoLuongToiDa: 8, SoTienToiDa: 8 * 3200000 },
    create: { MaHopDong: 2, MaHangHoa: hhMap['Bàn làm việc 160x80cm'], SoLuongToiDa: 8, SoTienToiDa: 8 * 3200000 },
  });

  // HD 3: máy chiếu, máy in, USB
  await prisma.chiTietHopDong.upsert({
    where: { MaHopDong_MaHangHoa: { MaHopDong: 3, MaHangHoa: hhMap['Máy chiếu Epson EB-X50'] } },
    update: { SoLuongToiDa: 3, SoTienToiDa: 3 * 18000000 },
    create: { MaHopDong: 3, MaHangHoa: hhMap['Máy chiếu Epson EB-X50'], SoLuongToiDa: 3, SoTienToiDa: 3 * 18000000 },
  });
  await prisma.chiTietHopDong.upsert({
    where: { MaHopDong_MaHangHoa: { MaHopDong: 3, MaHangHoa: hhMap['Máy in Canon LBP226dw'] } },
    update: { SoLuongToiDa: 5, SoTienToiDa: 5 * 8500000 },
    create: { MaHopDong: 3, MaHangHoa: hhMap['Máy in Canon LBP226dw'], SoLuongToiDa: 5, SoTienToiDa: 5 * 8500000 },
  });
  await prisma.chiTietHopDong.upsert({
    where: { MaHopDong_MaHangHoa: { MaHopDong: 3, MaHangHoa: hhMap['USB 3.0 64GB SanDisk'] } },
    update: { SoLuongToiDa: 100, SoTienToiDa: 100 * 250000 },
    create: { MaHopDong: 3, MaHangHoa: hhMap['USB 3.0 64GB SanDisk'], SoLuongToiDa: 100, SoTienToiDa: 100 * 250000 },
  });

  // HD 4 (hết hạn): laptop
  await prisma.chiTietHopDong.upsert({
    where: { MaHopDong_MaHangHoa: { MaHopDong: 4, MaHangHoa: hhMap['Máy tính xách tay Dell Latitude 3540'] } },
    update: { SoLuongToiDa: 5, SoTienToiDa: 5 * 15990000 },
    create: { MaHopDong: 4, MaHangHoa: hhMap['Máy tính xách tay Dell Latitude 3540'], SoLuongToiDa: 5, SoTienToiDa: 5 * 15990000 },
  });

  // HD 5 (tạm dừng): máy in + laptop
  await prisma.chiTietHopDong.upsert({
    where: { MaHopDong_MaHangHoa: { MaHopDong: 5, MaHangHoa: hhMap['Máy in Canon LBP226dw'] } },
    update: { SoLuongToiDa: 2, SoTienToiDa: 2 * 8500000 },
    create: { MaHopDong: 5, MaHangHoa: hhMap['Máy in Canon LBP226dw'], SoLuongToiDa: 2, SoTienToiDa: 2 * 8500000 },
  });
  await prisma.chiTietHopDong.upsert({
    where: { MaHopDong_MaHangHoa: { MaHopDong: 5, MaHangHoa: hhMap['Máy tính xách tay Dell Latitude 3540'] } },
    update: { SoLuongToiDa: 3, SoTienToiDa: 3 * 15990000 },
    create: { MaHopDong: 5, MaHangHoa: hhMap['Máy tính xách tay Dell Latitude 3540'], SoLuongToiDa: 3, SoTienToiDa: 3 * 15990000 },
  });
  console.log('  ✅ ChiTietHopDong x12');

  // ===========================================================
  // 7. ĐƠN ĐẶT HÀNG + CHI TIẾT
  // ===========================================================
  console.log('\n📦 Tạo đơn đặt hàng...');

  const dhData = [
    { NgayDat: pastDate(25), TrangThai: 'DaDuyet',      TongTien: 319800000,  LuuY: 'Giao trước ngày 15/06',                                               MaHopDong: 1, MaTaiKhoan_NVMS: tkMap['nvmuasam1'] },
    { NgayDat: pastDate(20), TrangThai: 'SanSangGiao',   TongTien: 142500000,  LuuY: 'Giao đến 6B Hoàng Diệu',                                               MaHopDong: 1, MaTaiKhoan_NVMS: tkMap['nvmuasam1'] },
    { NgayDat: pastDate(10), TrangThai: 'GiaoMotPhan',   TongTien: 185800000,  LuuY: 'Ưu tiên giao trước máy tính',                                           MaHopDong: 2, MaTaiKhoan_NVMS: tkMap['nvmuasam2'] },
    { NgayDat: pastDate(5),  TrangThai: 'ChoDuyet',      TongTien: 226000000,  LuuY: 'Cần gấp cho hội nghị cuối năm',                                         MaHopDong: 3, MaTaiKhoan_NVMS: tkMap['nvmuasam1'] },
    { NgayDat: pastDate(2),  TrangThai: 'ChoDuyet',      TongTien: 79000000,   LuuY: '',                                                                         MaHopDong: 2, MaTaiKhoan_NVMS: tkMap['nvmuasam2'] },
    { NgayDat: pastDate(1),  TrangThai: 'Huy',           TongTien: 0,          LuuY: 'Đơn hàng bị hủy do hết ngân sách',                                      MaHopDong: 1, MaTaiKhoan_NVMS: tkMap['nvmuasam1'] },
    { NgayDat: pastDate(30), TrangThai: 'DaGiao',        TongTien: 150000000,  LuuY: 'Đã giao đủ',                                                               MaHopDong: 3, MaTaiKhoan_NVMS: tkMap['nvmuasam1'] },
  ];

  for (const dh of dhData) {
    const created = await prisma.donDatHang.create({ data: dh });
    console.log(`  ✅ DonDatHang ID: ${created.MaDonHang} - ${created.TrangThai}`);
  }

  // ===========================================================
  // 8. CHI TIẾT ĐƠN HÀNG
  // ===========================================================
  console.log('\n📦 Tạo chi tiết đơn hàng...');

  const ctdhData = [
    // ĐH 1 (Đã duyệt): 10 laptop + 5 màn hình
    { MaDonHang: 1, MaHangHoa: hhMap['Máy tính xách tay Dell Latitude 3540'], SoLuongDat: 10, SoLuongGiao: 0,  DonGia: 15990000 },
    { MaDonHang: 1, MaHangHoa: hhMap['Màn hình Dell 24 inch P2425H'],         SoLuongDat: 5,  SoLuongGiao: 0,  DonGia: 4500000 },

    // ĐH 2 (Sẵn sàng giao): 5 laptop + 10 màn + 5 ghế
    { MaDonHang: 2, MaHangHoa: hhMap['Máy tính xách tay Dell Latitude 3540'], SoLuongDat: 5,  SoLuongGiao: 5,  DonGia: 15990000 },
    { MaDonHang: 2, MaHangHoa: hhMap['Màn hình Dell 24 inch P2425H'],         SoLuongDat: 10, SoLuongGiao: 10, DonGia: 4500000 },
    { MaDonHang: 2, MaHangHoa: hhMap['Ghế văn phòng cao cấp'],                SoLuongDat: 5,  SoLuongGiao: 5,  DonGia: 5500000 },

    // ĐH 3 (Giao một phần - THIẾU HÀNG): 8 MT bàn + 4 điều hòa + 5 bàn
    { MaDonHang: 3, MaHangHoa: hhMap['Máy tính để bàn HP ProDesk 400'],       SoLuongDat: 8,  SoLuongGiao: 6,  DonGia: 12500000 },
    { MaDonHang: 3, MaHangHoa: hhMap['Điều hòa Daikin 12000BTU'],             SoLuongDat: 4,  SoLuongGiao: 4,  DonGia: 12500000 },
    { MaDonHang: 3, MaHangHoa: hhMap['Bàn làm việc 160x80cm'],                SoLuongDat: 5,  SoLuongGiao: 3,  DonGia: 3200000 },

    // ĐH 4 (Chờ duyệt): 3 máy chiếu + 5 máy in + 200 USB
    { MaDonHang: 4, MaHangHoa: hhMap['Máy chiếu Epson EB-X50'],               SoLuongDat: 3,  SoLuongGiao: 0,  DonGia: 18000000 },
    { MaDonHang: 4, MaHangHoa: hhMap['Máy in Canon LBP226dw'],                SoLuongDat: 5,  SoLuongGiao: 0,  DonGia: 8500000 },
    { MaDonHang: 4, MaHangHoa: hhMap['USB 3.0 64GB SanDisk'],                 SoLuongDat: 200, SoLuongGiao: 0, DonGia: 250000 },

    // ĐH 5 (Chờ duyệt): 5 bàn + 10 ghế
    { MaDonHang: 5, MaHangHoa: hhMap['Bàn làm việc 160x80cm'],                SoLuongDat: 5,  SoLuongGiao: 0, DonGia: 3200000 },
    { MaDonHang: 5, MaHangHoa: hhMap['Ghế văn phòng cao cấp'],                SoLuongDat: 10, SoLuongGiao: 0, DonGia: 5500000 },

    // ĐH 6 (Hủy): 2 máy in
    { MaDonHang: 6, MaHangHoa: hhMap['Máy in Canon LBP226dw'],                SoLuongDat: 2,  SoLuongGiao: 0, DonGia: 8500000 },

    // ĐH 7 (Đã giao): 10 laptop + 5 máy in
    { MaDonHang: 7, MaHangHoa: hhMap['Máy tính xách tay Dell Latitude 3540'], SoLuongDat: 10, SoLuongGiao: 10, DonGia: 15990000 },
    { MaDonHang: 7, MaHangHoa: hhMap['Máy in Canon LBP226dw'],                SoLuongDat: 5,  SoLuongGiao: 5,  DonGia: 8500000 },
  ];

  for (const ct of ctdhData) {
    await prisma.chiTietDonHang.upsert({
      where: { MaDonHang_MaHangHoa: { MaDonHang: ct.MaDonHang, MaHangHoa: ct.MaHangHoa } },
      update: ct,
      create: ct,
    });
  }
  console.log('  ✅ ChiTietDonHang x16');

  // ===========================================================
  // 9. GIAO HÀNG
  // ===========================================================
  console.log('\n📦 Tạo phiếu giao hàng...');

  // Đơn hàng 7 (Đã giao) -> đã giao rồi
  // Đơn hàng 2 (Sẵn sàng giao) -> đang đóng gói
  // Đơn hàng 3 (Giao một phần) -> đang giao

  await prisma.giaoHang.create({ data: { NgayGiao: pastDate(20), DonViVanChuyen: 'EMS',  TrangThai: 'DaGiao',      GhiChu: 'Giao đúng hẹn',                              MaDonHang: 7, MaTaiKhoan_NVKho: tkMap['nvkho1'] } });
  await prisma.giaoHang.create({ data: { NgayGiao: now,           DonViVanChuyen: 'VNPost', TrangThai: 'DangDongGoi',                                              MaDonHang: 2, MaTaiKhoan_NVKho: tkMap['nvkho1'] } });
  await prisma.giaoHang.create({ data: { NgayGiao: pastDate(3),   DonViVanChuyen: 'GHTK', TrangThai: 'DangGiao',    GhiChu: 'Thiếu 2 máy tính bàn và 2 bàn do hết hàng', MaDonHang: 3, MaTaiKhoan_NVKho: tkMap['nvkho2'] } });
  console.log('  ✅ GiaoHang x3');

  // ===========================================================
  // 10. HÓA ĐƠN
  // ===========================================================
  console.log('\n📦 Tạo hóa đơn thanh toán...');

  // Hóa đơn ĐH 7
  await prisma.hoaDonThanhToan.create({
    data: { NgayLap: pastDate(18), HinhThucThanhToan: 'Chuyển khoản', TongTien: 10 * 15990000 + 5 * 8500000, TrangThai: 'DaThanhToan', GhiChu: 'Đã thanh toán đủ', MaDonHang: 7, MaTaiKhoan_NVTT: tkMap['nvthanhtoan1'] },
  });

  // Hóa đơn ĐH 2 (chờ thanh toán)
  await prisma.hoaDonThanhToan.create({
    data: { NgayLap: now, HinhThucThanhToan: 'Chuyển khoản', TongTien: 5 * 15990000 + 10 * 4500000 + 5 * 5500000, TrangThai: 'ChoThanhToan', MaDonHang: 2, MaTaiKhoan_NVTT: tkMap['nvthanhtoan1'] },
  });

  // Hóa đơn ĐH 3 (giao một phần)
  await prisma.hoaDonThanhToan.create({
    data: { NgayLap: pastDate(2), HinhThucThanhToan: 'Tiền mặt', TongTien: 6 * 12500000 + 4 * 12500000 + 3 * 3200000, TrangThai: 'ChoThanhToan', GhiChu: 'Chờ thanh toán phần đã giao', MaDonHang: 3, MaTaiKhoan_NVTT: tkMap['nvthanhtoan2'] },
  });
  console.log('  ✅ HoaDonThanhToan x3');

  // ===========================================================
  // KẾT THÚC
  // ===========================================================
  console.log('\n🎉 Seed data hoàn tất!');
  console.log(`📊 Tổng kết:`);
  console.log(`   - TaiKhoan:           ${tkData.length} tài khoản`);
  console.log(`   - CoQuanChinhPhu:     ${cqData.length} cơ quan`);
  console.log(`   - HangHoa:            ${hhData.length} mặt hàng`);
  console.log(`   - HopDong:            ${hdData.length} hợp đồng`);
  console.log(`   - DonDatHang:         ${dhData.length} đơn hàng`);
  console.log(`   - GiaoHang:           3 phiếu`);
  console.log(`   - HoaDonThanhToan:    3 hóa đơn`);
  console.log(`\n🔑 Mật khẩu mặc định: ${DEFAULT_PASSWORD}`);
  console.log(`📧 Tài khoản mẫu: admin@gsc.com / nvhopdong1@gsc.com / ...\n`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error('❌ Lỗi seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
