# GSC Procurement System - Database Design

## Công nghệ sử dụng

- **Database:** PostgreSQL
- **ORM:** Prisma
- **Pattern:** Table-per-Type (TPT) cho Subtyping kế thừa

---

## ERD Overview

```
TaiKhoan (Supertable)
├── Admin (dùng trực tiếp qua VaiTro=Admin)
├── QuanLy (MaTaiKhoan PK + FK → TaiKhoan, bảng riêng)
├── NhanVienHopDong (MaTaiKhoan PK + FK → TaiKhoan)
├── NhanVienMuaSamCoQuan (dùng TaiKhoanCoQuan + VaiTro)
├── NhanVienKho (MaTaiKhoan PK + FK → TaiKhoan)
└── NhanVienThanhToan (không có bảng riêng, dùng VaiTro)

CoQuanChinhPhu
    ↑ 1-N
TaiKhoanCoQuan

HopDong (N-1 CoQuanChinhPhu, N-1 NhanVienHopDong)
    ↑ 1-N
ChiTietHopDong (N-1 HangHoa)

DonDatHang (N-1 HopDong, N-1 NhanVienMuaSamCoQuan)
    ↑ 1-N
ChiTietDonHang (N-1 HangHoa)

GiaoHang (N-1 DonDatHang, N-1 NhanVienKho)
HoaDonThanhToan (1-1 DonDatHang, N-1 NhanVienThanhToan)
ThuTuChoi (N-1 DonDatHang, N-1 NhanVienHopDong)
```

---

## DBML (Database Markup Language)

```dbml
// ============================================
// GSC PROCUREMENT SYSTEM - FULL DBML
// Database: PostgreSQL
// ============================================

// ==========================================
// ENUMS
// ==========================================

Enum VaiTro {
  Admin
  NhanVienHopDong
  NhanVienMuaSamCoQuan
  NhanVienThanhToan
  NhanVienKho
  QuanLy
}

Enum TrangThaiTaiKhoan {
  HoatDong
  Khoa
}

Enum TrangThaiHopDong {
  HieuLuc
  HetHan
  TamDung
}

Enum TrangThaiDonHang {
  ChoDuyet
  DaDuyet
  SanSangGiao
  GiaoMotPhan
  DaGiao
  Huy
}

Enum TrangThaiGiaoHang {
  DangDongGoi
  DangGiao
  DaGiao
  ThatBai
}

Enum TrangThaiHoaDon {
  ChoThanhToan
  DaThanhToan
  QuaHan
  Huy
}

Enum TrangThaiHangHoa {
  CoDuong
  HetHang
}

// ==========================================
// BẢNG TÀI KHOẢN - SUPERTABLE
// ==========================================

Table TaiKhoan {
  MaTaiKhoan Int [pk, increment]           // Khóa chính tự động tăng
  TenNguoiDung String [unique, not null]            // Tên đăng nhập
  SDT String? [unique]                     // Số điện thoại
  Email String [unique, not null]          // Email
  MatKhau String [not null]                // Bcrypt hash
  VaiTro VaiTro [not null]                 // Phân quyền
  TrangThai TrangThaiTaiKhoan [default: 'HoatDong']
  createdAt DateTime [default: `now()`]
  updatedAt DateTime
}

// ==========================================
// BẢNG SUBTYPE (Table-per-Type)
// ==========================================

Table NhanVienHopDong {
  MaTaiKhoan Int [pk]                      // FK → TaiKhoan.MaTaiKhoan

  Indexes {
    (MaTaiKhoan) [pk]
  }
}

Table TaiKhoanCoQuan {
  MaTaiKhoan Int [pk]                      // FK → TaiKhoan.MaTaiKhoan
  MaCoQuan Int [not null]                  // FK → CoQuanChinhPhu.MaCoQuan

  Indexes {
    (MaTaiKhoan) [pk]
  }
}

// NhanVienThanhToan: không có bảng riêng, dùng trực tiếp qua VaiTro

Table QuanLy {
  MaTaiKhoan Int [pk]                      // FK → TaiKhoan.MaTaiKhoan

  Indexes {
    (MaTaiKhoan) [pk]
  }
}

Table NhanVienKho {
  MaTaiKhoan Int [pk]                      // FK → TaiKhoan.MaTaiKhoan

  Indexes {
    (MaTaiKhoan) [pk]
  }
}

// ==========================================
// CƠ QUAN CHÍNH PHỦ
// ==========================================

Table CoQuanChinhPhu {
  MaCoQuan Int [pk, increment]
  Ten String [not null]
  DiaChi String?
  createdAt DateTime [default: `now()`]
  updatedAt DateTime
}

// ==========================================
// HỢP ĐỒNG & CHI TIẾT
// ==========================================

Table HopDong {
  MaHopDong Int [pk, increment]
  NgayKy DateTime [not null]
  NgayHetHan DateTime [not null]
  TrangThai TrangThaiHopDong [default: 'HieuLuc']
  DieuKhoan String?
  MaTaiKhoan_NVHD Int [not null]           // FK → TaiKhoan (NhanVienHopDong)
  MaCoQuan Int [not null]                  // FK → CoQuanChinhPhu
  createdAt DateTime [default: `now()`]
  updatedAt DateTime

  Indexes {
    MaTaiKhoan_NVHD
    MaCoQuan
  }
}

Table ChiTietHopDong {
  MaHopDong Int [pk]                       // FK → HopDong
  MaHangHoa Int [pk]                       // FK → HangHoa
  SoTienToiDa Decimal [not null, precision: 18, scale: 2]
  createdAt DateTime [default: `now()`]

  Indexes {
    (MaHopDong, MaHangHoa) [pk]
  }
}

// ==========================================
// ĐƠN ĐẶT HÀNG & CHI TIẾT
// ==========================================

Table DonDatHang {
  MaDonHang Int [pk, increment]
  NgayDat DateTime [default: `now()`]
  TrangThai TrangThaiDonHang [default: 'ChoDuyet']
  TongTien Decimal [precision: 18, scale: 2]
  LuuY String?
  MaHopDong Int [not null]                 // FK → HopDong
  MaTaiKhoan_NVMS Int [not null]           // FK → TaiKhoan (NhanVienMuaSam)
  createdAt DateTime [default: `now()`]
  updatedAt DateTime

  Indexes {
    MaHopDong
    MaTaiKhoan_NVMS
  }
}

Table ChiTietDonHang {
  MaDonHang Int [pk]                       // FK → DonDatHang
  MaHangHoa Int [pk]                       // FK → HangHoa
  SoLuongDat Int [not null]
  SoLuongGiao Int [default: 0]             // Số thực tế được giao (xử lý hàng thiếu)
  DonGia Decimal [precision: 18, scale: 2] // Giá tại thời điểm đặt
  createdAt DateTime [default: `now()`]

  Indexes {
    (MaDonHang, MaHangHoa) [pk]
  }
}

// ==========================================
// HÀNG HÓA
// ==========================================

Table HangHoa {
  MaHangHoa Int [pk, increment]
  Ten String [not null]
  Gia Decimal [not null, precision: 18, scale: 2]
  SoLuongTrongKho Int [default: 0]
  ViTriKho String?                         // Vị trí lưu kho
  MoTa String?
  TrangThai TrangThaiHangHoa [default: 'CoDuong']
  createdAt DateTime [default: `now()`]
  updatedAt DateTime
}

// ==========================================
// GIAO HÀNG
// ==========================================

Table GiaoHang {
  MaGiaoHang Int [pk, increment]
  NgayGiao DateTime [default: `now()`]
  DonViVanChuyen String?
  TrangThai TrangThaiGiaoHang [default: 'DangDongGoi']
  GhiChu String?
  MaDonHang Int [not null]                 // FK → DonDatHang
  MaTaiKhoan_NVKho Int [not null]          // FK → TaiKhoan (NhanVienKho)
  createdAt DateTime [default: `now()`]
  updatedAt DateTime

  Indexes {
    MaDonHang
    MaTaiKhoan_NVKho
  }
}

// ==========================================
// HÓA ĐƠN THANH TOÁN
// ==========================================

Table HoaDonThanhToan {
  MaHoaDon Int [pk, increment]
  NgayLap DateTime [default: `now()`]
  HinhThucThanhToan String?
  TongTien Decimal [precision: 18, scale: 2] // Tính từ SoLuongGiao * DonGia
  TrangThai TrangThaiHoaDon [default: 'ChoThanhToan']
  GhiChu String?
  MaDonHang Int [not null]                 // FK → DonDatHang
  MaTaiKhoan_NVTT Int [not null]           // FK → TaiKhoan (NhanVienThanhToan)
  createdAt DateTime [default: `now()`]
  updatedAt DateTime

  Indexes {
    MaDonHang
    MaTaiKhoan_NVTT
  }
}

// ==========================================
// THƯ TỪ CHỐI
// ==========================================

Table ThuTuChoi {
  MaThuTuChoi Int [pk, increment]
  LiDo String [not null]
  NgayGui DateTime [default: `now()`]
  MaDonHang Int [not null]                 // FK → DonDatHang
  MaTaiKhoan_NVHD Int [not null]           // FK → TaiKhoan (NhanVienHopDong)
  createdAt DateTime [default: `now()`]

  Indexes {
    MaDonHang
  }
}

// ==========================================
// MỐI QUAN HỆ (RELATIONSHIPS)
// ==========================================

// --- Kế thừa (1-1) ---
Ref: NhanVienHopDong.MaTaiKhoan > TaiKhoan.MaTaiKhoan
Ref: TaiKhoanCoQuan.MaTaiKhoan > TaiKhoan.MaTaiKhoan
Ref: QuanLy.MaTaiKhoan > TaiKhoan.MaTaiKhoan
Ref: NhanVienKho.MaTaiKhoan > TaiKhoan.MaTaiKhoan

// --- Cơ quan chính phủ ---
Ref: TaiKhoanCoQuan.MaCoQuan > CoQuanChinhPhu.MaCoQuan
  // 1 Cơ quan có nhiều NV Mua sắm

// --- Hợp đồng ---
Ref: HopDong.MaTaiKhoan_NVHD > TaiKhoan.MaTaiKhoan
  // 1 NV Hợp đồng quản lý nhiều Hợp đồng
Ref: HopDong.MaCoQuan > CoQuanChinhPhu.MaCoQuan
  // 1 Cơ quan ký nhiều Hợp đồng

// --- Chi tiết hợp đồng ---
Ref: ChiTietHopDong.MaHopDong > HopDong.MaHopDong
  // ON DELETE CASCADE
Ref: ChiTietHopDong.MaHangHoa > HangHoa.MaHangHoa

// --- Đơn đặt hàng ---
Ref: DonDatHang.MaHopDong > HopDong.MaHopDong
  // 1 Hợp đồng có thể có nhiều Đơn hàng
Ref: DonDatHang.MaTaiKhoan_NVMS > TaiKhoan.MaTaiKhoan
  // 1 NV Mua sắm yêu cầu nhiều Đơn hàng

// --- Chi tiết đơn hàng ---
Ref: ChiTietDonHang.MaDonHang > DonDatHang.MaDonHang
  // ON DELETE CASCADE
Ref: ChiTietDonHang.MaHangHoa > HangHoa.MaHangHoa

// --- Giao hàng ---
Ref: GiaoHang.MaDonHang > DonDatHang.MaDonHang
  // 1 Đơn hàng có thể xuất kho nhiều lần giao
Ref: GiaoHang.MaTaiKhoan_NVKho > TaiKhoan.MaTaiKhoan
  // 1 NV Kho thực hiện nhiều Phiếu giao

// --- Hóa đơn ---
Ref: HoaDonThanhToan.MaDonHang > DonDatHang.MaDonHang
  // 1 Đơn hàng có 1 Hóa đơn thanh toán
Ref: HoaDonThanhToan.MaTaiKhoan_NVTT > TaiKhoan.MaTaiKhoan
  // 1 NV Thanh toán tạo nhiều Hóa đơn

// --- Thư từ chối ---
Ref: ThuTuChoi.MaDonHang > DonDatHang.MaDonHang
  // ON DELETE CASCADE
Ref: ThuTuChoi.MaTaiKhoan_NVHD > TaiKhoan.MaTaiKhoan
```

---

## Các nghiệp vụ quan trọng

### 1. Quản lý kho & Xử lý hàng thiếu
Khi duyệt đơn hàng, NV Kho kiểm tra tồn kho:
- Nếu `SoLuongTrongKho >= SoLuongDat` → `SoLuongGiao = SoLuongDat`, trừ kho
- Nếu `SoLuongTrongKho < SoLuongDat` → `SoLuongGiao = SoLuongTrongKho`, `SoLuongTrongKho = 0`
- Trạng thái đơn hàng: "SanSangGiao" hoặc "GiaoMotPhan"

### 2. Tính tiền hóa đơn
Tổng tiền hóa đơn = ∑(`SoLuongGiao` × `Gia`) từ ChiTietDonHang
→ **Không lấy TongTien gốc** của đơn hàng (vì có thể giao thiếu)

### 3. Ràng buộc đặt hàng
- Đơn hàng phải liên kết với Hợp đồng còn hạn
- Số lượng đặt không vượt quá hạn mức chi phí (SoTienToiDa) trong ChiTietHopDong

---

## Chú thích cải tiến

| Thay đổi | Lý do |
|----------|-------|
| Thêm `createdAt`/`updatedAt` cho tất cả bảng | Audit, truy vết |
| Thêm `HinhThucThanhToan`, `GhiChu`, `LuuY` | Nghiệp vụ thực tế |
| Thêm `ThuTuChoi` | Xử lý từ chối đơn hàng |
| Thêm `ViTriKho`, `MoTa`, `TrangThai` cho `HangHoa` | Quản lý kho chi tiết |
| `DonGia` trong `ChiTietDonHang` | Giá trị lịch sử khi giá thay đổi |
| Kiểu `Decimal(18,2)` thay vì `Float` | Tránh mất độ chính xác tiền tệ |
| `onDelete: Cascade` cho bảng chi tiết, `Restrict` cho bảng cha | Giữ toàn vẹn dữ liệu |
