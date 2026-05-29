const menuByRole = {
  Admin: ['Dashboard', 'Quản lý người dùng'],
  QuanLy: ['Dashboard', 'Báo cáo doanh thu', 'Báo cáo kho'],
  NhanVienHopDong: ['Hợp đồng', 'Duyệt đơn hàng'],
  NhanVienMuaSamCoQuan: ['Tạo đơn hàng', 'Đơn hàng của tôi'],
  NhanVienKho: ['Quản lý kho', 'Giao hàng'],
  NhanVienThanhToan: ['Hóa đơn', 'Thanh toán']
};

export default function Sidebar({ role, activePage, onSelect }) {
  const items = menuByRole[role] || [];

  return (
    <aside className="min-h-screen w-72 bg-slate-900 p-6 text-white">
      <h1 className="text-xl font-bold">GSC Procurement</h1>
      <p className="mt-1 text-sm text-slate-300">Vai trò: {role}</p>
      <nav className="mt-8 space-y-2">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
              activePage === item ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
            }`}
          >
            {item}
          </button>
        ))}
      </nav>
    </aside>
  );
}
