import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children, defaultPage }) {
  const { user, logout } = useAuthStore();
  const [activePage, setActivePage] = useState(defaultPage);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={user?.VaiTro} activePage={activePage} onSelect={setActivePage} />
      <main className="flex-1 p-8">
        <header className="mb-8 flex items-center justify-between rounded-xl bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{activePage}</h2>
            <p className="text-sm text-slate-500">Xin chào, {user?.TenNguoiDung}</p>
          </div>
          <button onClick={logout} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Đăng xuất
          </button>
        </header>
        {children(activePage)}
      </main>
    </div>
  );
}
