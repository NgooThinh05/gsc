import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/LoginPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import InvoiceListPage from './pages/accounting/InvoiceListPage';
import ContractManagementPage from './pages/contracts/ContractManagementPage';
import OrderReviewPage from './pages/contracts/OrderReviewPage';
import CreateOrderPage from './pages/purchasing/CreateOrderPage';
import MyOrdersPage from './pages/purchasing/MyOrdersPage';
import DeliveryPage from './pages/delivery/DeliveryPage';
import WarehouseOrderDetailPage from './pages/warehouse/WarehouseOrderDetailPage';
import DashboardPage from './pages/manager/DashboardPage';
import RevenueReportPage from './pages/manager/RevenueReportPage';
import WarehouseReportPage from './pages/manager/WarehouseReportPage';
import AccountInfoPage from './pages/account/AccountInfoPage';
import { useAuthStore } from './store/authStore';

function PlaceholderPage({ title }) {
  return (
    <section className="rounded-xl bg-white p-8 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-slate-500">Module này đã có route backend nền tảng và có thể mở rộng UI ở phase tiếp theo.</p>
    </section>
  );
}

function getDefaultPage(role) {
  const defaults = {
    Admin: 'Dashboard',
    QuanLy: 'Dashboard',
    NhanVienHopDong: 'Hợp đồng',
    TaiKhoanCoQuan: 'Tạo đơn hàng',
    NhanVienKho: 'Quản lý kho',
    NhanVienThanhToan: 'Hóa đơn'
  };

  return defaults[role] || 'Dashboard';
}

function renderPage(activePage) {
  if (activePage === 'Thông tin tài khoản') return <AccountInfoPage />;
  if (activePage === 'Dashboard') return <DashboardPage />;
  if (activePage === 'Báo cáo doanh thu') return <RevenueReportPage />;
  if (activePage === 'Báo cáo kho') return <WarehouseReportPage />;
  if (activePage === 'Quản lý người dùng') return <UserManagementPage />;
  if (activePage === 'Hợp đồng') return <ContractManagementPage />;
  if (activePage === 'Duyệt đơn hàng') return <OrderReviewPage />;
  if (activePage === 'Tạo đơn hàng') return <CreateOrderPage />;
  if (activePage === 'Đơn hàng của tôi') return <MyOrdersPage />;
  if (activePage === 'Quản lý kho') return <WarehouseOrderDetailPage />;
  if (activePage === 'Giao hàng') return <DeliveryPage />;
  if (activePage === 'Hóa đơn') return <InvoiceListPage />;
  return <PlaceholderPage title={activePage} />;
}

export default function App() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <LoginPage />;
  }

  return <DashboardLayout defaultPage={getDefaultPage(user.VaiTro)}>{renderPage}</DashboardLayout>;
}
