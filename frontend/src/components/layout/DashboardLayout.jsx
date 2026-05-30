import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';

export default function DashboardLayout({ children, defaultPage }) {
  const { user, logout } = useAuthStore();
  const [activePage, setActivePage] = useState(defaultPage);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        role={user?.VaiTro}
        activePage={activePage}
        onSelect={setActivePage}
        onLogout={logout}
      />
      <main className="flex-1 p-8">
        <header className="mb-8 flex items-center justify-between gap-4 rounded-xl bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{activePage}</h2>
            <p className="text-sm text-slate-500">Xin chào, {user?.TenNguoiDung}</p>
          </div>
          <NotificationBell />
        </header>
        {children(activePage)}
      </main>
    </div>
  );
}
