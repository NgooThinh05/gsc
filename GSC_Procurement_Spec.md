Đóng vai là một Full-stack Senior Developer. Tôi cần bạn xây dựng một Hệ thống Quản lý Bán hàng B2B (Hợp đồng, Đơn hàng, Kho, Giao hàng, Thanh toán) dựa trên tài liệu thiết kế tôi cung cấp.

1. TECH STACK YÊU CẦU:
- Frontend: React.js (hoặc Next.js), TailwindCSS, Redux Toolkit (hoặc Zustand).
- Backend: Node.js, Express.js (hoặc NestJS).
- Database: PostgreSQL, ORM Prisma (hoặc Sequelize).
- Authentication: JWT (JSON Web Token).

2. CẤU TRÚC DATABASE (TỪ ERD):
Hệ thống sử dụng mô hình kế thừa tài khoản (Subtyping). Khóa chính của các bảng nhân viên là Khóa ngoại tham chiếu đến bảng TaiKhoan.
- TaiKhoan (MaTaiKhoan, TenNguoiDung, SDT, Email, MatKhau, VaiTro, TrangThai)
- NhanVienHopDong (MaTaiKhoan, ChucVu, ChungChi, HanMucDuyet)
- NhanVienMuaSamCoQuan (MaTaiKhoan, MaCoQuan, BoPhanCongTac)
- NhanVienThanhToan (MaTaiKhoan, MaSoKeToan, HanMucChiTra)
- NhanVienKho (MaTaiKhoan, KhuVucQuanLy, CaLam)
- CoQuanChinhPhu (MaCoQuan, Ten, DiaChi)
- HOP_DONG (MaHopDong, NgayKy, NgayHetHan, TrangThai, MaTaiKhoan_NVHD, MaCoQuan)
- ChiTietHopDong (MaHopDong, MaHangHoa, SoLuongToiDa, SoTienToiDa)
- DON_DAT_HANG (MaDonHang, NgayDat, TrangThai, TongTien, MaHopDong, MaTaiKhoan_NVMS)
- CHI_TIET_DON_HANG (MaDonHang, MaHangHoa, SoLuongDat, SoLuongGiao) -> Lưu ý: SoLuongGiao dùng để xử lý nghiệp vụ giao hàng thiếu/giao 1 phần.
- HANG_HOA (MaHangHoa, Ten, SoLuongTrongKho, Gia)
- GIAO_HANG (MaGiaoHang, NgayGiao, TrangThai, MaDonHang, MaTaiKhoan_NVKho)
- HOA_DON_THANH_TOAN (MaHoaDon, NgayLap, TongTien, TrangThai, MaDonHang, MaTaiKhoan_NVTT)

3. CÁC QUY TRÌNH NGHIỆP VỤ LÕI (TỪ DFD):
- Module 1.0 (Quản lý hợp đồng): NV Hợp đồng tạo và quản lý hợp đồng cho cơ quan chính phủ.
- Module 2.0 (Quản lý đơn hàng): NV Mua sắm (Khách hàng) đặt hàng dựa trên hợp đồng đã ký. NV Hợp đồng duyệt đơn.
- Module 3.0 (Quản lý kho - QUAN TRỌNG): Khi có đơn hàng, kiểm tra tồn kho. Nếu đủ -> Trừ tồn kho. Nếu thiếu -> Cập nhật SoLuongGiao < SoLuongDat, báo cáo hàng thiếu, vẫn cho phép xuất kho phần có sẵn.
- Module 4.0 (Giao hàng): NV Kho xác nhận đóng gói và xuất phiếu giao hàng cho phần hàng thực tế.
- Module 5.0 (Thanh toán): NV Thanh toán xuất hóa đơn dựa trên số lượng hàng thực tế đã giao thành công.
- Module 6.0 (Báo cáo): Quản lý xem Dashboard thống kê doanh thu, kho, đơn hàng.
- Module 7.0 (Quản lý người dùng): Admin (IT) thêm/sửa/xóa/phân quyền các loại tài khoản.

4. YÊU CẦU GIAO DIỆN (ROLE-BASED UI):
Mỗi VaiTro khi đăng nhập sẽ vào một Dashboard riêng biệt, chỉ thấy các Sidebar Menu thuộc thẩm quyền của mình.

Nếu bạn đã hiểu toàn bộ kiến trúc và logic này, hãy trả lời "ĐÃ HIỂU VÀ SẴN SÀNG". Đừng viết code vội, tôi sẽ yêu cầu bạn code từng phần ở các câu lệnh tiếp theo.

Tuyệt vời. Bây giờ chúng ta bắt đầu Phase 1: Database và Authentication.

1. Hãy viết mã Prisma Schema (`schema.prisma`) hoặc SQL Script (PostgreSQL) để khởi tạo toàn bộ các bảng, các mối quan hệ (Foreign Keys 1-1 cho Subtyping, 1-N cho các bảng còn lại). 
2. Viết logic Backend (Node.js/Express) cho API Đăng nhập (`/api/auth/login`). Khi user đăng nhập thành công, token trả về phải chứa thông tin `VaiTro` để Frontend điều hướng.
3. Viết Middleware `verifyRole` để bảo vệ các API Routes (Ví dụ: chỉ 'NhanVienKho' mới được gọi API '/api/delivery').

Hãy cung cấp code đầy đủ, cấu trúc thư mục rõ ràng.

Phase 2: Backend & Frontend cho Module Hợp đồng và Đơn hàng.
1. Viết API (Backend) để NV Hợp đồng tạo Hợp đồng mới và thêm Chi tiết hợp đồng.
2. Viết API để NV Mua Sắm tạo Đơn đặt hàng. Logic bắt buộc: Đơn hàng phải liên kết với một Hợp đồng còn hạn, và số lượng đặt không được vượt quá số lượng tối đa trong ChiTietHopDong.
3. Viết UI Component (React/Next.js) bằng TailwindCSS cho màn hình "Tạo Đơn Hàng" của Nhân viên mua sắm.

Phase 3: Backend & Frontend cho Module Quản lý Kho (Xử lý hàng thiếu).
1. Viết API xử lý duyệt đơn hàng cho NV Kho. 
Logic lõi: Khi truyền vào MaDonHang, vòng lặp kiểm tra bảng HANG_HOA. Nếu SoLuongTrongKho >= SoLuongDat -> Gán SoLuongGiao = SoLuongDat, trừ kho. Nếu SoLuongTrongKho < SoLuongDat -> Gán SoLuongGiao = SoLuongTrongKho, SoLuongTrongKho = 0.
2. API phải cập nhật bảng CHI_TIET_DON_HANG và chuyển trạng thái Đơn hàng thành "Giao một phần" hoặc "Sẵn sàng giao".
3. Viết UI Component hiển thị chi tiết đơn hàng cho NV Kho, bôi đỏ những dòng sản phẩm bị thiếu hàng so với yêu cầu đặt.

Phase 4: Giao hàng và Thanh toán.
1. Viết API cho NV Kho tạo Phiếu GIAO_HANG.
2. Viết API cho NV Thanh toán tạo HOA_DON_THANH_TOAN. Lưu ý: Tiền hóa đơn phải được tính toán bằng vòng lặp: Sum(SoLuongGiao * Gia) từ CHI_TIET_DON_HANG, TUYỆT ĐỐI KHÔNG lấy theo trường TongTien gốc của Đơn đặt hàng (vì có thể giao thiếu).
3. Cung cấp UI Component hiển thị danh sách Hóa đơn cho màn hình của Kế toán.