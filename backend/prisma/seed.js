// ============================================
// GSC PROCUREMENT SYSTEM - SEED DATA
// Chạy: npx prisma db seed
// ============================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = '123456';

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
  // TaiKhoanCoQuan dùng MaCoQuan làm MaTaiKhoan (quan hệ 1:1 với cơ quan)
  const tkData = [
    { MaTaiKhoan: 'IT001',   TenNguoiDung: 'admin',       SDT: '0901000001', Email: 'admin@gsc.com',        VaiTro: 'Admin',           TrangThai: 'HoatDong' },
    { MaTaiKhoan: 'NVHD001', TenNguoiDung: 'nvhopdong1',  SDT: '0901000002', Email: 'nvhopdong1@gsc.com',   VaiTro: 'NhanVienHopDong', TrangThai: 'HoatDong' },
    { MaTaiKhoan: 'NVHD002', TenNguoiDung: 'nvhopdong2',  SDT: '0901000003', Email: 'nvhopdong2@gsc.com',   VaiTro: 'NhanVienHopDong', TrangThai: 'HoatDong' },
    { MaTaiKhoan: 'G05',     TenNguoiDung: 'nvmuasam1',   SDT: '0901000004', Email: 'nvmuasam1@gsc.com',    VaiTro: 'TaiKhoanCoQuan',  TrangThai: 'HoatDong' },
    { MaTaiKhoan: 'G12',     TenNguoiDung: 'nvmuasam2',   SDT: '0901000005', Email: 'nvmuasam2@gsc.com',    VaiTro: 'TaiKhoanCoQuan',  TrangThai: 'HoatDong' },
    { MaTaiKhoan: 'NVK001',  TenNguoiDung: 'nvkho1',      SDT: '0901000006', Email: 'nvkho1@gsc.com',       VaiTro: 'NhanVienKho',     TrangThai: 'HoatDong' },
    { MaTaiKhoan: 'NVK002',  TenNguoiDung: 'nvkho2',      SDT: '0901000007', Email: 'nvkho2@gsc.com',       VaiTro: 'NhanVienKho',     TrangThai: 'HoatDong' },
    { MaTaiKhoan: 'NVK003',  TenNguoiDung: 'nvkho3',      SDT: '0901000011', Email: 'nvkho3@gsc.com',       VaiTro: 'NhanVienKho',     TrangThai: 'Khoa'     },
    { MaTaiKhoan: 'QL001',   TenNguoiDung: 'quanly1',     SDT: '0901000010', Email: 'quanly1@gsc.com',      VaiTro: 'QuanLy',          TrangThai: 'HoatDong' },
  ];

  // Xóa tài khoản TaiKhoanCoQuan cũ có tiền tố NVMS (nếu còn từ seed cũ, bỏ qua nếu có ràng buộc)
  try {
    await prisma.taiKhoan.deleteMany({
      where: { MaTaiKhoan: { startsWith: 'NVMS' }, VaiTro: 'TaiKhoanCoQuan' }
    });
  } catch {
    console.log('  ⚠️  Không thể xóa tài khoản NVMS cũ (có dữ liệu liên quan) — bỏ qua');
  }

  const tkMap = {};
  for (const tk of tkData) {
    const created = await prisma.taiKhoan.upsert({
      where: { MaTaiKhoan: tk.MaTaiKhoan },
      update: { TenNguoiDung: tk.TenNguoiDung, SDT: tk.SDT, Email: tk.Email, VaiTro: tk.VaiTro, TrangThai: tk.TrangThai },
      create: { ...tk, MatKhau: hashedPassword },
    });
    tkMap[tk.TenNguoiDung] = created.MaTaiKhoan;
    console.log(`  ✅ ${tk.TenNguoiDung} (ID: ${created.MaTaiKhoan})`);
  }

  // ===========================================================
  // 2. CƠ QUAN CHÍNH PHỦ (mã định danh theo QĐ 20/2020/QĐ-TTg)
  // ===========================================================
  console.log('\n📦 Tạo cơ quan chính phủ...');

  const ministries = [
    { MaCoQuan: 'G01', Ten: 'Bộ Công an',                                      DiaChi: '44 Phạm Văn Đồng, Cầu Giấy, Hà Nội' },
    { MaCoQuan: 'G02', Ten: 'Bộ Công Thương',                                   DiaChi: '54 Hai Bà Trưng, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G03', Ten: 'Bộ Giáo dục và Đào tạo',                           DiaChi: '35 Đại Cồ Việt, Hai Bà Trưng, Hà Nội' },
    { MaCoQuan: 'G04', Ten: 'Bộ Giao thông vận tải',                             DiaChi: '80 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G05', Ten: 'Bộ Kế hoạch và Đầu tư',                            DiaChi: '6B Hoàng Diệu, Ba Đình, Hà Nội' },
    { MaCoQuan: 'G06', Ten: 'Bộ Khoa học và Công nghệ',                          DiaChi: '113 Trần Duy Hưng, Cầu Giấy, Hà Nội' },
    { MaCoQuan: 'G07', Ten: 'Bộ Lao động - Thương binh và Xã hội',              DiaChi: '12 Ngô Quyền, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G08', Ten: 'Bộ Ngoại giao',                                     DiaChi: '1 Tôn Thất Đàm, Ba Đình, Hà Nội' },
    { MaCoQuan: 'G09', Ten: 'Bộ Nội vụ',                                         DiaChi: '8 Tôn Thất Thuyết, Cầu Giấy, Hà Nội' },
    { MaCoQuan: 'G10', Ten: 'Bộ Nông nghiệp và Phát triển nông thôn',           DiaChi: '2 Ngọc Hà, Ba Đình, Hà Nội' },
    { MaCoQuan: 'G11', Ten: 'Bộ Quốc phòng',                                     DiaChi: '7 Nguyễn Tri Phương, Ba Đình, Hà Nội' },
    { MaCoQuan: 'G12', Ten: 'Bộ Tài chính',                                      DiaChi: '28 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G13', Ten: 'Bộ Tài nguyên và Môi trường',                      DiaChi: '10 Tôn Thất Thuyết, Cầu Giấy, Hà Nội' },
    { MaCoQuan: 'G14', Ten: 'Bộ Thông tin và Truyền thông',                      DiaChi: '18 Nguyễn Du, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G15', Ten: 'Bộ Tư pháp',                                        DiaChi: '60 Trần Phú, Ba Đình, Hà Nội' },
    { MaCoQuan: 'G16', Ten: 'Bộ Văn hóa, Thể thao và Du lịch',                  DiaChi: '51 Ngô Quyền, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G17', Ten: 'Bộ Xây dựng',                                       DiaChi: '37 Lê Đại Hành, Hai Bà Trưng, Hà Nội' },
    { MaCoQuan: 'G18', Ten: 'Bộ Y tế',                                            DiaChi: '138A Giảng Võ, Ba Đình, Hà Nội' },
    { MaCoQuan: 'G19', Ten: 'Ngân hàng Nhà nước Việt Nam',                       DiaChi: '49 Lý Thái Tổ, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G20', Ten: 'Thanh tra Chính phủ',                               DiaChi: '220 Đội Cấn, Ba Đình, Hà Nội' },
    { MaCoQuan: 'G21', Ten: 'Ủy ban Dân tộc',                                    DiaChi: '80 Phan Đình Phùng, Ba Đình, Hà Nội' },
    { MaCoQuan: 'G22', Ten: 'Văn phòng Chính phủ',                               DiaChi: '1 Hoàng Hoa Thám, Ba Đình, Hà Nội' },
    { MaCoQuan: 'G24', Ten: 'Bảo hiểm Xã hội Việt Nam',                          DiaChi: '7 Tràng Thi, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G27', Ten: 'Đài Tiếng nói Việt Nam',                            DiaChi: '58 Quán Sứ, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G28', Ten: 'Đài Truyền hình Việt Nam',                          DiaChi: '43 Nguyễn Chí Thanh, Đống Đa, Hà Nội' },
    { MaCoQuan: 'G30', Ten: 'Thông tấn xã Việt Nam',                             DiaChi: '5 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G34', Ten: 'Ủy ban Giám sát tài chính Quốc gia',               DiaChi: '10 Quang Trung, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G36', Ten: 'Ủy ban Quản lý vốn nhà nước tại doanh nghiệp',     DiaChi: '6 Bà Triệu, Hoàn Kiếm, Hà Nội' },
  ];

  const mofUnits = [
    { MaCoQuan: 'G12.01', Ten: 'Vụ Tài chính các ngân hàng và tổ chức tài chính',    DiaChi: '28 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G12.02', Ten: 'Vụ Ngân sách nhà nước',                               DiaChi: '28 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G12.03', Ten: 'Cục Quản lý nợ và tài chính đối ngoại',               DiaChi: '28 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G12.04', Ten: 'Cục Tài chính doanh nghiệp',                          DiaChi: '28 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G12.05', Ten: 'Vụ Chính sách thuế',                                  DiaChi: '28 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G12.06', Ten: 'Cục Quản lý Công sản',                                DiaChi: '28 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G12.08', Ten: 'Vụ Đầu tư',                                           DiaChi: '28 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G12.09', Ten: 'Vụ Tài chính hành chính sự nghiệp',                   DiaChi: '28 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G12.12', Ten: 'Kho bạc Nhà nước',                                    DiaChi: '28 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G12.16', Ten: 'Học viện Tài chính',                                  DiaChi: 'Đức Thắng, Bắc Từ Liêm, Hà Nội' },
    { MaCoQuan: 'G12.18', Ten: 'Tổng Cục Thuế',                                       DiaChi: '123 Lò Đúc, Hai Bà Trưng, Hà Nội' },
    { MaCoQuan: 'G12.22', Ten: 'Ủy ban Chứng khoán Nhà nước',                        DiaChi: '164 Trần Quang Khải, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G12.23', Ten: 'Cục Quản lý, giám sát bảo hiểm',                     DiaChi: '28 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G12.30', Ten: 'Cục Tin học và Thống kê tài chính',                   DiaChi: '28 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G12.32', Ten: 'Tổng cục Dự trữ Nhà nước',                            DiaChi: '25 Bà Triệu, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G12.34', Ten: 'Tổng cục Hải quan',                                   DiaChi: '162 Hà Nội Highway, Long Biên, Hà Nội' },
    { MaCoQuan: 'G12.35', Ten: 'Cục Quản lý Giá',                                     DiaChi: '28 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G12.55', Ten: 'Sở Giao dịch Chứng khoán Hà Nội',                    DiaChi: '2 Phan Chu Trinh, Hoàn Kiếm, Hà Nội' },
    { MaCoQuan: 'G12.56', Ten: 'Sở Giao dịch Chứng khoán TP.HCM',                    DiaChi: '16 Võ Văn Kiệt, Q.1, TP.HCM' },
    { MaCoQuan: 'G12.57', Ten: 'Trung tâm Lưu ký Chứng khoán Việt Nam',              DiaChi: '15 Đào Duy Anh, Đống Đa, Hà Nội' },
    { MaCoQuan: 'G12.58', Ten: 'Sở Giao dịch Chứng khoán Việt Nam',                  DiaChi: '16 Võ Văn Kiệt, Q.1, TP.HCM' },
  ];

  const allAgencies = [...ministries, ...mofUnits];
  for (const cq of allAgencies) {
    await prisma.coQuanChinhPhu.upsert({
      where: { MaCoQuan: cq.MaCoQuan },
      update: { Ten: cq.Ten, DiaChi: cq.DiaChi },
      create: cq,
    });
  }
  console.log(`  ✅ ${allAgencies.length} cơ quan`);

  // ===========================================================
  // 3. SUBTYPE TÀI KHOẢN
  // ===========================================================
  console.log('\n📦 Tạo thông tin chi tiết nhân viên...');

  for (const username of ['nvhopdong1', 'nvhopdong2']) {
    await prisma.nhanVienHopDong.upsert({
      where: { MaTaiKhoan: tkMap[username] },
      update: {},
      create: { MaTaiKhoan: tkMap[username] },
    });
  }

  // MaTaiKhoan của TaiKhoanCoQuan chính là MaCoQuan
  await prisma.taiKhoanCoQuan.upsert({
    where: { MaTaiKhoan: 'G05' },
    update: { MaCoQuan: 'G05' },
    create: { MaTaiKhoan: 'G05', MaCoQuan: 'G05' },
  });
  await prisma.taiKhoanCoQuan.upsert({
    where: { MaTaiKhoan: 'G12' },
    update: { MaCoQuan: 'G12' },
    create: { MaTaiKhoan: 'G12', MaCoQuan: 'G12' },
  });

  for (const username of ['nvkho1', 'nvkho2', 'nvkho3']) {
    await prisma.nhanVienKho.upsert({
      where: { MaTaiKhoan: tkMap[username] },
      update: {},
      create: { MaTaiKhoan: tkMap[username] },
    });
  }

  await prisma.quanLy.upsert({
    where: { MaTaiKhoan: tkMap['quanly1'] },
    update: {},
    create: { MaTaiKhoan: tkMap['quanly1'] },
  });

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
    { NgayKy: pastDate(30),  NgayHetHan: futureDate(335), TrangThai: 'HieuLuc', DieuKhoan: 'Thanh toán trong 60 ngày kể từ khi giao hàng.',     MaTaiKhoan_NVHD: tkMap['nvhopdong1'], MaCoQuan: 'G05' },
    { NgayKy: pastDate(15),  NgayHetHan: futureDate(350), TrangThai: 'HieuLuc', DieuKhoan: 'Bảo hành 24 tháng. Thanh toán theo tiến độ.',        MaTaiKhoan_NVHD: tkMap['nvhopdong1'], MaCoQuan: 'G22' },
    { NgayKy: pastDate(60),  NgayHetHan: futureDate(305), TrangThai: 'HieuLuc', DieuKhoan: 'Giao hàng làm 3 đợt. Thanh toán sau mỗi đợt.',       MaTaiKhoan_NVHD: tkMap['nvhopdong2'], MaCoQuan: 'G12' },
    { NgayKy: pastDate(400), NgayHetHan: pastDate(35),    TrangThai: 'HetHan',  DieuKhoan: 'Hợp đồng đã kết thúc.',                              MaTaiKhoan_NVHD: tkMap['nvhopdong2'], MaCoQuan: 'G02' },
    { NgayKy: pastDate(10),  NgayHetHan: futureDate(355), TrangThai: 'TamDung', DieuKhoan: 'Tạm dừng do chờ phê duyệt ngân sách.',               MaTaiKhoan_NVHD: tkMap['nvhopdong1'], MaCoQuan: 'G03' },
  ];

  for (const hd of hdData) {
    const created = await prisma.hopDong.create({ data: hd });
    console.log(`  ✅ Hợp đồng ID: ${created.MaHopDong} - ${created.TrangThai}`);
  }
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"HopDong"', 'MaHopDong'), (SELECT COALESCE(MAX("MaHopDong"), 5) FROM "HopDong"), true)`;

  // ===========================================================
  // 6. CHI TIẾT HỢP ĐỒNG
  // ===========================================================
  console.log('\n📦 Tạo chi tiết hợp đồng...');

  const cthdData = [
    { MaHopDong: 1, MaHangHoa: hhMap['Máy tính xách tay Dell Latitude 3540'], SoTienToiDa: 20 * 15990000 },
    { MaHopDong: 1, MaHangHoa: hhMap['Màn hình Dell 24 inch P2425H'],         SoTienToiDa: 20 * 4500000  },
    { MaHopDong: 1, MaHangHoa: hhMap['Ghế văn phòng cao cấp'],                SoTienToiDa: 15 * 5500000  },
    { MaHopDong: 2, MaHangHoa: hhMap['Máy tính để bàn HP ProDesk 400'],       SoTienToiDa: 10 * 12500000 },
    { MaHopDong: 2, MaHangHoa: hhMap['Điều hòa Daikin 12000BTU'],             SoTienToiDa: 5  * 12500000 },
    { MaHopDong: 2, MaHangHoa: hhMap['Bàn làm việc 160x80cm'],                SoTienToiDa: 8  * 3200000  },
    { MaHopDong: 3, MaHangHoa: hhMap['Máy chiếu Epson EB-X50'],               SoTienToiDa: 3  * 18000000 },
    { MaHopDong: 3, MaHangHoa: hhMap['Máy in Canon LBP226dw'],                SoTienToiDa: 5  * 8500000  },
    { MaHopDong: 3, MaHangHoa: hhMap['USB 3.0 64GB SanDisk'],                 SoTienToiDa: 100 * 250000  },
    { MaHopDong: 4, MaHangHoa: hhMap['Máy tính xách tay Dell Latitude 3540'], SoTienToiDa: 5  * 15990000 },
    { MaHopDong: 5, MaHangHoa: hhMap['Máy in Canon LBP226dw'],                SoTienToiDa: 2  * 8500000  },
    { MaHopDong: 5, MaHangHoa: hhMap['Máy tính xách tay Dell Latitude 3540'], SoTienToiDa: 3  * 15990000 },
  ];

  for (const ct of cthdData) {
    await prisma.chiTietHopDong.upsert({
      where: { MaHopDong_MaHangHoa: { MaHopDong: ct.MaHopDong, MaHangHoa: ct.MaHangHoa } },
      update: { SoTienToiDa: ct.SoTienToiDa },
      create: ct,
    });
  }
  console.log(`  ✅ ChiTietHopDong x${cthdData.length}`);

  // ===========================================================
  // 7. ĐƠN ĐẶT HÀNG
  // ===========================================================
  console.log('\n📦 Tạo đơn đặt hàng...');

  const dhData = [
    { NgayDat: pastDate(25), TrangThai: 'DaDuyet',    TongTien: 319800000, LuuY: 'Giao trước ngày 15/06',           MaHopDong: 1, MaTaiKhoan_NVMS: tkMap['nvmuasam1'] },
    { NgayDat: pastDate(20), TrangThai: 'SanSangGiao', TongTien: 142500000, LuuY: 'Giao đến 6B Hoàng Diệu',          MaHopDong: 1, MaTaiKhoan_NVMS: tkMap['nvmuasam1'] },
    { NgayDat: pastDate(10), TrangThai: 'GiaoMotPhan', TongTien: 185800000, LuuY: 'Ưu tiên giao trước máy tính',     MaHopDong: 2, MaTaiKhoan_NVMS: tkMap['nvmuasam2'] },
    { NgayDat: pastDate(5),  TrangThai: 'ChoDuyet',   TongTien: 226000000, LuuY: 'Cần gấp cho hội nghị cuối năm',   MaHopDong: 3, MaTaiKhoan_NVMS: tkMap['nvmuasam1'] },
    { NgayDat: pastDate(2),  TrangThai: 'ChoDuyet',   TongTien: 79000000,  LuuY: '',                                  MaHopDong: 2, MaTaiKhoan_NVMS: tkMap['nvmuasam2'] },
    { NgayDat: pastDate(1),  TrangThai: 'Huy',        TongTien: 0,         LuuY: 'Đơn hàng bị hủy do hết ngân sách', MaHopDong: 1, MaTaiKhoan_NVMS: tkMap['nvmuasam1'] },
    { NgayDat: pastDate(30), TrangThai: 'DaGiao',     TongTien: 150000000, LuuY: 'Đã giao đủ',                       MaHopDong: 3, MaTaiKhoan_NVMS: tkMap['nvmuasam1'] },
  ];

  for (const dh of dhData) {
    const created = await prisma.donDatHang.create({ data: dh });
    console.log(`  ✅ DonDatHang ID: ${created.MaDonHang} - ${created.TrangThai}`);
  }
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"DonDatHang"', 'MaDonHang'), (SELECT COALESCE(MAX("MaDonHang"), 7) FROM "DonDatHang"), true)`;

  // ===========================================================
  // 8. CHI TIẾT ĐƠN HÀNG
  // ===========================================================
  console.log('\n📦 Tạo chi tiết đơn hàng...');

  const ctdhData = [
    { MaDonHang: 1, MaHangHoa: hhMap['Máy tính xách tay Dell Latitude 3540'], SoLuongDat: 10, SoLuongGiao: 0,  DonGia: 15990000 },
    { MaDonHang: 1, MaHangHoa: hhMap['Màn hình Dell 24 inch P2425H'],         SoLuongDat: 5,  SoLuongGiao: 0,  DonGia: 4500000  },
    { MaDonHang: 2, MaHangHoa: hhMap['Máy tính xách tay Dell Latitude 3540'], SoLuongDat: 5,  SoLuongGiao: 5,  DonGia: 15990000 },
    { MaDonHang: 2, MaHangHoa: hhMap['Màn hình Dell 24 inch P2425H'],         SoLuongDat: 10, SoLuongGiao: 10, DonGia: 4500000  },
    { MaDonHang: 2, MaHangHoa: hhMap['Ghế văn phòng cao cấp'],                SoLuongDat: 5,  SoLuongGiao: 5,  DonGia: 5500000  },
    { MaDonHang: 3, MaHangHoa: hhMap['Máy tính để bàn HP ProDesk 400'],       SoLuongDat: 8,  SoLuongGiao: 6,  DonGia: 12500000 },
    { MaDonHang: 3, MaHangHoa: hhMap['Điều hòa Daikin 12000BTU'],             SoLuongDat: 4,  SoLuongGiao: 4,  DonGia: 12500000 },
    { MaDonHang: 3, MaHangHoa: hhMap['Bàn làm việc 160x80cm'],                SoLuongDat: 5,  SoLuongGiao: 3,  DonGia: 3200000  },
    { MaDonHang: 4, MaHangHoa: hhMap['Máy chiếu Epson EB-X50'],               SoLuongDat: 3,  SoLuongGiao: 0,  DonGia: 18000000 },
    { MaDonHang: 4, MaHangHoa: hhMap['Máy in Canon LBP226dw'],                SoLuongDat: 5,  SoLuongGiao: 0,  DonGia: 8500000  },
    { MaDonHang: 4, MaHangHoa: hhMap['USB 3.0 64GB SanDisk'],                 SoLuongDat: 200,SoLuongGiao: 0,  DonGia: 250000   },
    { MaDonHang: 5, MaHangHoa: hhMap['Bàn làm việc 160x80cm'],                SoLuongDat: 5,  SoLuongGiao: 0,  DonGia: 3200000  },
    { MaDonHang: 5, MaHangHoa: hhMap['Ghế văn phòng cao cấp'],                SoLuongDat: 10, SoLuongGiao: 0,  DonGia: 5500000  },
    { MaDonHang: 6, MaHangHoa: hhMap['Máy in Canon LBP226dw'],                SoLuongDat: 2,  SoLuongGiao: 0,  DonGia: 8500000  },
    { MaDonHang: 7, MaHangHoa: hhMap['Máy tính xách tay Dell Latitude 3540'], SoLuongDat: 10, SoLuongGiao: 10, DonGia: 15990000 },
    { MaDonHang: 7, MaHangHoa: hhMap['Máy in Canon LBP226dw'],                SoLuongDat: 5,  SoLuongGiao: 5,  DonGia: 8500000  },
  ];

  for (const ct of ctdhData) {
    await prisma.chiTietDonHang.upsert({
      where: { MaDonHang_MaHangHoa: { MaDonHang: ct.MaDonHang, MaHangHoa: ct.MaHangHoa } },
      update: ct,
      create: ct,
    });
  }
  console.log(`  ✅ ChiTietDonHang x${ctdhData.length}`);

  // ===========================================================
  // 9. GIAO HÀNG
  // ===========================================================
  console.log('\n📦 Tạo phiếu giao hàng...');

  await prisma.giaoHang.create({ data: { NgayGiao: pastDate(20), DonViVanChuyen: 'EMS',    TrangThai: 'DaGiao',      GhiChu: 'Giao đúng hẹn',                               MaDonHang: 7, MaTaiKhoan_NVKho: tkMap['nvkho1'] } });
  await prisma.giaoHang.create({ data: { NgayGiao: now,           DonViVanChuyen: 'VNPost', TrangThai: 'DangDongGoi',                                                        MaDonHang: 2, MaTaiKhoan_NVKho: tkMap['nvkho1'] } });
  await prisma.giaoHang.create({ data: { NgayGiao: pastDate(3),   DonViVanChuyen: 'GHTK',  TrangThai: 'DangGiao',    GhiChu: 'Thiếu 2 máy tính bàn và 2 bàn do hết hàng',  MaDonHang: 3, MaTaiKhoan_NVKho: tkMap['nvkho2'] } });
  console.log('  ✅ GiaoHang x3');

  // ===========================================================
  // 10. HÓA ĐƠN
  // ===========================================================
  console.log('\n📦 Tạo hóa đơn thanh toán...');

  await prisma.hoaDonThanhToan.create({
    data: { NgayLap: pastDate(18), TongTien: 10 * 15990000 + 5 * 8500000, TrangThai: 'DaThanhToan', GhiChu: 'Đã thanh toán đủ', PhuongThuc: 'ChuyenKhoan', MaDonHang: 7 },
  });
  await prisma.hoaDonThanhToan.create({
    data: { NgayLap: now,           TongTien: 5 * 15990000 + 10 * 4500000 + 5 * 5500000, TrangThai: 'ChoThanhToan', PhuongThuc: 'ChuyenKhoan', MaDonHang: 2 },
  });
  await prisma.hoaDonThanhToan.create({
    data: { NgayLap: pastDate(2),   TongTien: 6 * 12500000 + 4 * 12500000 + 3 * 3200000, TrangThai: 'ChoThanhToan', GhiChu: 'Chờ TT phần đã giao', PhuongThuc: 'TienMat', MaDonHang: 3 },
  });
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"HoaDonThanhToan"', 'MaHoaDon'), (SELECT COALESCE(MAX("MaHoaDon"), 3) FROM "HoaDonThanhToan"), true)`;
  console.log('  ✅ HoaDonThanhToan x3');

  // ===========================================================
  // KẾT THÚC
  // ===========================================================
  console.log('\n🎉 Seed data hoàn tất!');
  console.log(`📊 Tổng kết:`);
  console.log(`   - TaiKhoan:           ${tkData.length} tài khoản`);
  console.log(`   - CoQuanChinhPhu:     ${allAgencies.length} cơ quan`);
  console.log(`   - HangHoa:            ${hhData.length} mặt hàng`);
  console.log(`   - HopDong:            ${hdData.length} hợp đồng`);
  console.log(`   - DonDatHang:         ${dhData.length} đơn hàng`);
  console.log(`   - GiaoHang:           3 phiếu`);
  console.log(`   - HoaDonThanhToan:    3 hóa đơn`);
  console.log(`\n🔑 Mật khẩu mặc định: ${DEFAULT_PASSWORD}`);
  console.log(`📧 Tài khoản: admin@gsc.com (IT001) / nvhopdong1@gsc.com (NVHD001) / nvmuasam1@gsc.com (NVMS001) / ...\n`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error('❌ Lỗi seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
